import schedule from 'node-schedule';
import mongoose from 'mongoose';
import { generateGoogleEmbedding } from '../lib/embeddings.js';

let Post, Comment, NewsMemory;

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esoc-app';
  await mongoose.connect(MONGODB_URI);
}

async function ensureModelsLoaded() {
  try {
    if (!Post) Post = (await import('../models/Post')).default;
    if (!Comment) Comment = (await import('../models/Comment')).default;
    if (!NewsMemory) NewsMemory = (await import('../models/NewsMemory')).default;
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    return false;
  }
}

async function processPosts() {
  await connectToDatabase();
  await ensureModelsLoaded();
  if (!Post || !NewsMemory) return;

  const mostRecentMemory = await NewsMemory.findOne({ source: 'post' }).sort({ originalCreatedAt: -1 });
  const lastProcessedDate = mostRecentMemory?.originalCreatedAt || new Date(0);

  const newPosts = await Post.find({ createdAt: { $gt: lastProcessedDate } })
    .populate({ path: 'author', select: 'profile_location' })
    .limit(50);

  console.log(`Found ${newPosts.length} new posts to process`);

  for (const post of newPosts) {
    try {
      const exists = await NewsMemory.findOne({ source: 'post', sourceId: post._id });
      if (exists) continue;

      const embedding = await generateGoogleEmbedding(post.content);

      await new NewsMemory({
        source: 'post',
        sourceId: post._id,
        processedContent: post.content,
        location: post.location || post.author?.profile_location || '',
        originalCreatedAt: post.createdAt,
        embedding
      }).save();

      console.log(`Processed post ${post._id}`);
    } catch (error) {
      console.error(`Error processing post ${post._id}:`, error);
    }
  }
}

async function processComments() {
  await connectToDatabase();
  await ensureModelsLoaded();
  if (!Comment || !NewsMemory) return;

  const mostRecentMemory = await NewsMemory.findOne({ source: 'comment' }).sort({ originalCreatedAt: -1 });
  const lastProcessedDate = mostRecentMemory?.originalCreatedAt || new Date(0);

  const newComments = await Comment.find({ createdAt: { $gt: lastProcessedDate } })
    .populate({ path: 'author', select: 'profile_location' })
    .populate({ path: 'post', select: 'location' })
    .limit(50);

  console.log(`Found ${newComments.length} new comments to process`);

  for (const comment of newComments) {
    try {
      const exists = await NewsMemory.findOne({ source: 'comment', sourceId: comment._id });
      if (exists) continue;

      const embedding = await generateGoogleEmbedding(comment.content);

      await new NewsMemory({
        source: 'comment',
        sourceId: comment._id,
        processedContent: comment.content,
        location: comment.post?.location || comment.author?.profile_location || '',
        originalCreatedAt: comment.createdAt,
        embedding
      }).save();

      console.log(`Processed comment ${comment._id}`);
    } catch (error) {
      console.error(`Error processing comment ${comment._id}:`, error);
    }
  }
}

export async function processAllContent() {
  try {
    console.log('Starting complete content processing...');
    await connectToDatabase();
    await ensureModelsLoaded();

    if (!Post || !Comment || !NewsMemory) {
      return { success: false, message: 'Models not available' };
    }

    const startingMemoryCount = await NewsMemory.countDocuments();

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .populate({ path: 'author', select: 'profile_location' });

    console.log(`Processing ${posts.length} posts...`);
    let postsProcessed = 0, postsSkipped = 0, postsError = 0;

    for (const post of posts) {
      try {
        if (!post.content || post.content.length < 20) { postsSkipped++; continue; }

        const embedding = await generateGoogleEmbedding(post.content);

        await NewsMemory.findOneAndUpdate(
          { source: 'post', sourceId: post._id },
          {
            source: 'post',
            sourceId: post._id,
            originalContent: post.content,
            processedContent: post.content,
            location: post.location || post.author?.profile_location || '',
            originalCreatedAt: post.createdAt,
            embedding
          },
          { upsert: true, new: true }
        );
        postsProcessed++;
      } catch (error) {
        console.error(`Error processing post ${post._id}:`, error);
        postsError++;
      }
    }

    const comments = await Comment.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .populate({ path: 'author', select: 'profile_location' })
      .populate({ path: 'post', select: 'location' });

    console.log(`Processing ${comments.length} comments...`);
    let commentsProcessed = 0, commentsSkipped = 0, commentsError = 0;

    for (const comment of comments) {
      try {
        if (!comment.content || comment.content.length < 15) { commentsSkipped++; continue; }

        const embedding = await generateGoogleEmbedding(comment.content);

        await NewsMemory.findOneAndUpdate(
          { source: 'comment', sourceId: comment._id },
          {
            source: 'comment',
            sourceId: comment._id,
            originalContent: comment.content,
            processedContent: comment.content,
            location: comment.post?.location || comment.author?.profile_location || '',
            originalCreatedAt: comment.createdAt,
            embedding
          },
          { upsert: true, new: true }
        );
        commentsProcessed++;
      } catch (error) {
        console.error(`Error processing comment ${comment._id}:`, error);
        commentsError++;
      }
    }

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

export function initializeNewsProcessor() {
  if (typeof window !== 'undefined') return;

  console.log('Initializing news processor scheduler');

  schedule.scheduleJob('0 * * * *', async () => {
    console.log('Running scheduled post processing job');
    await processPosts();
  });

  schedule.scheduleJob('30 * * * *', async () => {
    console.log('Running scheduled comment processing job');
    await processComments();
  });

  setTimeout(async () => {
    try {
      const modelsLoaded = await ensureModelsLoaded();
      if (modelsLoaded) {
        await processPosts();
        await processComments();
      }
    } catch (error) {
      console.error('Error in initial processing job:', error);
    }
  }, 10000);
}

export default { initializeNewsProcessor, processPosts, processComments, processAllContent };
