import mongoose from 'mongoose';

const AidRequestSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true
  },
  requesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'received', 'prepared', 'shipped', 'delivered', 'completed'],
    default: 'pending'
  },
  adminNote: {
    type: String
  },
  requesterRole: {
    type: String,
    enum: ['normal', 'special', 'admin'],
    default: 'normal'
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: {
    type: Date
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deniedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

const AidRequest = mongoose.models.AidRequest || mongoose.model('AidRequest', AidRequestSchema);

export default AidRequest;