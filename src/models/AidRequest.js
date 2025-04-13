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
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  adminNote: {
    type: String
  }
}, { timestamps: true });

const AidRequest = mongoose.models.AidRequest || mongoose.model('AidRequest', AidRequestSchema);

export default AidRequest;