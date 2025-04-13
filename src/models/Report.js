import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reason: {
    type: String,
    enum: ['fake', 'offensive', 'other'],
    required: true
  }
}, { timestamps: true });

const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);

export default Report;