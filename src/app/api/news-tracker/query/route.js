import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import NewsMemory from '../../../../models/NewsMemory';
import NewsQuery from '../../../../models/NewsQuery';
import { generateEmbeddings, generateResponseFromMemory } from '../../../../utils/huggingface';
import { getGeminiResponse } from '../../../../utils/gemini';

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

// Find relevant memories based on query
async function findRelevantMemories(query, location = null, limit = 5) {
  try {
    // Generate embeddings for the query
    const queryEmbedding = await generateEmbeddings(query);
    
    // Create match criteria
    const matchCriteria = {};
    if (location) {
      // Case-insensitive partial match for location
      matchCriteria.location = { $regex: location, $options: 'i' };
    }
    
    // Find memories with vector similarity search
    const memories = await NewsMemory.aggregate([
      { $match: matchCriteria },
      {
        $addFields: {
          similarity: {
            $reduce: {
              input: { $zip: { inputs: ["$embedding", queryEmbedding] } },
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  { $multiply: [{ $arrayElemAt: ["$$this", 0] }, { $arrayElemAt: ["$$this", 1] }] }
                ]
              }
            }
          }
        }
      },
      { $sort: { similarity: -1 } },
      { $limit: limit }
    ]);
    
    return memories;
  } catch (error) {
    console.error('Error finding relevant memories:', error);
    return [];
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - You must be logged in to use the news tracker' },
        { status: 401 }
      );
    }
    
    const { query, location } = await request.json();
    
    if (!query || query.trim() === '') {
      return NextResponse.json(
        { message: 'Query is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Create a new query entry with pending status
    const newsQuery = new NewsQuery({
      user: user._id,
      query: query.trim(),
      location: location?.trim(),
      status: 'pending'
    });
    
    await newsQuery.save();
    
    console.log('Processing query:', query);
    
    // Find relevant memories
    const memories = await findRelevantMemories(query, location);
    
    if (memories.length > 0) {
      // Extract processed content from memories
      const contexts = memories.map(memory => memory.processedContent);
      
      console.log(`Found ${memories.length} relevant memories`);
      
      // Store related memories
      newsQuery.relatedMemories = memories.map(memory => memory._id);
      
      // Generate response from memory using Hugging Face model
      const localModelResponse = await generateResponseFromMemory(query, contexts);
      newsQuery.localModelResponse = localModelResponse;
      
      console.log('Generated local model response, calling Gemini API');
      
      // Get enhanced response from Gemini
      const geminiResponse = await getGeminiResponse(query, localModelResponse);
      newsQuery.grokResponse = geminiResponse; // Still using grokResponse field in DB for compatibility
      
      // Update status
      newsQuery.status = 'processed';
      await newsQuery.save();
      
      return NextResponse.json({
        id: newsQuery._id,
        query: newsQuery.query,
        location: newsQuery.location,
        localModelResponse,
        grokResponse: geminiResponse, // Return as grokResponse for frontend compatibility
        status: 'processed',
        createdAt: newsQuery.createdAt
      });
    } else {
      // No relevant memories found
      const noContextResponse = "I don't have enough information from the community's posts to answer this question confidently.";
      newsQuery.localModelResponse = noContextResponse;
      
      console.log('No relevant memories found, calling Gemini API directly');
      
      // Get response from Gemini alone
      const geminiResponse = await getGeminiResponse(query, noContextResponse);
      newsQuery.grokResponse = geminiResponse; // Still using grokResponse field for compatibility
      
      // Update status
      newsQuery.status = 'processed';
      await newsQuery.save();
      
      return NextResponse.json({
        id: newsQuery._id,
        query: newsQuery.query,
        location: newsQuery.location,
        localModelResponse: noContextResponse,
        grokResponse: geminiResponse, // Return as grokResponse for frontend compatibility
        status: 'processed',
        createdAt: newsQuery.createdAt
      });
    }
  } catch (error) {
    console.error('Error processing news query:', error);
    return NextResponse.json(
      { message: 'Failed to process news query', error: error.message },
      { status: 500 }
    );
  }
}