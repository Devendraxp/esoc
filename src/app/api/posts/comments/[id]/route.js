import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Comment from '../../../../../models/Comment';
import User from '../../../../../models/User';

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

export async function GET(request, { params }) {
  try {
    const commentId = await params.id;

    await connectToDatabase();

    const comment = await Comment.findById(commentId)
      .populate({
        path: 'author',
        model: User,
        select: 'clerkId firstName lastName username profileImageUrl profile_location bio role'
      });

    if (!comment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(comment);

  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { message: 'Failed to fetch comment', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const commentId = await params.id;

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();


    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }


    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }


    if (!comment.author.equals(user._id) && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - You can only edit your own comments' },
        { status: 403 }
      );
    }

    const { content } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }


    comment.content = content.trim();
    await comment.save();


    const updatedComment = await Comment.findById(commentId).populate({
      path: 'author',
      model: User,
      select: 'clerkId firstName lastName username profileImageUrl profile_location bio role'
    });

    return NextResponse.json(updatedComment);

  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { message: 'Failed to update comment', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const commentId = await params.id;

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();


    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }


    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }


    if (!comment.author.equals(user._id) && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - You can only delete your own comments' },
        { status: 403 }
      );
    }


    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json({ message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { message: 'Failed to delete comment', error: error.message },
      { status: 500 }
    );
  }
}
