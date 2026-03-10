import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import axios from 'axios';
import NewsMemory from '../../../../models/NewsMemory';
import Post from '../../../../models/Post';
import { generateGoogleEmbedding, cosineSimilarity } from '../../../../lib/embeddings';
import { getGeminiResponse } from '../../../../utils/gemini';

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app');
}

async function findSimilarPosts(queryEmbedding, topK = 5) {
  const memories = await NewsMemory.find({ embedding: { $exists: true, $not: { $size: 0 } } })
    .select('processedContent location sourceId embedding')
    .limit(500);

  return memories
    .map(m => ({
      ...m.toObject(),
      score: cosineSimilarity(queryEmbedding, m.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

async function getNewsLinks(query) {
  if (!process.env.NEWS_API_KEY) return [];
  try {
    const res = await axios.get('https://newsapi.org/v2/everything', {
      params: { q: query, sortBy: 'publishedAt', pageSize: 4, language: 'en', apiKey: process.env.NEWS_API_KEY }
    });
    return res.data.articles.map(a => ({ title: a.title, url: a.url, date: a.publishedAt }));
  } catch {
    return [];
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'You must be signed in to use this feature' }, { status: 401 });
    }

    const { query, location } = await request.json();
    if (!location || location.trim() === '') {
      return NextResponse.json({ error: 'Please provide a location' }, { status: 400 });
    }

    await connectToDatabase();

    const searchText = query ? `${query} ${location}` : location;
    const queryEmbedding = await generateGoogleEmbedding(searchText);
    let similarPosts = await findSimilarPosts(queryEmbedding);

    // If no indexed results, fall back to searching posts directly by location
    if (similarPosts.length === 0) {
      const locationRegex = new RegExp(location.split(',')[0].trim(), 'i');
      const recentPosts = await Post.find({ location: locationRegex })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('content location _id');
      similarPosts = recentPosts.map(p => ({
        processedContent: p.content,
        location: p.location,
        sourceId: p._id,
        score: 1
      }));
    }

    // Fetch news in parallel with post search
    const newsLinks = await getNewsLinks(query ? `${query} ${location}` : location);

    const communityContext = similarPosts.map((p, i) => `[Report ${i + 1}] ${p.processedContent} (Location: ${p.location || 'Unknown'})`).join('\n');
    const newsContext = newsLinks.map((n, i) => `[Article ${i + 1}] "${n.title}" — ${new Date(n.date).toLocaleDateString()}`).join('\n');

    const systemInstruction = `You are Eko AI, a crisis intelligence analyst. Your task is to produce a concise, well-structured situation summary by synthesizing community reports and news articles about a specific location. Rules:
- Write in plain text only, no markdown formatting.
- Be direct and factual. Do not hedge or add disclaimers.
- Summarize and combine information across all provided sources into a coherent briefing.
- When community reports exist, directly reference what people on the ground are saying (e.g. "Residents report...", "Community members describe...").
- When news articles exist, weave their key developments into the summary.
- Never say "I have no information" or "no data available". Always produce a substantive summary.
- If sources are limited, use your own knowledge about the region to fill gaps and provide context.`;

    const userPrompt = `QUERY: "${query || 'General situation update'}" in ${location}

--- COMMUNITY REPORTS (from people on the ground) ---
${communityContext || 'No community reports available for this area.'}

--- NEWS ARTICLES (from media sources) ---
${newsContext || 'No recent news articles found.'}

Write a situation summary in 4-6 sentences that:
1. Opens with the current key situation or crisis at ${location}
2. Synthesizes details from the community reports — quote or paraphrase specific observations people have shared
3. Integrates relevant developments from the news articles
4. Closes with the overall outlook or what to watch for

Provide the summary directly, no titles or labels.`;

    let answer;
    try {
      answer = await getGeminiResponse(userPrompt, systemInstruction);
    } catch (err) {
      console.error('Gemini response failed:', err);
      // Build a manual summary from available sources as fallback
      const summaryParts = [];
      if (similarPosts.length > 0) {
        const topReports = similarPosts.slice(0, 3).map(p => p.processedContent.substring(0, 120)).join('. ');
        summaryParts.push(`Community reports from ${location}: ${topReports}.`);
      }
      if (newsLinks.length > 0) {
        const headlines = newsLinks.slice(0, 3).map(n => n.title).join('; ');
        summaryParts.push(`Recent news: ${headlines}.`);
      }
      answer = summaryParts.length > 0
        ? summaryParts.join(' ')
        : `No reports or news currently available for ${location}. Please try again later.`;
    }

    return NextResponse.json({
      answer,
      relatedPosts: similarPosts.map(p => ({
        id: p.sourceId,
        snippet: p.processedContent.substring(0, 150)
      })),
      newsLinks
    });
  } catch (error) {
    console.error('Error in news-tracker search:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
