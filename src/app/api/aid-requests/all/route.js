import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import AidRequest from '../../../../models/AidRequest';

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


    const user = await mongoose.model('User').findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }


    if (user.role !== 'admin' && user.role !== 'special') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin or special access required' },
        { status: 403 }
      );
    }


    let query = {};


    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const region = url.searchParams.get('region');
    const acceptedByMe = url.searchParams.get('acceptedByMe') === 'true';


    if (user.role === 'special') {

      if (acceptedByMe) {

        query = {
          acceptedBy: user._id,
          status: { $ne: 'completed' }
        };
      }

      else if (status) {
        if (status === 'pending') {

          query = {
            status: 'pending',
            deniedBy: { $ne: user._id },
            acceptedBy: { $exists: false }
          };
        } else {


          query = {
            status: status,
            acceptedBy: user._id
          };
        }
      } else {

        query = {
          $or: [
            {
              status: 'pending',
              deniedBy: { $ne: user._id },
              acceptedBy: { $exists: false }
            },
            {
              acceptedBy: user._id,
              status: { $ne: 'completed' }
            }
          ]
        };
      }
    } else {

      if (status) {
        query.status = status;
      }
    }


    if (region) {
      query.region = { $regex: region, $options: 'i' };
    }


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
        requesterRole: -1,
        createdAt: -1
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
