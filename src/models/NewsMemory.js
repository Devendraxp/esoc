import mongoose from 'mongoose';

// Schema for news memory items
const NewsMemorySchema = new mongoose.Schema({
  // The source from which this memory was derived
  source: {
    type: String,
    enum: ['post', 'comment'],
    required: true
  },
  // Reference to the original post or comment
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'source'
  },
  // The processed content that the AI can understand
  processedContent: {
    type: String,
    required: true
  },
  // Location information from the post/comment if available
  location: {
    type: String
  },
  // Timestamp when the content was created
  originalCreatedAt: {
    type: Date,
    required: true
  },
  // Embedding vector for similarity search (stored as array of numbers)
  embedding: {
    type: [Number],
    sparse: true
  },
  // Metadata for tracking and management
  isProcessed: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create indexes for faster querying
NewsMemorySchema.index({ source: 1, sourceId: 1 }, { unique: true });
NewsMemorySchema.index({ location: 1 });

// Safe model registration that checks for Edge runtime
let NewsMemory;
try {
  // Register model safely
  NewsMemory = mongoose.models.NewsMemory || mongoose.model('NewsMemory', NewsMemorySchema);
} catch (error) {
  console.error('Error registering NewsMemory model:', error);
  // Provide a minimal model stub for Edge runtime
  NewsMemory = { 
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([]),
    findOne: () => Promise.resolve(null),
    aggregate: () => Promise.resolve([])
  };
}

export default NewsMemory;