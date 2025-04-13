import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Report from '../../../models/Report';

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
    
    // Parse URL to extract region query parameter
    const url = new URL(request.url);
    const region = url.searchParams.get('region');
    const status = url.searchParams.get('status') || 'pending';
    
    await connectToDatabase();
    
    // Find the user to check their role
    const User = mongoose.model('User');
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only admins and special users can view reports
    if (user.role !== 'admin' && user.role !== 'special') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin or special user access required' },
        { status: 403 }
      );
    }
    
    // Build query
    let query = { status };
    
    // If region is provided and the user is a special user, filter by region
    if (region && user.role === 'special') {
      // We need to find posts first from that region
      const Post = mongoose.model('Post');
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
        select: 'content author createdAt fakeScore'
      })
      .populate({
        path: 'reporter',
        select: 'clerkId username firstName lastName email profileImageUrl profile_location role'
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
    
    const { postId, reason } = await request.json();
    
    if (!postId) {
      return NextResponse.json(
        { message: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { message: 'Reason for report is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the user to check their role
    const User = mongoose.model('User');
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Find the post
    const Post = mongoose.model('Post');
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Create a new report
    const report = new Report({
      post: postId,
      reporter: user._id,
      reason: reason.trim(),
      status: 'pending'
    });
    
    await report.save();
    
    // If the user is a special user or admin, automatically delete the post
    if (user.role === 'special' || user.role === 'admin') {
      report.status = 'approved';
      await report.save();
      
      // Delete the post
      await Post.findByIdAndDelete(postId);
      
      return NextResponse.json({
        message: 'Post reported and deleted successfully',
        report: await Report.findById(report._id)
          .populate('reporter', 'clerkId username firstName lastName email profileImageUrl')
      });
    }
    
    return NextResponse.json({
      message: 'Post reported successfully',
      report: await Report.findById(report._id)
        .populate('reporter', 'clerkId username firstName lastName email profileImageUrl')
    });
  } catch (error) {
    console.error('Error reporting post:', error);
    return NextResponse.json(
      { message: 'Failed to report post', error: error.message },
      { status: 500 }
    );
  }
}