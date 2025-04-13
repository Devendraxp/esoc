import { NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import User from '../../../models/User';
import { syncUserWithClerk } from '../../../utils/clerk-helpers';

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

// GET all users (admin only)
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
    
    // Get all users from the database
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

// POST to sync or create user from Clerk data
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
    
    // Get user data from request body
    const formData = await request.json();
    
    // Fetch the user data directly from Clerk to get the most up-to-date info
    const clerkUser = await clerkClient.users.getUser(userId);
    
    // Look for existing user
    let user = await User.findOne({ clerkId: userId });
    
    // Sync user data from Clerk, including email
    const syncedUserData = await syncUserWithClerk(clerkUser, user);
    
    // Merge synced data from Clerk with form data
    // This ensures we get email from Clerk while respecting any updates from the form
    const mergedData = {
      ...syncedUserData,
      ...formData,
      // Always keep the email from Clerk
      email: syncedUserData.email
    };
    
    if (user) {
      // Update existing user
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
    } else {
      // Create new user
      user = await User.create({
        ...mergedData,
        joinedAt: new Date(),
        lastActiveAt: new Date()
      });
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