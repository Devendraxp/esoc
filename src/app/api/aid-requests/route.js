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
    
    // For demo purposes - in production, you'd create an actual aid request
    // const aidRequest = new AidRequest({
    //   region: region.trim(),
    //   requesters: [userId],
    //   status: 'pending',
    //   adminNote: additionalInfo || ''
    // });
    // await aidRequest.save();
    
    // Mock response for demo
    const mockAidRequest = {
      _id: new mongoose.Types.ObjectId().toString(),
      region: region.trim(),
      requesters: [userId],
      status: 'pending',
      adminNote: additionalInfo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(mockAidRequest, { status: 201 });
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
    
    // For demo purposes - in production, you'd fetch from the database
    // const aidRequests = await AidRequest.find({
    //   requesters: userId
    // }).sort({ createdAt: -1 });
    
    // Sample data for demonstration
    const sampleAidRequests = [
      {
        _id: '1',
        region: 'Eastern District, Block 5',
        requesters: [userId],
        status: 'pending',
        adminNote: '',
        createdAt: new Date('2025-04-11T09:30:00')
      },
      {
        _id: '2',
        region: 'Northern Community Center',
        requesters: [userId],
        status: 'approved',
        adminNote: 'Aid supplies will be distributed on April 15th between 10 AM and 4 PM',
        createdAt: new Date('2025-04-09T14:15:00')
      }
    ];
    
    return NextResponse.json(sampleAidRequests);
  } catch (error) {
    console.error('Error fetching aid requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch aid requests', error: error.message },
      { status: 500 }
    );
  }
}