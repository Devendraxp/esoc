import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Post from '../../../../models/Post';
import User from '../../../../models/User';

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app');
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user || (user.role !== 'admin' && user.role !== 'special')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const flaggedPosts = await Post.find({ flagged: true })
      .populate({ path: 'author', model: User, select: 'clerkId firstName lastName username profileImageUrl role' })
      .sort({ createdAt: -1 });

    return NextResponse.json({ posts: flaggedPosts });
  } catch (error) {
    console.error('Error fetching flagged posts:', error);
    return NextResponse.json({ message: 'Failed to fetch flagged posts' }, { status: 500 });
  }
}
