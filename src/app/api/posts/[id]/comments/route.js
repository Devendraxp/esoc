import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Comment from '../../../../../models/Comment';
import Post from '../../../../../models/Post';
import User from '../../../../../models/User';

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
    
    // Fetch comments for the post from the database with authorDetails
    const comments = await Comment.find({ post: postId })
      .populate({
        path: 'authorDetails',
        select: 'clerkId profile_location role'
      })
      .sort({ createdAt: 1 });
    
    return NextResponse.json(comments);
    
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
    const { userId } = getAuth(request);
    const postId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - You must be logged in to comment' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Check if user exists in our database, if not create a user
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      user = new User({
        clerkId: userId,
        role: 'normal'
      });
      await user.save();
    }
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    const { content } = await request.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Create and save the comment
    const comment = new Comment({
      post: postId,
      author: userId, // Now using Clerk userId directly
      content: content.trim()
    });
    
    await comment.save();
    
    // Return the comment with author information
    const populatedComment = await Comment.findById(comment._id).populate({
      path: 'authorDetails',
      select: 'clerkId profile_location role'
    });
    
    return NextResponse.json(populatedComment, { status: 201 });
    
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { message: 'Failed to create comment', error: error.message },
      { status: 500 }
    );
  }
}