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
    
    // Find the user to verify they're an admin or special user
    const user = await mongoose.model('User').findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only admins can view all requests, special users can only see pending ones
    if (user.role !== 'admin' && user.role !== 'special') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin or special access required' },
        { status: 403 }
      );
    }
    
    // Build query based on role and parameters
    let query = {};
    
    // Get parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const region = url.searchParams.get('region');
    const acceptedByMe = url.searchParams.get('acceptedByMe') === 'true';
    
    // If a special user is making the request
    if (user.role === 'special') {
      // Check if they want to see requests they've accepted
      if (acceptedByMe) {
        // Show all requests accepted by this user that are not completed
        query = {
          acceptedBy: user._id,
          status: { $ne: 'completed' } // Exclude completed requests
        };
      }
      // If status parameter is provided and not looking for acceptedByMe
      else if (status) {
        if (status === 'pending') {
          // For pending status, exclude requests denied by this user
          query = {
            status: 'pending',
            deniedBy: { $ne: user._id },
            acceptedBy: { $exists: false }
          };
        } else {
          // For other statuses (like "approved"), include only those accepted by this user
          // or other statuses like "received", "prepared", etc. that are managed by this user
          query = {
            status: status,
            acceptedBy: user._id
          };
        }
      } else {
        // No status parameter - use the original complex query
        query = {
          $or: [
            {
              status: 'pending',
              deniedBy: { $ne: user._id },
              acceptedBy: { $exists: false }
            },
            {
              acceptedBy: user._id,
              status: { $ne: 'completed' } // Exclude completed requests
            }
          ]
        };
      }
    } else {
      // For admin users, just filter by status if provided
      if (status) {
        query.status = status;
      }
    }
    
    // Filter by region if provided (for special users in specific regions)
    if (region) {
      query.region = { $regex: region, $options: 'i' };
    }
    
    // Fetch aid requests from the database
    const aidRequests = await AidRequest.find(query)
      .populate({
        path: 'requesters',
        select: 'clerkId firstName lastName username email profileImageUrl profile_location role'
      })
      .populate({
        path: 'respondedBy',
        select: 'clerkId firstName lastName username email profileImageUrl profile_location role'
      })
      .sort({ 
        requesterRole: -1, // Special users' requests first
        createdAt: -1      // Then newest first
      });
    
    return NextResponse.json(aidRequests);
  } catch (error) {
    console.error('Error fetching all aid requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch aid requests', error: error.message },
      { status: 500 }
    );
  }
}