import mongoose from 'mongoose';

const NewsQuerySchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  query: {
    type: String,
    required: true
  },

  location: {
    type: String
  },

  localModelResponse: {
    type: String
  },

  grokResponse: {
    type: String
  },

  relatedMemories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsMemory'
  }],

  userRating: {
    type: Number,
    min: 1,
    max: 5
  },

  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String
  }
}, { timestamps: true });

NewsQuerySchema.index({ user: 1 });
NewsQuerySchema.index({ location: 1 });
NewsQuerySchema.index({ createdAt: -1 });

let NewsQuery;
try {

  NewsQuery = mongoose.models.NewsQuery || mongoose.model('NewsQuery', NewsQuerySchema);
} catch (error) {
  console.error('Error registering NewsQuery model:', error);

  NewsQuery = {
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([]),
    findOne: () => Promise.resolve(null),
    countDocuments: () => Promise.resolve(0)
  };
}

export default NewsQuery;
