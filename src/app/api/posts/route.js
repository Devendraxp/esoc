import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Post from '../../../models/Post';
import User from '../../../models/User';
import NewsMemory from '../../../models/NewsMemory';
import { uploadMedia } from '../../../utils/cloudinary';
import { checkMisinfo } from '../../../utils/huggingface';
import { generateGoogleEmbedding } from '../../../lib/embeddings';

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app';

  try {

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


    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;


    const posts = await Post.find()
      .populate({
        path: 'author',
        model: User,
        select: 'clerkId firstName lastName username email profileImageUrl profile_location bio role'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);


    const total = await Post.countDocuments();

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total
      }
    });

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


    let user = await User.findOne({ clerkId: userId });
    if (!user) {

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

    try {
      const misinfo = await checkMisinfo(content.trim());
      if (misinfo.isSuspect) {
        await Post.findByIdAndUpdate(post._id, {
          flagged: true,
          flagReason: `${misinfo.label} (${Math.round(misinfo.confidence * 100)}% confidence)`
        });
      }
    } catch (err) {
      console.error('Misinfo check failed:', err);
    }

    // Index into NewsMemory for real-time search
    try {
      if (content.trim().length >= 20) {
        const embedding = await generateGoogleEmbedding(content.trim());
        await NewsMemory.findOneAndUpdate(
          { source: 'post', sourceId: post._id },
          {
            source: 'post',
            sourceId: post._id,
            processedContent: content.trim(),
            location: location.trim() || user.profile_location || '',
            originalCreatedAt: post.createdAt,
            embedding
          },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      console.error('NewsMemory indexing failed:', err);
    }

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
