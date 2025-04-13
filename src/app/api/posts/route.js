import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import Post from '../../../models/Post';

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
    await connectToDatabase();
    
    // Sample data for demonstration - remove this in production
    // and only rely on the actual database query below
    const samplePosts = [
      {
        _id: '1',
        content: 'This is a sample post with important community updates. Stay informed about developments in our region.',
        author: { clerkId: 'user_1', profile_location: 'Region 1' },
        createdAt: new Date('2025-04-10T12:00:00'),
        likes: ['user_2', 'user_3'],
        media: []
      },
      {
        _id: '2',
        content: 'Were organizing aid distribution tomorrow at Central Square. Please bring valid ID if youre collecting supplies.',
        author: { clerkId: 'user_2', profile_location: 'Region 2' },
        createdAt: new Date('2025-04-11T09:30:00'),
        likes: ['user_1'],
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809' }]
      },
      {
        _id: '3',
        content: 'Water purification systems are now operational in the western district. Residents can access clean water at designated points.',
        author: { clerkId: 'user_3', profile_location: 'Region 3' },
        createdAt: new Date('2025-04-12T14:15:00'),
        likes: [],
        media: [
          { type: 'image', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809' },
          { type: 'document', url: '/water-safety-guide.pdf' }
        ]
      }
    ];

    // Fetch posts from the database
    // In a real app, use the actual database query
    const posts = await Post.find().populate('author').sort({ createdAt: -1 }).limit(10);
    
    // Return posts (sample data for now)
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
    
    // For multipart form data
    const formData = await request.formData();
    const content = formData.get('content');
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Post content is required' },
        { status: 400 }
      );
    }
    
    // Process media files
    const mediaFiles = formData.getAll('media');
    const media = [];
    
    // In a real app, you'd upload these files to a storage service
    // and store their URLs in the database
    for (const file of mediaFiles) {
      // Simplified for demo - in a real app, upload to S3, Cloudinary, etc.
      const fileType = file.type.split('/')[0];
      media.push({
        type: fileType,
        url: `/uploads/${Date.now()}-${file.name}` // Example path
      });
    }
const post = new Post({
      author: userId,
      content,
      media,
      likes: [],
      reports: [],
      fakeScore: 0
    });
    await post.save();

    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: 'Failed to create post', error: error.message },
      { status: 500 }
    );
  }
}