import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import { processAllContent } from '../../../../utils/newsScheduler';

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app');
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!user.isAdmin) {
      return NextResponse.json({ message: 'Only administrators can perform this operation' }, { status: 403 });
    }

    const result = await processAllContent();

    return NextResponse.json({ message: 'Content processing completed', result });
  } catch (error) {
    console.error('Error in content processing endpoint:', error);
    return NextResponse.json({ message: 'Failed to process content', error: error.message }, { status: 500 });
  }
}
