import mongoose from 'mongoose';

const NewsMemorySchema = new mongoose.Schema({

  source: {
    type: String,
    enum: ['post', 'comment'],
    required: true
  },

  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'source'
  },

  processedContent: {
    type: String,
    required: true
  },

  location: {
    type: String
  },

  originalCreatedAt: {
    type: Date,
    required: true
  },

  embedding: {
    type: [Number],
    sparse: true
  },

  isProcessed: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

NewsMemorySchema.index({ source: 1, sourceId: 1 }, { unique: true });
NewsMemorySchema.index({ location: 1 });

let NewsMemory;
try {

  NewsMemory = mongoose.models.NewsMemory || mongoose.model('NewsMemory', NewsMemorySchema);
} catch (error) {
  console.error('Error registering NewsMemory model:', error);

  NewsMemory = {
    findById: () => Promise.resolve(null),
    find: () => Promise.resolve([]),
    findOne: () => Promise.resolve(null),
    aggregate: () => Promise.resolve([])
  };
}

export default NewsMemory;
