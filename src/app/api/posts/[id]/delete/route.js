// filepath: /home/dev/projects/esoc/src/app/api/posts/[id]/delete/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Post from '../../../../../models/Post';
import User from '../../../../../models/User';
import Report from '../../../../../models/Report';

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

export async function DELETE(request, { params }) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Find the user to check their role
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only special users can delete posts directly
    if (user.role !== 'admin' && user.role !== 'special') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin or special user access required' },
        { status: 403 }
      );
    }
    
    const postId = params.id;
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Create a report to log the deletion
    const report = new Report({
      type: 'post',
      post: postId,
      reporter: user._id,
      reason: 'special_user_action',
      content: 'Deleted by special user',
      status: 'agreed',
      handledBy: user._id
    });
    
    await report.save();
    
    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    return NextResponse.json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { message: 'Failed to delete post', error: error.message },
      { status: 500 }
    );
  }
}