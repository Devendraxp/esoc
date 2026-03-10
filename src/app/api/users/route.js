import { NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../models/User';
import { syncUserWithClerk } from '../../../utils/clerk-helpers';

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


    const currentUser = await User.findOne({ clerkId: userId });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }


    const users = await User.find().sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users', error: error.message },
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

    await connectToDatabase();


    const formData = await request.json();


    console.log('Received profile update request with data:', formData);


    if (!formData.firstName || !formData.lastName || !formData.username) {
      return NextResponse.json(
        { message: 'First name, last name, and username are required' },
        { status: 400 }
      );
    }


    let clerkUser;
    try {

      clerkUser = await clerkClient.users.getUser(userId);
    } catch (clerkError) {
      console.error('Clerk API error:', clerkError);

      clerkUser = {
        id: userId,
        emailAddresses: [],
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        username: formData.username || '',
        imageUrl: formData.profileImageUrl || ''
      };
    }


    let user = await User.findOne({ clerkId: userId });


    const syncedUserData = await syncUserWithClerk(clerkUser, user);



    const mergedData = {
      ...syncedUserData,
      ...formData,

      email: syncedUserData.email || formData.email
    };

    if (user) {

      user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $set: {
            ...mergedData,
            lastActiveAt: new Date()
          }
        },
        { new: true }
      );

      console.log('Updated existing user:', user._id);
    } else {

      user = await User.create({
        ...mergedData,
        joinedAt: new Date(),
        lastActiveAt: new Date()
      });

      console.log('Created new user:', user._id);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error syncing user data:', error);
    return NextResponse.json(
      { message: 'Failed to sync user data', error: error.message },
      { status: 500 }
    );
  }
}
