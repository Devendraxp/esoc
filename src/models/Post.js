import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  media: [{
    type: { type: String },
    url: { type: String },
    public_id: { type: String }
  }],
  likes: [{
    type: String // Clerk user IDs for users who liked the post
  }],
  dislikes: [{
    type: String // Clerk user IDs for users who disliked the post
  }],
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  fakeScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ensure virtuals are included in JSON
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

// Safe model registration that checks for Edge runtime
let Post;
try {
  // Only check/delete the model in non-edge environments
  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge' && mongoose.models.Post) {
    delete mongoose.models.Post;
  }
  
  // Register model
  Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
} catch (error) {
  console.error('Error registering Post model:', error);
  // Provide a minimal model stub for Edge runtime
  Post = { 
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([])
  };
}

export default Post;