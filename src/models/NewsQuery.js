import mongoose from 'mongoose';

// Schema for news queries and responses
const NewsQuerySchema = new mongoose.Schema({
  // The user who made the query
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The original query text from the user
  query: {
    type: String,
    required: true
  },
  // The location context if specified in the query
  location: {
    type: String
  },
  // Response from the local model
  localModelResponse: {
    type: String
  },
  // Response from Grok
  grokResponse: {
    type: String
  },
  // References to memory items that were used for context
  relatedMemories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsMemory'
  }],
  // Quality metrics
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String
  }
}, { timestamps: true });

// Create indexes for faster querying
NewsQuerySchema.index({ user: 1 });
NewsQuerySchema.index({ location: 1 });
NewsQuerySchema.index({ createdAt: -1 });

// Safe model registration that checks for Edge runtime
let NewsQuery;
try {
  // Register model safely
  NewsQuery = mongoose.models.NewsQuery || mongoose.model('NewsQuery', NewsQuerySchema);
} catch (error) {
  console.error('Error registering NewsQuery model:', error);
  // Provide a minimal model stub for Edge runtime
  NewsQuery = { 
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([]),
    findOne: () => Promise.resolve(null),
    countDocuments: () => Promise.resolve(0)
  };
}

export default NewsQuery;