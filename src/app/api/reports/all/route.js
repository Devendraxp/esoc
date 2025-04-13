import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Report from '../../../../models/Report';

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
    // const reports = await Report.find()
    //   .populate('post')
    //   .populate('reporter')
    //   .sort({ createdAt: -1 });
    
    // Sample data for demonstration
    const sampleReports = [
      {
        _id: 'rep_1',
        post: {
          _id: '101',
          content: 'WARNING: Water supply in Eastern District is contaminated with industrial chemicals. DO NOT DRINK TAP WATER. Please share!',
          author: { 
            clerkId: 'user_2', 
            profile_location: 'Eastern District' 
          },
          createdAt: new Date('2025-04-12T10:30:00'),
          fakeScore: 8
        },
        reporter: { 
          clerkId: 'user_3', 
          profile_location: 'Eastern District' 
        },
        reason: 'This is fake news and causing panic',
        status: 'resolved',
        createdAt: new Date('2025-04-12T11:15:00'),
        resolvedBy: 'user_2',
        resolvedAt: new Date('2025-04-12T14:30:00'),
        actions: ['Post marked as misinformation', 'Author warned']
      },
      {
        _id: 'rep_2',
        post: {
          _id: '102',
          content: 'Free food and supplies available at Western District Community Center starting tomorrow morning. First come, first served.',
          author: { 
            clerkId: 'user_4', 
            profile_location: 'Western District' 
          },
          createdAt: new Date('2025-04-11T16:45:00'),
          fakeScore: 3
        },
        reporter: { 
          clerkId: 'user_5', 
          profile_location: 'Western District' 
        },
        reason: 'This is misleading, no supplies are available at this location',
        status: 'pending',
        createdAt: new Date('2025-04-11T18:30:00')
      },
      {
        _id: 'rep_3',
        post: {
          _id: '103',
          content: 'Government officials are stealing aid supplies and selling them on the black market. I have proof and witnesses.',
          author: { 
            clerkId: 'user_6', 
            profile_location: 'Region 1' 
          },
          createdAt: new Date('2025-04-10T09:20:00'),
          fakeScore: 6
        },
        reporter: { 
          clerkId: 'user_7', 
          profile_location: 'Region 1' 
        },
        reason: 'Potentially harmful accusations without evidence',
        status: 'resolved',
        createdAt: new Date('2025-04-10T10:40:00'),
        resolvedBy: 'user_5',
        resolvedAt: new Date('2025-04-10T11:25:00'),
        actions: ['Post removed', 'Author warned']
      },
      {
        _id: 'rep_4',
        post: {
          _id: '104',
          content: 'Bridge collapsed at Highway 7 intersection. Avoid this route completely!',
          author: { 
            clerkId: 'user_8', 
            profile_location: 'Region 3' 
          },
          createdAt: new Date('2025-04-09T15:10:00'),
          fakeScore: 1
        },
        reporter: { 
          clerkId: 'user_9', 
          profile_location: 'Region 3' 
        },
        reason: 'This is old information, the bridge has been repaired already',
        status: 'pending',
        createdAt: new Date('2025-04-09T19:45:00')
      },
      {
        _id: 'rep_5',
        post: {
          _id: '105',
          content: 'Warning: There is an active shooter in the Central Mall area. Police are responding. Stay away!',
          author: { 
            clerkId: 'user_10', 
            profile_location: 'Central District' 
          },
          createdAt: new Date('2025-04-13T08:25:00'),
          fakeScore: 9
        },
        reporter: { 
          clerkId: 'user_11', 
          profile_location: 'Central District' 
        },
        reason: 'Extremely dangerous fake news causing panic. Police confirmed no such incident.',
        status: 'pending',
        createdAt: new Date('2025-04-13T08:40:00')
      }
    ];
    
    return NextResponse.json(sampleReports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reports', error: error.message },
      { status: 500 }
    );
  }
}