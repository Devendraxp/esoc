import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Comment from '../../../../../models/Comment';

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

export async function GET(request, { params }) {
  try {
    const postId = params.id;
    await connectToDatabase();
    
    // For demo purposes - in production, you'd fetch from the database
    // const comments = await Comment.find({ post: postId }).populate('author').sort({ createdAt: 1 });
    
    // Sample data for demonstration
    const sampleComments = [
      {
        _id: '101',
        post: postId,
        author: { clerkId: 'user_2', profile_location: 'Region 2' },
        content: 'Thank you for sharing this information. It has been very helpful for our community.',
        createdAt: new Date('2025-04-11T14:30:00').toISOString()
      },
      {
        _id: '102',
        post: postId,
        author: { clerkId: 'user_3', profile_location: 'Region 3' },
        content: 'Is there any way to volunteer and help with the distribution?',
        createdAt: new Date('2025-04-12T09:15:00').toISOString()
      }
    ];
    
    return NextResponse.json(sampleComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch comments', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const postId = params.id;
    const { content } = await request.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // For demo purposes - in production, you'd create a comment in the database
    // const comment = new Comment({
    //   post: postId,
    //   author: req.user._id, // From your auth middleware
    //   content
    // });
    // await comment.save();
    
    // Sample response for demonstration
    const sampleComment = {
      _id: Math.random().toString(36).substring(7),
      post: postId,
      author: { clerkId: 'user_1', profile_location: 'Region 1' },
      content,
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json(sampleComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { message: 'Failed to create comment', error: error.message },
      { status: 500 }
    );
  }
}