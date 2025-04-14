import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Comment from '../../../../../models/Comment';
import Post from '../../../../../models/Post';
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

export async function GET(request, { params }) {
  try {
    // Correctly destructure the params object
    const { id } = params;
    await connectToDatabase();
    
    // Fetch comments for the post from the database with full author information
    const comments = await Comment.find({ post: id })
      .populate({
        path: 'author',
        model: User,
        select: 'clerkId firstName lastName username email profileImageUrl profile_location bio role'
      })
      .sort({ createdAt: 1 });
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch comments', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = getAuth(request);
    // Correctly destructure the params object
    const { id: postId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - You must be logged in to comment' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Check if user exists in our database, if not create a user
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      // Fetch user details from Clerk to properly sync all user data
      const res = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch user data from Clerk');
      }
      
      const clerkUser = await res.json();
      
      // Extract primary email
      let primaryEmail = null;
      if (clerkUser.email_addresses && clerkUser.email_addresses.length > 0) {
        const primaryEmailObj = clerkUser.email_addresses.find(
          email => email.id === clerkUser.primary_email_address_id
        ) || clerkUser.email_addresses[0];
        
        primaryEmail = primaryEmailObj.email_address;
      }
      
      // Create a new user with complete information
      user = new User({
        clerkId: userId,
        firstName: clerkUser.first_name || '',
        lastName: clerkUser.last_name || '',
        username: clerkUser.username || '',
        email: primaryEmail,
        profileImageUrl: clerkUser.image_url || '',
        role: 'normal',
        joinedAt: new Date(),
        lastActiveAt: new Date()
      });
      await user.save();
    } else {
      // Update lastActiveAt for existing user
      user.lastActiveAt = new Date();
      await user.save();
    }
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    const { content } = await request.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Create and save the comment with MongoDB user ID
    const comment = new Comment({
      post: postId,
      author: user._id, // Now using MongoDB user ID instead of Clerk ID
      content: content.trim()
    });
    
    await comment.save();
    
    // Return the comment with author information
    const populatedComment = await Comment.findById(comment._id).populate({
      path: 'author',
      model: User,
      select: 'clerkId firstName lastName username profileImageUrl profile_location bio role'
    });
    
    return NextResponse.json(populatedComment, { status: 201 });
    
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { message: 'Failed to create comment', error: error.message },
      { status: 500 }
    );
  }
}