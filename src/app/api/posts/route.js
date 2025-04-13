import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Post from '../../../models/Post';
import User from '../../../models/User';
import { uploadMedia } from '../../../utils/cloudinary';

// Database connection function
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app';
  
  try {
    // Set strictQuery to prepare for Mongoose 7
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Fetch posts from the database with complete author information
    const posts = await Post.find()
      .populate({
        path: 'author',
        model: User,
        select: 'clerkId firstName lastName username email profileImageUrl profile_location bio role'
      })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return NextResponse.json(posts);
    
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch posts', error: error.message },
      { status: 500 }
    );
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
    
    await connectToDatabase();
    
    // Check if user exists in our database, if not create a user
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      user = new User({
        clerkId: userId,
        role: 'normal'
      });
      await user.save();
    }
    
    // For multipart form data
    const formData = await request.formData();
    const content = formData.get('content');
    const location = formData.get('location') || '';
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Post content is required' },
        { status: 400 }
      );
    }
    
    // Process media files
    const mediaFiles = formData.getAll('media');
    const media = [];
    
    // Upload files to Cloudinary
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        if (file.size > 0) {
          try {
            // Upload to Cloudinary and get the URL
            const uploadedMedia = await uploadMedia(file);
            media.push({
              type: uploadedMedia.type,
              url: uploadedMedia.url,
              public_id: uploadedMedia.public_id
            });
          } catch (uploadError) {
            console.error('Error uploading media:', uploadError);
          }
        }
      }
    }
    
    // Create and save the post with reference to user document (not just clerkId)
    const post = new Post({
      author: user._id, // Use the MongoDB user _id 
      content: content.trim(),
      location: location.trim(),
      media,
      likes: [],
      reports: [],
      fakeScore: 0
    });
    
    await post.save();
    
    // Populate the author details before returning
    const populatedPost = await Post.findById(post._id).populate({
      path: 'author',
      model: User,
      select: 'clerkId firstName lastName username email profileImageUrl profile_location bio role'
    });
    
    return NextResponse.json(populatedPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: 'Failed to create post', error: error.message },
      { status: 500 }
    );
  }
}