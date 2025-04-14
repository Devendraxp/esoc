import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import AidRequest from '../../../../../models/AidRequest.js';

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
    
    const id = params.id;
    
    await connectToDatabase();
    
    // Find the current user to check if they're special or admin
    const user = await mongoose.model('User').findOne({ clerkId: userId });
    
    if (!user || (user.role !== 'special' && user.role !== 'admin')) {
      return NextResponse.json(
        { message: 'Unauthorized - Special or Admin access required' },
        { status: 403 }
      );
    }
    
    // Find and update the aid request
    const aidRequest = await AidRequest.findById(id);
    
    if (!aidRequest) {
      return NextResponse.json(
        { message: 'Aid request not found' },
        { status: 404 }
      );
    }
    
    if (aidRequest.status !== 'pending') {
      return NextResponse.json(
        { message: `This aid request is already ${aidRequest.status}` },
        { status: 400 }
      );
    }
    
    // Important: Don't change the status to 'denied' for everyone
    // Just add the current user to the deniedBy array
    
    // Add the current user to the deniedBy array
    aidRequest.deniedBy = aidRequest.deniedBy || [];
    
    // Check if this user already denied this request
    if (!aidRequest.deniedBy.some(id => id.toString() === user._id.toString())) {
      aidRequest.deniedBy.push(user._id);
    }
    
    // Only set the respondedBy and respondedAt if an admin user is denying
    // For special users, we're just adding them to deniedBy array
    if (user.role === 'admin') {
      aidRequest.status = 'denied';
      aidRequest.respondedBy = user._id;
      aidRequest.respondedAt = new Date();
    }
    
    await aidRequest.save();
    
    return NextResponse.json({ 
      message: 'Aid request denied successfully',
      id
    });
  } catch (error) {
    console.error('Error denying aid request:', error);
    return NextResponse.json(
      { message: 'Failed to deny aid request', error: error.message },
      { status: 500 }
    );
  }
}