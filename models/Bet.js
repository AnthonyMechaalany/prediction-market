const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  market: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true
  },
  prediction: {
    type: String,
    enum: ['YES', 'NO'],
    required: [true, 'Prediction (YES or NO) is required']
  },
  amount: {
    type: Number,
    required: [true, 'Bet amount is required'],
    min: [10, 'Minimum bet is 10 points'],
    max: [10000, 'Maximum bet is 10000 points']
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost'],
    default: 'pending'
  },
  payout: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// A user can only bet once per market
betSchema.index({ user: 1, market: 1 }, { unique: true });

module.exports = mongoose.model('Bet', betSchema);
