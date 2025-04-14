import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import axios from 'axios';
import Post from '../../../../models/Post';
import https from 'https';
import * as huggingface from '../../../../utils/huggingface';
import * as gemini from '../../../../utils/gemini';

// Database connection function
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

/**
 * Get expanded news articles for a location
 */
async function getExpandedNewsForLocation(location) {
  try {
    const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
    
    if (!NEWS_API_KEY) {
      console.warn('No NEWS_API_KEY provided, using mock news');
      return [
        {
          title: `Local authorities report on ${location} situation`,
          publishedAt: new Date().toISOString(),
          url: '#',
          source: { name: 'News Source' }
        }
      ];
    }
    
    const response = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: `${location}`,
        sortBy: 'publishedAt',
        apiKey: NEWS_API_KEY,
        language: 'en',
        pageSize: 7
      }
    });
    
    if (response.data && response.data.articles && response.data.articles.length > 0) {
      return response.data.articles.slice(0, 7).map(article => ({
        title: article.title,
        publishedAt: article.publishedAt,
        url: article.url,
        source: article.source
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching expanded news:', error);
    return [];
  }
}

/**
 * Clean text by removing asterisks and fixing formatting
 */
function cleanResponseText(text) {
  if (!text) return '';
  
  // Remove any markdown-style asterisks (bold/italic formatting)
  let cleaned = text.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/\*/g, '');
  
  // Remove trailing enumerations like "2." or "1." that make the response look incomplete
  cleaned = cleaned.replace(/\s+\d+\.\s*$/g, '');
  
  // Also remove any hanging enumeration at the end with no content
  if (cleaned.match(/\n\s*\d+\.\s*$/)) {
    cleaned = cleaned.replace(/\n\s*\d+\.\s*$/g, '');
  }
  
  return cleaned;
}

export async function POST(request) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to use this feature" },
        { status: 401 }
      );
    }
    
    // Extract query and location from request body
    const { query, location } = await request.json();
    
    // Make location mandatory
    if (!location || location.trim() === "") {
      return NextResponse.json(
        { error: "Please provide a location" },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Build search query - always filter by location
    let searchQuery = {
      location: { $regex: location, $options: 'i' }
    };
    
    // Find relevant posts
    const posts = await Post.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    
    // Process posts into context format for LLM
    const contexts = posts && posts.length > 0 
      ? posts.map(post => {
          return `Post ID:${post._id} (${new Date(post.createdAt).toISOString().split('T')[0]}): ${post.content}${post.location ? ` [Location: ${post.location}]` : ''}`;
        })
      : [`No community posts found for ${location}.`];
    
    // Prepare community posts information with links
    let communityPosts = [];
    let communityInfoNotice = "";
    
    if (!posts || posts.length === 0) {
      communityInfoNotice = `No relevant posts found for ${location} in the community data.`;
    } else {
      communityPosts = posts.map(post => ({
        id: post._id.toString(),
        content: post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content,
        date: new Date(post.createdAt).toISOString().split('T')[0],
        location: post.location
      }));
    }
    
    // Get external news data for the location - this will be used in the Additional Information section
    const newsArticles = await getExpandedNewsForLocation(location);
    console.log(`Retrieved ${newsArticles.length} news articles for ${location}`);

    // Also get the standard external news for context for the AI
    let externalNews = "";
    try {
      externalNews = await huggingface.getRealTimeNewsForLocation(location);
      console.log("Retrieved external news data for context");
    } catch (newsError) {
      console.error("Failed to get external news:", newsError);
    }
    
    // Check if we're in API outage mode (for rate limits)
    // Use timestamp to check if we should try again (avoid hitting rate limits repeatedly)
    const OUTAGE_CACHE_TIME = 60 * 1000; // 60 seconds
    const apiOutageCache = global.apiOutageTimestamp || 0;
    const currentTime = Date.now();
    
    // If it's been less than the cache time since our last outage, skip API calls
    if (currentTime - apiOutageCache < OUTAGE_CACHE_TIME) {
      console.log("API services in timeout mode due to recent rate limiting. Serving static response.");
      return generateStaticFallbackResponse(location, query, posts, communityPosts, communityInfoNotice, newsArticles);
    }
    
    // Try to use AI services
    try {
      // Skip Hugging Face since we know it has permission issues
      
      // Try with Gemini API first
      try {
        console.log("Using Gemini AI for news tracker response");
        
        // Determine if this is a question or general news request
        const isQuestion = query && query.trim() !== "" && (
          query.includes("?") || 
          query.toLowerCase().startsWith("what") || 
          query.toLowerCase().startsWith("who") || 
          query.toLowerCase().startsWith("when") ||
          query.toLowerCase().startsWith("where") ||
          query.toLowerCase().startsWith("why") ||
          query.toLowerCase().startsWith("how")
        );
        
        // Create an appropriate prompt for Gemini
        const postsContext = contexts.join('\n\n');
        
        // Format the prompt for Gemini - NOT requesting news in the prompt, as we'll handle that separately
        let promptText;
        if (isQuestion) {
          promptText = `
LOCATION: ${location}
USER QUESTION: ${query}

COMMUNITY POSTS:
${posts && posts.length > 0 ? postsContext : "No community posts found for this location."}

${externalNews ? `EXTERNAL NEWS:\n${externalNews}\n` : ''}

Please provide the following:

1. DIRECT_ANSWER: Give a specific answer to the question "${query}" about ${location}. Use information from community posts and your knowledge.

2. COMMUNITY_INFO: If there are community posts available, summarize what they tell us about this location and question.

Do not use any asterisks (*) or markdown formatting in your response. Write in plain text only.`;
        } else {
          // General news about the location
          promptText = `
LOCATION: ${location}

COMMUNITY POSTS:
${posts && posts.length > 0 ? postsContext : "No community posts found for this location."}

${externalNews ? `EXTERNAL NEWS:\n${externalNews}\n` : ''}

Please provide the following:

1. LOCATION_SUMMARY: Provide a concise summary of the current situation in ${location}.

2. COMMUNITY_INFO: If there are community posts available, summarize what they tell us about this location.

Do not use any asterisks (*) or markdown formatting in your response. Write in plain text only.`;
        }
        
        // Call Gemini API
        const geminiResponse = await gemini.getGeminiResponse(
          isQuestion ? query : `Information about ${location}`, 
          promptText
        );
        
        console.log("Received response from Gemini");
        
        // Extract sections from the response
        let directAnswer = "";
        let communityInfo = posts && posts.length > 0 
          ? "Processing community information..." 
          : communityInfoNotice;
        
        // Parse the response to extract different sections
        if (isQuestion && geminiResponse.includes("DIRECT_ANSWER:")) {
          const directAnswerMatch = geminiResponse.match(/DIRECT_ANSWER:([\s\S]*?)(?=COMMUNITY_INFO:|$)/);
          if (directAnswerMatch && directAnswerMatch[1]) {
            directAnswer = cleanResponseText(directAnswerMatch[1].trim());
          }
        } else if (!isQuestion && geminiResponse.includes("LOCATION_SUMMARY:")) {
          const summaryMatch = geminiResponse.match(/LOCATION_SUMMARY:([\s\S]*?)(?=COMMUNITY_INFO:|$)/);
          if (summaryMatch && summaryMatch[1]) {
            directAnswer = cleanResponseText(summaryMatch[1].trim());
          }
        }
        
        if (geminiResponse.includes("COMMUNITY_INFO:")) {
          const communityMatch = geminiResponse.match(/COMMUNITY_INFO:([\s\S]*?)$/);
          if (communityMatch && communityMatch[1]) {
            communityInfo = cleanResponseText(communityMatch[1].trim());
          }
        }
        
        // If we couldn't parse the sections properly, use the full response
        if (!directAnswer) {
          directAnswer = isQuestion ? 
            `Regarding your question about ${query} in ${location}:` : 
            `Here's information about ${location}:`;
          directAnswer += "\n\n" + cleanResponseText(geminiResponse);
        }

        // Format the news articles for the Additional Information section
        let newsListHtml = "Latest news about this location:\n\n";
        
        if (newsArticles.length === 0) {
          newsListHtml += "No recent news articles found for this location.";
        } else {
          newsArticles.forEach((article, index) => {
            const date = new Date(article.publishedAt).toLocaleDateString();
            newsListHtml += `${index + 1}. ${article.title} (${date}) - ${article.source?.name || 'News Source'}\n`;
          });
        }

        return NextResponse.json({
          directAnswer,
          communityInfo,
          grokResponse: newsListHtml,
          newsArticles: newsArticles,
          communityPosts: communityPosts,
          source: "gemini"
        });
        
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        
        // Fall back to OpenAI/Grok
        console.log("Falling back to OpenAI API");
        
        // Check for API key
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.GROK_API_KEY;
        
        if (!OPENAI_API_KEY) {
          throw new Error("No API keys available");
        }
        
        // Create a custom HTTPS agent that doesn't check the certificate hostname
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        });

        // Determine if this is a question
        const isQuestion = query && query.trim() !== "" && (
          query.includes("?") || query.toLowerCase().startsWith("what") || 
          query.toLowerCase().startsWith("who") || query.toLowerCase().startsWith("when") ||
          query.toLowerCase().startsWith("where") || query.toLowerCase().startsWith("why") || 
          query.toLowerCase().startsWith("how")
        );
        
        // Prepare a simple prompt to avoid token limit issues - no asterisks!
        const simplifiedPrompt = isQuestion ? 
          `Answer this question about ${location}: "${query}". Include what is known from community posts and general knowledge. Do not use markdown or asterisks in your response.` :
          `Provide current information about ${location}, including any notable recent events. Do not use markdown or asterisks in your response.`;
        
        try {
          // Try OpenAI API with simplified prompt
          let apiUrl = 'https://api.openai.com/v1/chat/completions';
          let apiModel = 'gpt-3.5-turbo';
          let authHeader = `Bearer ${OPENAI_API_KEY}`;
          
          const apiResponse = await axios({
            method: 'post',
            url: apiUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            data: {
              model: apiModel,
              messages: [
                { 
                  role: 'system', 
                  content: `You are a helpful AI assistant that provides factual information about locations. You are focusing on ${location}. Do not use markdown formatting like asterisks in your response.` 
                },
                { role: 'user', content: simplifiedPrompt }
              ],
              temperature: 0.3,
              max_tokens: 300 // Reduced to avoid hitting rate limits
            },
            httpsAgent: httpsAgent
          });
          
          // Extract response content
          let responseText = "";
          if (apiResponse.data.choices && apiResponse.data.choices.length > 0 && apiResponse.data.choices[0].message) {
            responseText = cleanResponseText(apiResponse.data.choices[0].message.content.trim());
          } else {
            throw new Error('Unexpected API response format');
          }
          
          // Format the response with community posts if available
          const directAnswer = responseText;
          let communityInfo = posts && posts.length > 0 ? 
            "Community posts are available below. These may contain additional information." : 
            communityInfoNotice;
          
          // Format the news articles for the Additional Information section
          let newsListHtml = "Latest news about this location:\n\n";
        
          if (newsArticles.length === 0) {
            newsListHtml += "No recent news articles found for this location.";
          } else {
            newsArticles.forEach((article, index) => {
              const date = new Date(article.publishedAt).toLocaleDateString();
              newsListHtml += `${index + 1}. ${article.title} (${date}) - ${article.source?.name || 'News Source'}\n`;
            });
          }

          // Return the enhanced response with community posts
          return NextResponse.json({
            directAnswer,
            communityInfo,
            grokResponse: newsListHtml,
            newsArticles: newsArticles,
            communityPosts: communityPosts,
            source: "openai-simplified"
          });
          
        } catch (openaiError) {
          console.error('OpenAI fallback error:', openaiError);
          
          // Check if we hit a rate limit (status 429)
          if (openaiError.response && openaiError.response.status === 429) {
            // Set the global outage timestamp to prevent hitting rate limits again
            global.apiOutageTimestamp = currentTime;
            console.log("Rate limit detected. Entering API timeout mode for", OUTAGE_CACHE_TIME/1000, "seconds");
          }
          
          // All API services failed, use static fallback
          throw new Error("All AI services failed");
        }
      }
    } catch (apiError) {
      console.error("All API services failed:", apiError.message);
      
      // Return static fallback response when all APIs fail
      return generateStaticFallbackResponse(location, query, posts, communityPosts, communityInfoNotice, newsArticles);
    }
  } catch (error) {
    console.error('Error in news-tracker search:', error);
    return NextResponse.json(
      { error: "An internal error occurred" },
      { status: 500 }
    );
  }
}

/**
 * Generate a static fallback response when all APIs are unavailable
 */
function generateStaticFallbackResponse(location, query, posts, communityPosts, communityInfoNotice, newsArticles) {
  const isQuestion = query && query.trim() !== "" && (
    query.includes("?") || query.toLowerCase().startsWith("what") || 
    query.toLowerCase().startsWith("who") || query.toLowerCase().startsWith("when") ||
    query.toLowerCase().startsWith("where") || query.toLowerCase().startsWith("why") || 
    query.toLowerCase().startsWith("how")
  );

  // Format the news articles for the Additional Information section
  let newsListHtml = "Latest news about this location:\n\n";
  
  if (newsArticles.length === 0) {
    newsListHtml += "No recent news articles found for this location.";
  } else {
    newsArticles.forEach((article, index) => {
      const date = new Date(article.publishedAt).toLocaleDateString();
      newsListHtml += `${index + 1}. ${article.title} (${date}) - ${article.source?.name || 'News Source'}\n`;
    });
  }

  // Create a basic but useful response when AI services aren't available
  let response = {
    directAnswer: isQuestion 
      ? `I don't have specific information about "${query}" for ${location} at the moment. Please check the community posts below for relevant information, or try again later.`
      : `I don't have the latest information about ${location} at the moment. Please check the community posts below, or try again later.`,
    communityInfo: posts && posts.length > 0 
      ? `There are ${posts.length} community posts about ${location}. You can view them below.` 
      : communityInfoNotice,
    grokResponse: newsListHtml,
    newsArticles: newsArticles,
    communityPosts: communityPosts,
    source: "static-fallback",
    serviceStatus: "AI services are currently unavailable or rate-limited. You're seeing a simplified response."
  };

  return NextResponse.json(response);
}
