import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import NewsMemory from '../../../../models/NewsMemory';
import NewsQuery from '../../../../models/NewsQuery';
import { generateGoogleEmbedding, cosineSimilarity } from '../../../../lib/embeddings';
import { getGeminiResponse } from '../../../../utils/gemini';

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app');
}

async function findRelevantMemories(query, location = null, limit = 5) {
  const queryEmbedding = await generateGoogleEmbedding(query);

  const matchCriteria = { embedding: { $exists: true, $not: { $size: 0 } } };
  if (location) {
    matchCriteria.location = { $regex: location, $options: 'i' };
  }

  const memories = await NewsMemory.find(matchCriteria)
    .select('processedContent location sourceId embedding')
    .limit(500);

  return memories
    .map(m => ({
      ...m.toObject(),
      score: cosineSimilarity(queryEmbedding, m.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { query, location } = await request.json();
    if (!query || query.trim() === '') {
      return NextResponse.json({ message: 'Query is required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const newsQuery = new NewsQuery({
      user: user._id,
      query: query.trim(),
      location: location?.trim(),
      status: 'pending'
    });
    await newsQuery.save();

    const memories = await findRelevantMemories(query, location);

    const context = memories.length > 0
      ? memories.map(m => `- ${m.processedContent}`).join('\n')
      : 'No community posts available.';

    const prompt = `You are a crisis/news assistant. Answer the user's question using ONLY the community posts below as your source.
Be factual. If the posts don't have enough info, say so clearly.

COMMUNITY POSTS:
${context}

QUESTION: ${query}

Answer in 2-3 sentences max.`;

    newsQuery.relatedMemories = memories.map(m => m._id);

    let geminiResponse;
    try {
      geminiResponse = await getGeminiResponse(query, prompt);
    } catch {
      geminiResponse = memories.length > 0
        ? `Found ${memories.length} related community posts but could not generate a summary. Check related posts for details.`
        : "No relevant community information found for this query.";
    }

    newsQuery.localModelResponse = context;
    newsQuery.grokResponse = geminiResponse;
    newsQuery.status = 'processed';
    await newsQuery.save();

    return NextResponse.json({
      id: newsQuery._id,
      query: newsQuery.query,
      location: newsQuery.location,
      localModelResponse: context,
      grokResponse: geminiResponse,
      status: 'processed',
      createdAt: newsQuery.createdAt
    });
  } catch (error) {
    console.error('Error processing news query:', error);
    return NextResponse.json(
      { message: 'Failed to process news query', error: error.message },
      { status: 500 }
    );
  }
}
