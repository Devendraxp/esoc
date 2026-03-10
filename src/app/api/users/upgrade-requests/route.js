import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';

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


    const adminUser = await User.findOne({ clerkId: userId });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }


    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';


    const users = await User.find({
      'upgradeRequest.status': status
    }).select('clerkId username firstName lastName email profileImageUrl profile_location upgradeRequest');

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching upgrade requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch upgrade requests', error: error.message },
      { status: 500 }
    );
  }
}
