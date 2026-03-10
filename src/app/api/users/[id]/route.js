import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../models/User.js';

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

export async function GET(request, { params }) {
  try {

    const { id } = await params;
    const userId = id;

    await connectToDatabase();


    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId: clerkUserId } = getAuth(request);

    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const updateData = await request.json();

    await connectToDatabase();


    const currentUser = await User.findOne({ clerkId: clerkUserId });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }


    const userToUpdate = await User.findOne({ clerkId: id });

    if (!userToUpdate) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }


    Object.keys(updateData).forEach(key => {
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.');
        if (!userToUpdate[parentKey]) {
          userToUpdate[parentKey] = {};
        }
        userToUpdate[parentKey][childKey] = updateData[key];
        delete updateData[key];
      }
    });


    Object.assign(userToUpdate, updateData);


    await userToUpdate.save();

    return NextResponse.json({
      message: 'User updated successfully',
      user: userToUpdate
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Failed to update user', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId: clerkUserId } = getAuth(request);

    if (!clerkUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    await connectToDatabase();


    const currentUser = await User.findOne({ clerkId: clerkUserId });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }


    const deletedUser = await User.findOneAndDelete({ clerkId: id });

    if (!deletedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Failed to delete user', error: error.message },
      { status: 500 }
    );
  }
}
