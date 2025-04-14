import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Ensure virtuals are included in JSON
CommentSchema.set('toJSON', { virtuals: true });
CommentSchema.set('toObject', { virtuals: true });

// Safe model registration that checks for Edge runtime
let Comment;
try {
  // Only check/delete the model in non-edge environments
  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge' && mongoose.models.Comment) {
    delete mongoose.models.Comment;
  }
  
  // Register model
  Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
} catch (error) {
  console.error('Error registering Comment model:', error);
  // Provide a minimal model stub for Edge runtime
  Comment = { 
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([])
  };
}

export default Comment;