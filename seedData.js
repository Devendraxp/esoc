import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Post from './src/models/Post.js';
import Comment from './src/models/Comment.js';

dotenv.config();

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection URI (from your .env file or hardcode it temporarily)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app';

// The two user IDs (these are already MongoDB ObjectIDs)
const USER_IDS = [
  '67fca603fc5b4d8abe4b1066',
  '67fd2ea60e80b37bf65aa5e2'
];

// Function to read the JSON data file
function readJsonFile(filePath) {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return null;
  }
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Create a post in the database
async function createPost(postData) {
  try {
    // Create a new post with the userId directly as the author
    const post = new Post({
      author: new mongoose.Types.ObjectId(postData.userId),
      content: postData.content,
      location: postData.location || '',
      media: postData.imageUrl ? [{
        type: 'image',
        url: postData.imageUrl,
        public_id: `${new Date().getTime()}`
      }] : [],
      tags: postData.tags || [],
      likes: [],
      dislikes: [],
      reports: [],
      fakeScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await post.save();
    console.log(`Created post with ID ${post._id}`);
    return post;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

// Create a comment on a post
async function createComment(postId, commentData) {
  try {
    // Determine the user for this comment
    const userId = commentData.userId || USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
    
    // Create the comment
    const comment = new Comment({
      post: postId,
      author: new mongoose.Types.ObjectId(userId),
      content: commentData.content,
      likes: [],
      dislikes: [],
      reports: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await comment.save();
    console.log(`Created comment with ID ${comment._id}`);
    return comment;
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
}

// Main function to process all the data
async function seedDatabase() {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Read the JSON data
    const dataFilePath = path.join(__dirname, 'postsData.json');
    const postsData = readJsonFile(dataFilePath);

    if (!postsData) {
      console.error('Failed to read posts data');
      return;
    }

    // Filter out empty posts
    const validPosts = postsData.filter(post => post.userId && post.content);
    console.log(`Found ${validPosts.length} valid posts in the data file`);
    
    let processedPosts = 0;
    let processedComments = 0;
    
    // Process each post
    for (const postData of validPosts) {
      // Create the post
      const createdPost = await createPost(postData);
      
      if (createdPost) {
        processedPosts++;
        
        // Process comments if the post has any
        if (postData.comments && postData.comments.length > 0) {
          const validComments = postData.comments.filter(comment => comment.content);
          console.log(`Processing ${validComments.length} comments for post ${createdPost._id}`);
          
          for (const comment of validComments) {
            await createComment(createdPost._id, comment);
            processedComments++;
            
            // Small delay between comments to avoid overloading the database
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        // Small delay between posts to avoid overloading the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Database seeding completed! Created ${processedPosts} posts and ${processedComments} comments.`);
  } finally {
    // Close database connection when done
    mongoose.connection.close();
  }
}

// Run the seeding function
seedDatabase().catch(error => {
  console.error('Error seeding database:', error);
  mongoose.connection.close();
});