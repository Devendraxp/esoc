import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import NewsQuery from '../../../../models/NewsQuery';

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

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - You must be logged in to view news query history' },
        { status: 401 }
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
    
    // Parse URL parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Get the user's queries with pagination
    const queries = await NewsQuery.find({ user: user._id, status: 'processed' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('query location localModelResponse grokResponse createdAt');
    
    // Get total count for pagination metadata
    const total = await NewsQuery.countDocuments({ user: user._id, status: 'processed' });
    
    return NextResponse.json({
      queries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + queries.length < total
      }
    });
  } catch (error) {
    console.error('Error retrieving news query history:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve news query history', error: error.message },
      { status: 500 }
    );
  }
}