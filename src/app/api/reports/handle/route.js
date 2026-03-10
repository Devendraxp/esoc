import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Report from '../../../../models/Report';
import Post from '../../../../models/Post';
import Comment from '../../../../models/Comment';
import User from '../../../../models/User';

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
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reportId, action } = await request.json();

    if (!reportId) {
      return NextResponse.json(
        { message: 'Report ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['agree', 'disagree', 'read'].includes(action)) {
      return NextResponse.json(
        { message: 'Valid action (agree, disagree, or read) is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();


    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }


    if (user.role !== 'admin' && user.role !== 'special') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin or special user access required' },
        { status: 403 }
      );
    }


    const report = await Report.findById(reportId);

    if (!report) {
      return NextResponse.json(
        { message: 'Report not found' },
        { status: 404 }
      );
    }


    let message = '';
    let contentType = report.type === 'post' ? 'Post' : 'Comment';

    if (action === 'agree') {

      report.status = 'agreed';
      report.handledBy = user._id;


      if (report.type === 'post') {
        await Post.findByIdAndDelete(report.post);
        message = 'Post has been deleted permanently';
      } else if (report.type === 'comment') {
        await Comment.findByIdAndDelete(report.comment);
        message = 'Comment has been deleted permanently';
      }
    } else if (action === 'disagree') {

      report.status = 'disagreed';
      report.handledBy = user._id;
      message = `${contentType} report has been dismissed`;
    } else if (action === 'read') {
      // Mark as read - add user to seenBy array
      if (!report.seenBy.includes(user._id)) {
        report.seenBy.push(user._id);
      }
      message = `${contentType} report has been marked as read`;
    }

    await report.save();

    return NextResponse.json({
      message,
      report: await Report.findById(report._id)
        .populate({
          path: 'post',
          select: 'content author createdAt'
        })
        .populate({
          path: 'comment',
          select: 'content author post createdAt'
        })
        .populate({
          path: 'reporter',
          select: 'clerkId username firstName lastName email profileImageUrl'
        })
        .populate({
          path: 'handledBy',
          select: 'clerkId username firstName lastName email profileImageUrl'
        })
    });
  } catch (error) {
    console.error('Error handling report:', error);
    return NextResponse.json(
      { message: 'Failed to handle report', error: error.message },
      { status: 500 }
    );
  }
}
