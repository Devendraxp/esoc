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
    
    const userIdToPromote = params.id;
    const { role } = await request.json();
    
    if (!role || (role !== 'special' && role !== 'admin')) {
      return NextResponse.json(
        { message: 'Invalid role specified' },
        { status: 400 }
      );
    }
    
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
    // const userToPromote = await User.findOne({ clerkId: userIdToPromote });
    // 
    // if (!userToPromote) {
    //   return NextResponse.json(
    //     { message: 'User not found' },
    //     { status: 404 }
    //   );
    // }
    // 
    // userToPromote.role = role;
    // await userToPromote.save();
    
    return NextResponse.json({ 
      message: `User promoted to ${role} successfully`,
      id: userIdToPromote
    });
  } catch (error) {
    console.error(`Error promoting user:`, error);
    return NextResponse.json(
      { message: 'Failed to promote user', error: error.message },
      { status: 500 }
    );
  }
}