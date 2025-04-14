import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['post', 'comment'],
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: function() {
      return this.type === 'post' || this.type === 'comment';
    }
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: function() {
      return this.type === 'comment';
    }
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'agreed', 'disagreed', 'read'],
    default: 'pending'
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);

export default Report;