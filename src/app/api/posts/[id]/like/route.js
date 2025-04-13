import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Post from '../../../../../models/Post';

// Database connection function
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw new Error('Database connection failed');
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const postId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - You must be logged in to like posts' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Find the post by ID
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if user already liked this post
    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      // Remove like (toggle)
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      // Add like
      post.likes.push(userId);
      
      // If the user has disliked the post, remove the dislike
      if (post.dislikes && post.dislikes.includes(userId)) {
        post.dislikes = post.dislikes.filter(id => id !== userId);
      }
    }
    
    await post.save();
    
    return NextResponse.json({ 
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      likes: post.likes.length,
      dislikes: post.dislikes?.length || 0
    });
    
  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json(
      { message: 'Failed to process like', error: error.message },
      { status: 500 }
    );
  }
}