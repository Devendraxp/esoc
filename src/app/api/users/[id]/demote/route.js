import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../../models/User';

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

export async function POST(request, { params }) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userIdToDemote = params.id;
    
    await connectToDatabase();
    
    // For demo purposes - in production, you'd update the database
    // const adminUser = await User.findOne({ clerkId: userId });
    // 
    // if (!adminUser || adminUser.role !== 'admin') {
    //   return NextResponse.json(
    //     { message: 'Unauthorized - Admin access required' },
    //     { status: 403 }
    //   );
    // }
    // 
    // const userToDemote = await User.findOne({ clerkId: userIdToDemote });
    // 
    // if (!userToDemote) {
    //   return NextResponse.json(
    //     { message: 'User not found' },
    //     { status: 404 }
    //   );
    // }
    // 
    // // Cannot demote other admins
    // if (userToDemote.role === 'admin') {
    //   return NextResponse.json(
    //     { message: 'Cannot demote admin users' },
    //     { status: 400 }
    //   );
    // }
    // 
    // userToDemote.role = 'user';
    // await userToDemote.save();
    
    return NextResponse.json({ 
      message: 'User demoted to regular user successfully',
      id: userIdToDemote
    });
  } catch (error) {
    console.error(`Error demoting user:`, error);
    return NextResponse.json(
      { message: 'Failed to demote user', error: error.message },
      { status: 500 }
    );
  }
}