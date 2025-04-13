import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import AidRequest from '../../../../models/AidRequest';

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
    
    // For demo purposes - in production, you'd fetch from the database
    // const adminUser = await User.findOne({ clerkId: userId });
    // 
    // if (!adminUser || adminUser.role !== 'admin') {
    //   return NextResponse.json(
    //     { message: 'Unauthorized - Admin access required' },
    //     { status: 403 }
    //   );
    // }
    // 
    // const aidRequests = await AidRequest.find()
    //   .sort({ createdAt: -1 });
    
    // Sample data for demonstration
    const sampleAidRequests = [
      {
        _id: 'aid_1',
        region: 'Eastern District',
        status: 'pending',
        requesters: [{ clerkId: 'user_3' }, { clerkId: 'user_7' }, { clerkId: 'user_12' }],
        adminNote: 'Multiple families trapped in building with dwindling supplies',
        createdAt: new Date('2025-04-10T08:30:00'),
        updatedAt: new Date('2025-04-10T08:30:00')
      },
      {
        _id: 'aid_2',
        region: 'Western District',
        status: 'approved',
        requesters: [{ clerkId: 'user_4' }, { clerkId: 'user_8' }],
        adminNote: 'Medical supplies needed urgently',
        createdAt: new Date('2025-04-09T14:15:00'),
        updatedAt: new Date('2025-04-09T16:20:00'),
        respondedBy: 'user_2',
        respondedAt: new Date('2025-04-09T16:20:00')
      },
      {
        _id: 'aid_3',
        region: 'Northern Community',
        status: 'denied',
        requesters: [{ clerkId: 'user_5' }],
        adminNote: 'Request for luxury items not critical at this time',
        createdAt: new Date('2025-04-08T11:45:00'),
        updatedAt: new Date('2025-04-08T13:10:00'),
        respondedBy: 'user_5',
        respondedAt: new Date('2025-04-08T13:10:00')
      },
      {
        _id: 'aid_4',
        region: 'Region 1',
        status: 'approved',
        requesters: [{ clerkId: 'user_6' }, { clerkId: 'user_9' }, { clerkId: 'user_11' }],
        adminNote: 'Food and water supplies needed for isolated community',
        createdAt: new Date('2025-04-07T09:20:00'),
        updatedAt: new Date('2025-04-07T10:45:00'),
        respondedBy: 'user_2',
        respondedAt: new Date('2025-04-07T10:45:00')
      },
      {
        _id: 'aid_5',
        region: 'Region 3',
        status: 'pending',
        requesters: [{ clerkId: 'user_10' }],
        adminNote: 'Shelter required for displaced families',
        createdAt: new Date('2025-04-12T07:30:00'),
        updatedAt: new Date('2025-04-12T07:30:00')
      }
    ];
    
    return NextResponse.json(sampleAidRequests);
  } catch (error) {
    console.error('Error fetching all aid requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch aid requests', error: error.message },
      { status: 500 }
    );
  }
}