import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Comment from '../../../../models/Comment';
import User from '../../../../models/User';
import Post from '../../../../models/Post';

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user');
    
    await connectToDatabase();
    
    // If user parameter is provided, find the MongoDB user by their Clerk ID
    if (userId) {
      // First, get the MongoDB user ID for the provided Clerk ID
      const user = await User.findOne({ clerkId: userId });
      
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Now find comments by the MongoDB user ID
      const comments = await Comment.find({ author: user._id })
        .sort({ createdAt: -1 });
      
      // Get post data for each comment
      const commentData = await Promise.all(
        comments.map(async (comment) => {
          const post = await Post.findById(comment.post);
          
          return {
            _id: comment._id,
            postId: comment.post,
            postTitle: post ? post.content.substring(0, 30) + (post.content.length > 30 ? '...' : '') : 'Post unavailable',
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
          };
        })
      );
      
      return NextResponse.json(commentData);
    }
    
    // If no user parameter, return error
    return NextResponse.json(
      { message: 'Missing user parameter' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch comments', error: error.message },
      { status: 500 }
    );
  }
}

// Handle comment edits
export async function PUT(request) {
  try {
    const { id, content } = await request.json();
    
    if (!id || !content) {
      return NextResponse.json(
        { message: 'Comment ID and content are required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find and update the comment
    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { content: content.trim() },
      { new: true }
    );
    
    if (!updatedComment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedComment);
    
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { message: 'Failed to update comment', error: error.message },
      { status: 500 }
    );
  }
}

// Handle comment deletion
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'Comment ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find and delete the comment
    const deletedComment = await Comment.findByIdAndDelete(id);
    
    if (!deletedComment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Comment deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { message: 'Failed to delete comment', error: error.message },
      { status: 500 }
    );
  }
}