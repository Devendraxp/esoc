import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['normal', 'special', 'admin'],
    default: 'normal'
  },
  profile_location: {
    type: String
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create index on clerkId for faster lookups
UserSchema.index({ clerkId: 1 });

// Check if model exists before creating it (for hot reloading in Next.js)
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;