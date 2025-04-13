import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import AidRequest from '../../../../../models/AidRequest';
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

export async function PATCH(request, { params }) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const { status, note } = await request.json();
    
    if (!status || !['received', 'prepared', 'shipped', 'delivered'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status provided' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the current user to check if they're special or admin
    const user = await User.findOne({ clerkId: userId });
    
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
    
    // Only the responder or an admin can update the status
    if (user.role !== 'admin' && 
        (!aidRequest.respondedBy || aidRequest.respondedBy.toString() !== user._id.toString())) {
      return NextResponse.json(
        { message: 'You can only update aid requests that you have approved' },
        { status: 403 }
      );
    }
    
    // Check if the aid request is in an appropriate state to be updated
    if (aidRequest.status !== 'approved' && 
        !['received', 'prepared', 'shipped'].includes(aidRequest.status)) {
      return NextResponse.json(
        { message: `Cannot update from status '${aidRequest.status}' to '${status}'` },
        { status: 400 }
      );
    }
    
    // Update the aid request
    aidRequest.status = status;
    
    // Update note if provided
    if (note && note.trim() !== '') {
      aidRequest.adminNote = note;
    }
    
    await aidRequest.save();
    
    return NextResponse.json({ 
      message: `Aid request status updated to ${status} successfully`,
      id
    });
  } catch (error) {
    console.error('Error updating aid request status:', error);
    return NextResponse.json(
      { message: 'Failed to update aid request status', error: error.message },
      { status: 500 }
    );
  }
}