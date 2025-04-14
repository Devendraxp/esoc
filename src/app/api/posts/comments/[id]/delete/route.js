// filepath: /home/dev/projects/esoc/src/app/api/posts/comments/[id]/delete/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Comment from '../../../../../../models/Comment';
import User from '../../../../../../models/User';
import Report from '../../../../../../models/Report';

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
    
    // Only special users can delete comments directly
    if (user.role !== 'admin' && user.role !== 'special') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin or special user access required' },
        { status: 403 }
      );
    }
    
    const commentId = params.id;
    
    // Find the comment
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }
    
    const postId = comment.post;
    
    // Create a report to log the deletion
    const report = new Report({
      type: 'comment',
      post: postId,
      comment: commentId,
      reporter: user._id,
      reason: 'special_user_action',
      content: 'Deleted by special user',
      status: 'agreed',
      handledBy: user._id
    });
    
    await report.save();
    
    // Delete the comment
    await Comment.findByIdAndDelete(commentId);
    
    return NextResponse.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { message: 'Failed to delete comment', error: error.message },
      { status: 500 }
    );
  }
}