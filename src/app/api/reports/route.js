import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Report from '../../../models/Report';
import Post from '../../../models/Post';
import Comment from '../../../models/Comment';
import User from '../../../models/User';

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
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse URL to extract query parameters
    const url = new URL(request.url);
    const region = url.searchParams.get('region');
    const status = url.searchParams.get('status') || 'pending';
    
    await connectToDatabase();
    
    // Find the user to check their role
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only special users can view reports
    if (user.role !== 'admin' && user.role !== 'special') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin or special user access required' },
        { status: 403 }
      );
    }
    
    // Build query
    let query = { status };
    
    // Add seenBy filter to exclude reports already seen by this user
    if (status === 'pending') {
      query.seenBy = { $nin: [user._id] };
    }
    
    // If region is provided and the user is a special user, filter by region
    if (region && user.role === 'special') {
      // Find posts from that region
      const posts = await Post.find({
        'author.profile_location': { $regex: region, $options: 'i' }
      }).select('_id');
      
      const postIds = posts.map(post => post._id);
      query.post = { $in: postIds };
    }
    
    // Fetch reports from the database
    const reports = await Report.find(query)
      .populate({
        path: 'post',
        select: 'content author createdAt'
      })
      .populate({
        path: 'comment',
        select: 'content author post createdAt'
      })
      .populate({
        path: 'reporter',
        select: 'clerkId username firstName lastName email profileImageUrl profile_location role'
      })
      .populate({
        path: 'handledBy',
        select: 'clerkId username firstName lastName email profileImageUrl'
      })
      .populate({
        path: 'seenBy',
        select: 'clerkId username'
      })
      .sort({ createdAt: -1 });
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reports', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { type, postId, commentId, content } = await request.json();
    
    if (!type || (type !== 'post' && type !== 'comment')) {
      return NextResponse.json(
        { message: 'Valid report type (post or comment) is required' },
        { status: 400 }
      );
    }
    
    if (!postId) {
      return NextResponse.json(
        { message: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    if (type === 'comment' && !commentId) {
      return NextResponse.json(
        { message: 'Comment ID is required for comment reports' },
        { status: 400 }
      );
    }
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Report content is required' },
        { status: 400 }
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
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Find the comment if this is a comment report
    let comment = null;
    if (type === 'comment') {
      comment = await Comment.findById(commentId);
      if (!comment) {
        return NextResponse.json(
          { message: 'Comment not found' },
          { status: 404 }
        );
      }
    }
    
    // Create a new report
    const reportData = {
      type,
      post: postId,
      reporter: user._id,
      content: content.trim(),
      status: 'pending',
      seenBy: []
    };
    
    if (type === 'comment') {
      reportData.comment = commentId;
    }
    
    // Special users can directly take action
    if (user.role === 'special' || user.role === 'admin') {
      reportData.status = 'agreed';
      reportData.handledBy = user._id;
    }
    
    const report = new Report(reportData);
    await report.save();
    
    // If the user is a special user or admin, automatically take action
    if (user.role === 'special' || user.role === 'admin') {
      // Delete the content based on type
      if (type === 'post') {
        await Post.findByIdAndDelete(postId);
      } else if (type === 'comment') {
        await Comment.findByIdAndDelete(commentId);
      }
      
      return NextResponse.json({
        message: `${type === 'post' ? 'Post' : 'Comment'} reported and deleted successfully`,
        report: await Report.findById(report._id)
          .populate('reporter', 'clerkId username firstName lastName email profileImageUrl')
      });
    }
    
    return NextResponse.json({
      message: `${type === 'post' ? 'Post' : 'Comment'} reported successfully`,
      report: await Report.findById(report._id)
        .populate('reporter', 'clerkId username firstName lastName email profileImageUrl')
    });
  } catch (error) {
    console.error('Error reporting content:', error);
    return NextResponse.json(
      { message: 'Failed to report content', error: error.message },
      { status: 500 }
    );
  }
}