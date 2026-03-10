import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Report from '../../../../models/Report';
import User from '../../../../models/User';
import Post from '../../../../models/Post';
import Comment from '../../../../models/Comment';

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

    await connectToDatabase();


    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }


    if (user.role !== 'admin' && user.role !== 'special') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin or special user access required' },
        { status: 403 }
      );
    }


    const url = new URL(request.url);
    const status = url.searchParams.get('status');


    let query = {};

    if (status) {
      query.status = status;
    }


    if (user.role === 'special') {
      query.seenBy = { $nin: [user._id] };
    }


    if (user.role === 'special' && user.profile_location) {

      const posts = await Post.find({
        'author.profile_location': user.profile_location
      }).select('_id');

      const postIds = posts.map(post => post._id);
      query.post = { $in: postIds };
    }

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
        select: 'clerkId username firstName lastName email profileImageUrl profile_location'
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
    console.error('Error fetching all reports:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reports', error: error.message },
      { status: 500 }
    );
  }
}
