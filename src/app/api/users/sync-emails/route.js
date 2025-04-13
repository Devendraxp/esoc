import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
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

// Sync all emails from Clerk to our database
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
    
    // Find the current user to check if they're an admin
    const currentUser = await User.findOne({ clerkId: userId });
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    // Get all users from our database
    const users = await User.find();
    const syncResults = [];
    
    // For each user, get their email from Clerk and update it in our database
    for (const user of users) {
      try {
        // Skip if user has no clerkId
        if (!user.clerkId) {
          syncResults.push({
            id: user._id,
            status: 'skipped',
            reason: 'No clerkId'
          });
          continue;
        }
        
        // Get user from Clerk
        const clerkUser = await clerkClient.users.getUser(user.clerkId);
        
        // Get primary email
        const primaryEmail = clerkUser.emailAddresses.find(
          email => email.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
        
        if (!primaryEmail) {
          syncResults.push({
            id: user._id,
            clerkId: user.clerkId,
            status: 'skipped',
            reason: 'No email found in Clerk'
          });
          continue;
        }
        
        // Update user in our database
        await User.updateOne(
          { _id: user._id },
          { $set: { email: primaryEmail } }
        );
        
        syncResults.push({
          id: user._id,
          clerkId: user.clerkId,
          status: 'updated',
          email: primaryEmail
        });
      } catch (error) {
        console.error(`Error syncing user ${user._id}:`, error);
        syncResults.push({
          id: user._id,
          clerkId: user.clerkId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Return results
    return NextResponse.json({
      message: 'Email sync completed',
      totalUsers: users.length,
      syncResults
    });
  } catch (error) {
    console.error('Error in email sync:', error);
    return NextResponse.json(
      { message: 'Error syncing emails', error: error.message },
      { status: 500 }
    );
  }
}