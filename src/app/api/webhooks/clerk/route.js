import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import mongoose from 'mongoose';
import User from '../../../../models/User';
import { syncUserWithClerk } from '../../../../utils/clerk-helpers';

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

export async function POST(request) {
  // Get the Clerk webhook secret from environment variables
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json(
      { message: 'Server misconfigured' },
      { status: 500 }
    );
  }
  
  // Get the headers and body
  const headerPayload = request.headers;
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');
  
  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { message: 'Missing Svix headers' },
      { status: 400 }
    );
  }
  
  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);
  
  // Create a new Svix instance with your secret
  const webhook = new Webhook(webhookSecret);
  
  try {
    // Verify the payload with the headers
    webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return NextResponse.json(
      { message: 'Invalid signature' },
      { status: 400 }
    );
  }
  
  // Connect to the database
  await connectToDatabase();
  
  const { type, data } = payload;
  console.log(`Webhook received: ${type}`);
  
  // Handle different webhook events
  try {
    // User created event
    if (type === 'user.created') {
      await handleUserCreated(data);
    }
    // User updated event
    else if (type === 'user.updated') {
      await handleUserUpdated(data);
    }
    // User deleted event
    else if (type === 'user.deleted') {
      await handleUserDeleted(data);
    }
    
    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { message: 'Error processing webhook', error: error.message },
      { status: 500 }
    );
  }
}

// Handle user created event
async function handleUserCreated(userData) {
  console.log('Processing user.created webhook for:', userData.id);
  
  // Check if user already exists in our database
  const existingUser = await User.findOne({ clerkId: userData.id });
  
  if (existingUser) {
    console.log('User already exists in database:', existingUser._id);
    return;
  }
  
  // Sync user data from Clerk
  const syncedUserData = await syncUserWithClerk(userData);
  
  // Create new user in our database
  const newUser = await User.create({
    ...syncedUserData,
    joinedAt: new Date(),
    lastActiveAt: new Date()
  });
  
  console.log('Created new user from webhook:', newUser._id);
}

// Handle user updated event
async function handleUserUpdated(userData) {
  console.log('Processing user.updated webhook for:', userData.id);
  
  // Find the user in our database
  const existingUser = await User.findOne({ clerkId: userData.id });
  
  if (!existingUser) {
    console.log('User not found in database, creating new user');
    await handleUserCreated(userData);
    return;
  }
  
  // Sync user data from Clerk
  const syncedUserData = await syncUserWithClerk(userData, existingUser);
  
  // Update user in our database
  const updatedUser = await User.findOneAndUpdate(
    { clerkId: userData.id },
    { 
      $set: { 
        ...syncedUserData,
        lastActiveAt: new Date() 
      } 
    },
    { new: true }
  );
  
  console.log('Updated user from webhook:', updatedUser._id);
}

// Handle user deleted event
async function handleUserDeleted(userData) {
  console.log('Processing user.deleted webhook for:', userData.id);
  
  // Option 1: Delete the user from our database
  // await User.deleteOne({ clerkId: userData.id });
  
  // Option 2: Flag the user as deleted (preserves data for reference)
  const updatedUser = await User.findOneAndUpdate(
    { clerkId: userData.id },
    { 
      $set: { 
        isDeleted: true,
        deletedAt: new Date()
      } 
    },
    { new: true }
  );
  
  if (updatedUser) {
    console.log('Marked user as deleted:', updatedUser._id);
  } else {
    console.log('User not found for deletion');
  }
}