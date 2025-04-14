import { HfInference } from '@huggingface/inference';
import axios from 'axios';

// Initialize Hugging Face inference
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Updated model IDs focused on publicly available models without special permissions
const EMBEDDING_MODEL = 'sentence-transformers/all-mpnet-base-v2'; // Embedding model
const CONTEXT_MODEL = 'google/flan-t5-xxl'; // More accessible model for context understanding
const BACKUP_CONTEXT_MODEL = 'gpt2-xl'; // Further fallback if needed
const FAKE_NEWS_DETECTION_MODEL = 'facebook/bart-large-mnli'; // For fake news classification

/**
 * Generate embeddings for text using a sentence transformer model
 * @param {string} text - Text to generate embeddings for
 * @returns {Array<number>} - Vector of embeddings
 */
export async function generateEmbeddings(text) {
  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: text,
    });
    return result;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Check if text contains potential misinformation using a classifier
 * @param {string} content - Content to check
 * @returns {Object} - Classification results with confidence scores
 */
export async function checkFakeNews(content) {
  try {
    const result = await hf.zeroShotClassification({
      model: FAKE_NEWS_DETECTION_MODEL,
      inputs: content,
      parameters: { 
        candidate_labels: [
          "factual information", 
          "misinformation", 
          "unverified claim",
          "opinion",
          "factual but misleading"
        ] 
      }
    });
    
    return {
      classification: result.labels[0],
      confidence: result.scores[0],
      allResults: result
    };
  } catch (error) {
    console.error('Error checking fake news:', error);
    return { classification: "unknown", confidence: 0, error: error.message };
  }
}

/**
 * Process content using LLM to extract and summarize news information with fake news detection
 * @param {string} content - Raw content from posts/comments
 * @returns {string} - Processed content with credibility assessment
 */
export async function processContentWithLLM(content) {
  try {
    // First perform fake news detection
    const credibilityCheck = await checkFakeNews(content);
    
    const prompt = `
Analyze this social media content and extract key factual information.
Focus on events, locations, dates, and verifiable facts. Disregard opinions and subjective statements.
Format the output as a clean, concise summary of factual information only.
Include a credibility assessment based on the content's linguistic patterns.

Content: "${content}"

Credibility classification: ${credibilityCheck.classification} (confidence: ${Math.round(credibilityCheck.confidence * 100)}%)

Factual summary with credibility assessment:`;

    const result = await hf.textGeneration({
      model: CONTEXT_MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.3,
      },
    });

    return result.generated_text.trim();
  } catch (error) {
    console.error('Error processing content with LLM:', error);
    // Return a simplified version if the LLM fails
    return `Summary of content: ${content.substring(0, 300)}... 
(Note: Automated processing was limited due to technical issues)`;
  }
}

/**
 * Get real-time news information from external APIs for specific locations
 * @param {string} location - Location to get news for
 * @returns {string} - Summarized real-time news
 */
export async function getRealTimeNewsForLocation(location) {
  try {
    // Use NewsAPI (free tier) or similar service
    // You would need to register for an API key if implementing this for real
    const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
    
    if (!NEWS_API_KEY) {
      console.warn('No NEWS_API_KEY provided, skipping real-time news integration');
      return '';
    }
    
    const response = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: `${location} disaster OR crisis OR emergency OR conflict`,
        sortBy: 'publishedAt',
        apiKey: NEWS_API_KEY,
        language: 'en',
        pageSize: 5
      }
    });
    
    if (response.data && response.data.articles && response.data.articles.length > 0) {
      // Extract headlines and publication dates
      const newsItems = response.data.articles.map(article => 
        `- ${article.title} (${new Date(article.publishedAt).toLocaleDateString()})`
      ).join('\n');
      
      return `Recent external news about ${location}:\n${newsItems}`;
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching real-time news:', error);
    return '';
  }
}

/**
 * Generate a response to a query based on memory context and external information
 * @param {string} query - User query or structured prompt
 * @param {Array<string>} contexts - Relevant memory contexts
 * @returns {string} - Generated response
 */
export async function generateResponseFromMemory(query, contexts) {
  try {
    const contextText = contexts.join('\n\n');
    
    // Check if this is a structured prompt from the news tracker
    // These prompts contain formatting instructions already
    const isStructuredPrompt = query.includes('DIRECT_ANSWER:') || 
                              query.includes('LOCATION_SUMMARY:') ||
                              query.includes('COMMUNITY_INFO:') ||
                              query.includes('ADDITIONAL_CONTEXT:');
    
    let prompt;
    let location = '';
    
    if (isStructuredPrompt) {
      // Use the provided structured prompt directly
      console.log('Using provided structured prompt');
      prompt = query;
      
      // Try to extract location from the structured prompt
      const locationMatch = prompt.match(/location:\s*([^.\n]+)/i);
      if (locationMatch) {
        location = locationMatch[1].trim();
      }
    } else {
      // Use the original approach for regular queries
      // Extract potential location from query
      const locationMatch = query.match(/\b(?:in|at|near|around|about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
      location = locationMatch ? locationMatch[1] : '';
      
      // If no location found with prepositions, try to extract named locations
      if (!location) {
        const placesMatch = query.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
        if (placesMatch && placesMatch.length > 0) {
          // Filter out common non-location capitalized words
          const commonWords = ['I', 'What', 'Where', 'When', 'How', 'Who', 'Why', 'Is', 'Are', 'Can', 'Could', 'Would', 'Should', 'The', 'A', 'An'];
          const possibleLocations = placesMatch.filter(word => !commonWords.includes(word));
          if (possibleLocations.length > 0) {
            location = possibleLocations[0];
          }
        }
      }
      
      // Get real-time news for location if available
      let externalNews = '';
      if (location) {
        externalNews = await getRealTimeNewsForLocation(location);
      }
      
      // Check if the context contains potential misinformation
      let credibilityScores = [];
      try {
        credibilityScores = await Promise.all(
          contexts.map(async (context) => {
            const check = await checkFakeNews(context);
            return `- Content credibility: ${check.classification} (${Math.round(check.confidence * 100)}% confidence)`;
          })
        );
      } catch (credError) {
        console.error('Error checking credibility:', credError);
        credibilityScores = ['- Content credibility analysis unavailable'];
      }
      
      prompt = `
You are an AI assistant specialized in analyzing social media posts about events and emergencies.
Your goal is to provide accurate information while highlighting potential misinformation.

CONTEXT FROM COMMUNITY POSTS:
${contextText}

${credibilityScores.length > 0 ? `CREDIBILITY ANALYSIS:\n${credibilityScores.join('\n')}\n` : ''}

${externalNews ? `EXTERNAL NEWS SOURCES:\n${externalNews}\n` : ''}

USER QUESTION: ${query}

Provide a comprehensive answer that:
1. Clearly states what information comes from community reports vs. external sources
2. Highlights any discrepancies or potential misinformation
3. Indicates confidence level in the information
4. If about a specific location (${location || 'none detected'}), focuses on that area's situation
5. If you don't have enough reliable information, clearly state this limitation

ANSWER:`;
    }

    console.log(`Sending prompt to model: ${CONTEXT_MODEL}`);
    
    // First try with a model that should be accessible to free tier
    try {
      const result = await hf.textGeneration({
        model: CONTEXT_MODEL,
        inputs: prompt,
        parameters: {
          max_new_tokens: isStructuredPrompt ? 800 : 400,
          temperature: 0.3,
          return_full_text: false
        },
      });
      
      console.log(`Received response of length: ${result.generated_text.length}`);
      return result.generated_text.trim();
    } catch (modelError) {
      console.error(`Error with model ${CONTEXT_MODEL}:`, modelError);
      
      // If the first model fails, try the backup model
      console.log(`Trying backup model: ${BACKUP_CONTEXT_MODEL}`);
      try {
        const backupResult = await hf.textGeneration({
          model: BACKUP_CONTEXT_MODEL,
          inputs: prompt.substring(0, 1000), // Truncate for simpler models
          parameters: {
            max_new_tokens: 300,
            temperature: 0.5,
            return_full_text: false
          },
        });
        
        return backupResult.generated_text.trim();
      } catch (backupError) {
        console.error(`Error with backup model ${BACKUP_CONTEXT_MODEL}:`, backupError);
        throw new Error("HuggingFace models unavailable");
      }
    }
  } catch (error) {
    console.error('Error generating response:', error);
    
    // Since HuggingFace integration is failing, inform the caller so it can use OpenAI
    throw new Error("HuggingFace API unavailable, try OpenAI fallback");
  }
}

export default {
  generateEmbeddings,
  processContentWithLLM,
  generateResponseFromMemory,
  checkFakeNews,
  getRealTimeNewsForLocation
};