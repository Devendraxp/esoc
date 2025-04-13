import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Report from '../../../models/Report';

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
    
    // Parse URL to extract region query parameter
    const url = new URL(request.url);
    const region = url.searchParams.get('region');
    
    await connectToDatabase();
    
    // For demo purposes - in production, you'd fetch from the database
    // let query = {};
    // if (region) {
    //   query['post.author.profile_location'] = region;
    // }
    // const reports = await Report.find(query)
    //   .populate('post')
    //   .populate('reporter')
    //   .sort({ createdAt: -1 });
    
    // Sample data for demonstration
    let sampleReports = [
      {
        _id: '1',
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
        reason: 'fake',
        status: 'pending',
        createdAt: new Date('2025-04-12T11:15:00')
      },
      {
        _id: '2',
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
        reason: 'misleading',
        status: 'pending',
        createdAt: new Date('2025-04-11T18:30:00')
      },
      {
        _id: '3',
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
        reason: 'harmful',
        status: 'pending',
        createdAt: new Date('2025-04-10T10:40:00')
      }
    ];
    
    // Filter by region if specified
    if (region) {
      sampleReports = sampleReports.filter(report => 
        report.post?.author?.profile_location === region
      );
    }
    
    return NextResponse.json(sampleReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reports', error: error.message },
      { status: 500 }
    );
  }
}