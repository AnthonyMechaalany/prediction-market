const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Market title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['politics', 'sports', 'technology', 'entertainment', 'science', 'economics', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'resolved'],
    default: 'open'
  },
  outcome: {
    type: String,
    enum: ['YES', 'NO', null],
    default: null
  },
  closesAt: {
    type: Date,
    required: [true, 'Closing date is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Many-to-many: Users who bet on this market (via Bets)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalYesPoints: { type: Number, default: 0 },
  totalNoPoints: { type: Number, default: 0 }
}, { timestamps: true });

// Virtual for bets
marketSchema.virtual('bets', {
  ref: 'Bet',
  localField: '_id',
  foreignField: 'market'
});

marketSchema.set('toJSON', { virtuals: true });
marketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Market', marketSchema);
