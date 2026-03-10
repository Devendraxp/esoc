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
    type: String
  }],
  dislikes: [{
    type: String
  }],
  reports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  fakeScore: {
    type: Number,
    default: 0
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

let Post;
try {

  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge' && mongoose.models.Post) {
    delete mongoose.models.Post;
  }


  Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
} catch (error) {
  console.error('Error registering Post model:', error);

  Post = {
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([])
  };
}

export default Post;
