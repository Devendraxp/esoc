import { NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../../models/User';

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
    
    // Find the current user to check if they're an admin
    const currentUser = await User.findOne({ clerkId: userId });
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Fetch the user data from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    const clerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress || null;
    
    // Get user from our database
    const dbUser = await User.findOne({ clerkId: userId });
    
    // Return debug info
    return NextResponse.json({
      message: 'Debug info for user data',
      clerkId: userId,
      clerkEmail: clerkEmail,
      dbUser: dbUser,
      emailStoredInDb: dbUser?.email || 'No email in DB',
      allEmails: clerkUser.emailAddresses?.map(e => e.emailAddress) || []
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { message: 'Error fetching debug info', error: error.message },
      { status: 500 }
    );
  }
}