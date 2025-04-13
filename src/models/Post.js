import mongoose from 'mongoose';

// Clear model if it exists to ensure clean rebuild
// This helps prevent issues with hot reloading in development
if (mongoose.models.Post) {
  delete mongoose.models.Post;
}

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

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

export default Post;