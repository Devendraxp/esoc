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
    
    aidRequest.status = 'approved';
    aidRequest.respondedBy = user._id; // Use MongoDB _id
    aidRequest.respondedAt = new Date();
    aidRequest.acceptedBy = user._id; // Set the acceptedBy field to the current user
    
    await aidRequest.save();
    
    return NextResponse.json({ 
      message: 'Aid request approved successfully',
      id
    });
  } catch (error) {
    console.error('Error approving aid request:', error);
    return NextResponse.json(
      { message: 'Failed to approve aid request', error: error.message },
      { status: 500 }
    );
  }
}