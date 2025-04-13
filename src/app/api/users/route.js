import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
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
    
    await connectToDatabase();
    
    // For demo purposes - in production, you'd fetch from the database
    // const currentUser = await User.findOne({ clerkId: userId });
    // 
    // if (!currentUser || currentUser.role !== 'admin') {
    //   return NextResponse.json(
    //     { message: 'Unauthorized - Admin access required' },
    //     { status: 403 }
    //   );
    // }
    // 
    // const users = await User.find().sort({ createdAt: -1 });
    
    // Sample data for demonstration
    const sampleUsers = [
      {
        id: 'user_1',
        clerkId: 'user_1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        profile_location: 'Global',
        createdAt: new Date('2025-03-15T10:00:00')
      },
      {
        id: 'user_2',
        clerkId: 'user_2',
        name: 'Special Responder',
        email: 'responder@example.com',
        role: 'special',
        profile_location: 'Eastern District',
        createdAt: new Date('2025-03-20T14:30:00')
      },
      {
        id: 'user_3',
        clerkId: 'user_3',
        name: 'Regular User 1',
        email: 'user1@example.com',
        role: 'user',
        profile_location: 'Western District',
        createdAt: new Date('2025-03-25T09:15:00')
      },
      {
        id: 'user_4',
        clerkId: 'user_4',
        name: 'Regular User 2',
        email: 'user2@example.com',
        role: 'user',
        profile_location: 'Northern Community',
        createdAt: new Date('2025-04-01T16:45:00')
      },
      {
        id: 'user_5',
        clerkId: 'user_5',
        name: 'Special Responder 2',
        email: 'responder2@example.com',
        role: 'special',
        profile_location: 'Region 1',
        createdAt: new Date('2025-04-05T11:20:00')
      }
    ];
    
    return NextResponse.json(sampleUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users', error: error.message },
      { status: 500 }
    );
  }
}