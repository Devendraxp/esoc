import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import { processAllContent } from '../../../../utils/newsScheduler';

// Database connection function
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app';
  
  // Check for Grok API key
  if (!process.env.GROK_API_KEY) {
    console.warn('Warning: GROK_API_KEY is not set in environment variables');
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - You must be logged in to use this feature' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Find user and check if admin
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only allow admins to process content
    if (!user.isAdmin) {
      return NextResponse.json(
        { message: 'Only administrators can perform this operation' },
        { status: 403 }
      );
    }
    
    console.log('Admin user triggering content processing');
    
    // Process all existing content
    const result = await processAllContent();
    
    return NextResponse.json({
      message: 'Content processing completed',
      result
    });
  } catch (error) {
    console.error('Error in content processing endpoint:', error);
    return NextResponse.json(
      { message: 'Failed to process content', error: error.message },
      { status: 500 }
    );
  }
}