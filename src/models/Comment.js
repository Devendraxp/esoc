import mongoose from 'mongoose';

// Clear model if it exists to ensure clean rebuild
if (mongoose.models.Comment) {
  delete mongoose.models.Comment;
}

const CommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: String, // Changed to String to accept Clerk user IDs
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Virtual for populating author from User model
CommentSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: 'clerkId',
  justOne: true
});

// Ensure virtuals are included in JSON
CommentSchema.set('toJSON', { virtuals: true });
CommentSchema.set('toObject', { virtuals: true });

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

export default Comment;