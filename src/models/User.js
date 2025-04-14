import mongoose from 'mongoose';

const UpgradeRequestSchema = new mongoose.Schema({
  organization: {
    type: String,
    required: true
  },
  reason: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    // Don't set index:true here since we use UserSchema.index() below
  },
  username: {
    type: String
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  email: {
    type: String
  },
  profileImageUrl: {
    type: String
  },
  role: {
    type: String,
    enum: ['normal', 'special', 'admin'],
    default: 'normal'
  },
  profile_location: {
    type: String
  },
  bio: {
    type: String,
    maxlength: 160
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  upgradeRequest: UpgradeRequestSchema
}, { timestamps: true });

// Create index on clerkId for faster lookups
UserSchema.index({ clerkId: 1 });

// Check if model exists before creating it (for hot reloading in Next.js)
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;