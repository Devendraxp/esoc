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

CommentSchema.set('toJSON', { virtuals: true });
CommentSchema.set('toObject', { virtuals: true });

let Comment;
try {

  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge' && mongoose.models.Comment) {
    delete mongoose.models.Comment;
  }


  Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
} catch (error) {
  console.error('Error registering Comment model:', error);

  Comment = {
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([])
  };
}

export default Comment;
