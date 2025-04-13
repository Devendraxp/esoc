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
    
    // In a real app, you'd update the aid request status in the database
    // const aidRequest = await AidRequest.findById(id);
    // 
    // if (!aidRequest) {
    //   return NextResponse.json(
    //     { message: 'Aid request not found' },
    //     { status: 404 }
    //   );
    // }
    // 
    // aidRequest.status = 'denied';
    // aidRequest.respondedBy = userId;
    // aidRequest.respondedAt = new Date();
    // 
    // await aidRequest.save();
    
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