import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Post from '../../../../models/Post';
import User from '../../../../models/User';

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
    
    // Fetch the post from the database with complete author info
    const post = await Post.findById(id).populate({
      path: 'author',
      model: User,
      select: 'clerkId firstName lastName username email profileImageUrl profile_location bio role'
    });
    
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    return NextResponse.json(post);
    
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { message: 'Failed to fetch post', error: error.message },
      { status: 500 }
    );
  }
}