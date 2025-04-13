import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import AidRequest from '../../../models/AidRequest';
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

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - You must be logged in to request aid' },
        { status: 401 }
      );
    }
    
    const { region, additionalInfo } = await request.json();
    
    if (!region || region.trim() === '') {
      return NextResponse.json(
        { message: 'Region is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find user to get their role
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Create the actual aid request
    const aidRequest = new AidRequest({
      region: region.trim(),
      requesters: [user._id], // Use MongoDB _id, not clerkId
      status: 'pending',
      adminNote: additionalInfo || '',
      requesterRole: user.role // Save the user's role with the request for priority handling
    });
    
    await aidRequest.save();
    
    // Return the created aid request with user details
    const createdRequest = await AidRequest.findById(aidRequest._id)
      .populate({
        path: 'requesters',
        select: 'clerkId firstName lastName username email profileImageUrl profile_location role'
      });
    
    return NextResponse.json(createdRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating aid request:', error);
    return NextResponse.json(
      { message: 'Failed to submit aid request', error: error.message },
      { status: 500 }
    );
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
    
    // Get the URL parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    // Find the user to get their MongoDB _id and role
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Build the query based on parameters
    let query = {};
    
    // If status parameter is provided, filter by status
    if (status) {
      query.status = status;
    }
    
    // For normal users, show only their own aid requests
    // For special and admin users, show all aid requests if no status filter
    // but still filter by status if specified
    if (user.role === 'normal') {
      query.requesters = user._id;
    }
    
    // Fetch aid requests from the database
    const aidRequests = await AidRequest.find(query)
      .populate({
        path: 'requesters',
        select: 'clerkId firstName lastName username email profileImageUrl profile_location role'
      })
      .sort({ createdAt: -1 });
    
    return NextResponse.json(aidRequests);
  } catch (error) {
    console.error('Error fetching aid requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch aid requests', error: error.message },
      { status: 500 }
    );
  }
}