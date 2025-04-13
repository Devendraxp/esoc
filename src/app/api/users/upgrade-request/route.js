import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
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

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { organization, reason } = await request.json();
    
    if (!organization || organization.trim() === '') {
      return NextResponse.json(
        { message: 'Organization name is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is already special or admin
    if (user.role === 'special' || user.role === 'admin') {
      return NextResponse.json(
        { message: 'Your account already has elevated privileges' },
        { status: 400 }
      );
    }
    
    // Check if user already has a pending upgrade request
    if (user.upgradeRequest && user.upgradeRequest.status === 'pending') {
      return NextResponse.json(
        { message: 'You already have a pending upgrade request' },
        { status: 400 }
      );
    }
    
    // Create upgrade request
    user.upgradeRequest = {
      organization: organization.trim(),
      reason: reason || '',
      status: 'pending',
      requestedAt: new Date()
    };
    
    await user.save();
    
    return NextResponse.json({
      message: 'Upgrade request submitted successfully',
      upgradeRequest: user.upgradeRequest
    });
  } catch (error) {
    console.error('Error requesting account upgrade:', error);
    return NextResponse.json(
      { message: 'Failed to submit upgrade request', error: error.message },
      { status: 500 }
    );
  }
}

// Get current user's upgrade request status
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
    
    // Find the user
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      upgradeRequest: user.upgradeRequest || null
    });
  } catch (error) {
    console.error('Error fetching upgrade request status:', error);
    return NextResponse.json(
      { message: 'Failed to fetch upgrade request status', error: error.message },
      { status: 500 }
    );
  }
}