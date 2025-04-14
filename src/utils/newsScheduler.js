import schedule from 'node-schedule';
import mongoose from 'mongoose';
// Import models dynamically to prevent issues with middleware initialization
let Post, Comment, NewsMemory;

// Database connection function
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for news processing');
    
    // Dynamically import models after connection is established
    if (!Post) Post = mongoose.model('Post');
    if (!Comment) Comment = mongoose.model('Comment');
    if (!NewsMemory) NewsMemory = mongoose.model('NewsMemory');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Utility to safely import models
async function ensureModelsLoaded() {
  try {
    if (!Post) {
      const PostModule = await import('../models/Post');
      Post = PostModule.default;
    }
    if (!Comment) {
      const CommentModule = await import('../models/Comment');
      Comment = CommentModule.default;
    }
    if (!NewsMemory) {
      const NewsMemoryModule = await import('../models/NewsMemory');
      NewsMemory = NewsMemoryModule.default;
    }
    
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    return false;
  }
}

/**
 * Process new posts and store them in the NewsMemory collection
 */
async function processPosts() {
  try {
    await connectToDatabase();
    await ensureModelsLoaded();
    
    if (!Post || !NewsMemory) {
      console.error('Models not available for post processing');
      return;
    }
    
    // Get the timestamp of the most recent processed post
    const mostRecentMemory = await NewsMemory.findOne({
      source: 'post'
    }).sort({ originalCreatedAt: -1 });
    
    const lastProcessedDate = mostRecentMemory?.originalCreatedAt || new Date(0);
    
    // Find all newer posts
    const newPosts = await Post.find({
      createdAt: { $gt: lastProcessedDate }
    }).populate({
      path: 'author',
      select: 'profile_location'
    }).limit(50); // Process in batches to avoid memory issues
    
    console.log(`Found ${newPosts.length} new posts to process`);
    
    // Process each post
    for (const post of newPosts) {
      try {
        // Skip if already processed
        const exists = await NewsMemory.findOne({
          source: 'post',
          sourceId: post._id
        });
        
        if (exists) continue;
        
        // Process the content with the LLM
        const { processContentWithLLM, generateEmbeddings } = await import('./huggingface');
        const processedContent = await processContentWithLLM(post.content);
        
        // Generate embeddings
        const embedding = await generateEmbeddings(processedContent);
        
        // Create a new memory entry
        const memory = new NewsMemory({
          source: 'post',
          sourceId: post._id,
          processedContent,
          location: post.location || post.author?.profile_location || '',
          originalCreatedAt: post.createdAt,
          embedding
        });
        
        await memory.save();
        console.log(`Processed post ${post._id}`);
      } catch (error) {
        console.error(`Error processing post ${post._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in post processing job:', error);
  }
}

/**
 * Process new comments and store them in the NewsMemory collection
 */
async function processComments() {
  try {
    await connectToDatabase();
    await ensureModelsLoaded();
    
    if (!Comment || !NewsMemory) {
      console.error('Models not available for comment processing');
      return;
    }
    
    // Get the timestamp of the most recent processed comment
    const mostRecentMemory = await NewsMemory.findOne({
      source: 'comment'
    }).sort({ originalCreatedAt: -1 });
    
    const lastProcessedDate = mostRecentMemory?.originalCreatedAt || new Date(0);
    
    // Find all newer comments
    const newComments = await Comment.find({
      createdAt: { $gt: lastProcessedDate }
    }).populate({
      path: 'author',
      select: 'profile_location'
    }).populate({
      path: 'post',
      select: 'location'
    }).limit(50); // Process in batches
    
    console.log(`Found ${newComments.length} new comments to process`);
    
    // Process each comment
    for (const comment of newComments) {
      try {
        // Skip if already processed
        const exists = await NewsMemory.findOne({
          source: 'comment',
          sourceId: comment._id
        });
        
        if (exists) continue;
        
        // Process the content with the LLM
        const { processContentWithLLM, generateEmbeddings } = await import('./huggingface');
        const processedContent = await processContentWithLLM(comment.content);
        
        // Generate embeddings
        const embedding = await generateEmbeddings(processedContent);
        
        // Create a new memory entry
        const memory = new NewsMemory({
          source: 'comment',
          sourceId: comment._id,
          processedContent,
          location: comment.post?.location || comment.author?.profile_location || '',
          originalCreatedAt: comment.createdAt,
          embedding
        });
        
        await memory.save();
        console.log(`Processed comment ${comment._id}`);
      } catch (error) {
        console.error(`Error processing comment ${comment._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in comment processing job:', error);
  }
}

/**
 * Process all existing posts and comments, even those previously processed
 * Used for rebuilding the memory database or testing
 */
export async function processAllContent() {
  try {
    console.log('Starting complete content processing...');
    await connectToDatabase();
    await ensureModelsLoaded();
    
    if (!Post || !Comment || !NewsMemory) {
      console.error('Models not available for content processing');
      return {
        success: false,
        message: 'Models not available'
      };
    }
    
    // Get counts for reporting
    const startingMemoryCount = await NewsMemory.countDocuments();
    
    // Find all posts (limited to most recent 500 for performance)
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .populate({
        path: 'author',
        select: 'profile_location'
      });
    
    console.log(`Processing ${posts.length} posts...`);
    let postsProcessed = 0;
    let postsSkipped = 0;
    let postsError = 0;
    
    // Process each post
    for (const post of posts) {
      try {
        // Skip if content is too short to be meaningful
        if (!post.content || post.content.length < 20) {
          postsSkipped++;
          continue;
        }
        
        // Process with simpler approach if HuggingFace fails
        try {
          // Try to process with HuggingFace
          const { processContentWithLLM, generateEmbeddings } = await import('./huggingface');
          const processedContent = await processContentWithLLM(post.content);
          const embedding = await generateEmbeddings(processedContent);
          
          // Create or update memory entry
          await NewsMemory.findOneAndUpdate(
            { source: 'post', sourceId: post._id },
            {
              source: 'post',
              sourceId: post._id,
              originalContent: post.content,
              processedContent,
              location: post.location || post.author?.profile_location || '',
              originalCreatedAt: post.createdAt,
              embedding
            },
            { upsert: true, new: true }
          );
        } catch (modelError) {
          console.error('HuggingFace processing failed, using fallback:', modelError);
          
          // Simple text processing fallback
          const processedContent = `Content from post dated ${post.createdAt.toISOString().split('T')[0]}: ${post.content.substring(0, 500)}`;
          
          // Store without embeddings
          await NewsMemory.findOneAndUpdate(
            { source: 'post', sourceId: post._id },
            {
              source: 'post',
              sourceId: post._id,
              originalContent: post.content,
              processedContent,
              location: post.location || post.author?.profile_location || '',
              originalCreatedAt: post.createdAt,
              // Use a simple embedding if needed
              embedding: new Array(384).fill(0) 
            },
            { upsert: true, new: true }
          );
        }
        
        postsProcessed++;
      } catch (error) {
        console.error(`Error processing post ${post._id}:`, error);
        postsError++;
      }
    }
    
    // Get comments (limited to most recent 500)
    const comments = await Comment.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .populate({
        path: 'author',
        select: 'profile_location'
      })
      .populate({
        path: 'post',
        select: 'location'
      });
    
    console.log(`Processing ${comments.length} comments...`);
    let commentsProcessed = 0;
    let commentsSkipped = 0;
    let commentsError = 0;
    
    // Process each comment with similar approach as posts
    for (const comment of comments) {
      try {
        if (!comment.content || comment.content.length < 15) {
          commentsSkipped++;
          continue;
        }
        
        try {
          // Try HuggingFace processing
          const { processContentWithLLM, generateEmbeddings } = await import('./huggingface');
          const processedContent = await processContentWithLLM(comment.content);
          const embedding = await generateEmbeddings(processedContent);
          
          await NewsMemory.findOneAndUpdate(
            { source: 'comment', sourceId: comment._id },
            {
              source: 'comment',
              sourceId: comment._id,
              originalContent: comment.content,
              processedContent,
              location: comment.post?.location || comment.author?.profile_location || '',
              originalCreatedAt: comment.createdAt,
              embedding
            },
            { upsert: true, new: true }
          );
        } catch (modelError) {
          // Fallback processing
          console.error('HuggingFace processing failed for comment, using fallback:', modelError);
          
          const processedContent = `Comment on post from ${comment.createdAt.toISOString().split('T')[0]}: ${comment.content.substring(0, 300)}`;
          
          await NewsMemory.findOneAndUpdate(
            { source: 'comment', sourceId: comment._id },
            {
              source: 'comment',
              sourceId: comment._id,
              originalContent: comment.content,
              processedContent,
              location: comment.post?.location || comment.author?.profile_location || '',
              originalCreatedAt: comment.createdAt,
              embedding: new Array(384).fill(0)
            },
            { upsert: true, new: true }
          );
        }
        
        commentsProcessed++;
      } catch (error) {
        console.error(`Error processing comment ${comment._id}:`, error);
        commentsError++;
      }
    }
    
    // Get final count for reporting
    const endingMemoryCount = await NewsMemory.countDocuments();
    
    return {
      success: true,
      summary: {
        posts: { processed: postsProcessed, skipped: postsSkipped, error: postsError },
        comments: { processed: commentsProcessed, skipped: commentsSkipped, error: commentsError },
        memoryItems: { before: startingMemoryCount, after: endingMemoryCount, added: endingMemoryCount - startingMemoryCount }
      }
    };
  } catch (error) {
    console.error('Error in processAllContent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize the scheduling of news processing tasks
 */
export function initializeNewsProcessor() {
  if (typeof window !== 'undefined') {
    console.log('News processor not initialized - running in browser');
    return;
  }
  
  console.log('Initializing news processor scheduler');
  
  // Schedule post processing every hour
  schedule.scheduleJob('0 * * * *', async () => {
    console.log('Running scheduled post processing job');
    await processPosts();
  });
  
  // Schedule comment processing every hour at 30 minutes past
  schedule.scheduleJob('30 * * * *', async () => {
    console.log('Running scheduled comment processing job');
    await processComments();
  });
  
  // Run an initial processing job on startup with a delay to ensure models are registered
  setTimeout(async () => {
    try {
      console.log('Running initial processing job');
      // Ensure models are loaded before processing
      const modelsLoaded = await ensureModelsLoaded();
      if (modelsLoaded) {
        await processPosts();
        await processComments();
      } else {
        console.log('Models not available, skipping initial processing');
      }
    } catch (error) {
      console.error('Error in initial processing job:', error);
    }
  }, 10000); // Wait 10 seconds after startup
}

export default {
  initializeNewsProcessor,
  processPosts,
  processComments,
  processAllContent
};