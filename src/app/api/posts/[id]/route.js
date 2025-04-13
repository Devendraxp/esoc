import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Post from '../../../../models/Post';

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
    const id = params.id;
    await connectToDatabase();
    
    // For demo purposes - in production, you'd fetch from the database
    // const post = await Post.findById(id).populate('author');
    // if (!post) {
    //   return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    // }
    
    // Sample data for demonstration
    const samplePost = {
      _id: id,
      content: "This is a detailed post with important community updates. Stay informed about developments in our region. We've identified several key areas that need attention and support from community members.\n\nPlease share this information with anyone who might be affected. Resources are being distributed at the community center daily from 9am to 5pm.",
      author: { clerkId: 'user_1', profile_location: 'Region 1' },
      createdAt: new Date('2025-04-10T12:00:00').toISOString(),
      likes: ['user_2', 'user_3'],
      fakeScore: id === '2' ? 7 : 0,
      media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809' },
        { type: 'document', url: '/community-resources.pdf' }
      ]
    };
    
    return NextResponse.json(samplePost);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { message: 'Failed to fetch post', error: error.message },
      { status: 500 }
    );
  }
}