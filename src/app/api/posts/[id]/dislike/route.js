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
        { message: 'Unauthorized - You must be logged in to dislike posts' },
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
    
    // Initialize dislikes array if it doesn't exist
    if (!post.dislikes) {
      post.dislikes = [];
    }
    
    // Check if user already disliked this post
    const alreadyDisliked = post.dislikes.includes(userId);
    
    if (alreadyDisliked) {
      // Remove dislike (toggle)
      post.dislikes = post.dislikes.filter(id => id !== userId);
    } else {
      // Add dislike
      post.dislikes.push(userId);
      
      // If the user has liked the post, remove the like
      if (post.likes.includes(userId)) {
        post.likes = post.likes.filter(id => id !== userId);
      }
    }
    
    await post.save();
    
    return NextResponse.json({ 
      message: alreadyDisliked ? 'Post undisliked' : 'Post disliked',
      likes: post.likes.length,
      dislikes: post.dislikes.length
    });
    
  } catch (error) {
    console.error('Error handling dislike:', error);
    return NextResponse.json(
      { message: 'Failed to process dislike', error: error.message },
      { status: 500 }
    );
  }
}