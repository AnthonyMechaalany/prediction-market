const Bet = require('../models/Bet');
const Market = require('../models/Market');
const User = require('../models/User');

exports.myBets = async (req, res) => {
  try {
    const bets = await Bet.find({ user: req.user._id })
      .populate('market', 'title status outcome category')
      .sort({ createdAt: -1 });
    res.render('bets/index', { title: 'My Bets', bets });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

exports.place = async (req, res) => {
  const { marketId, prediction, amount } = req.body;
  try {
    const market = await Market.findById(marketId);
    if (!market || market.status !== 'open') {
      return res.redirect(`/markets/${marketId}?error=Market+is+not+open`);
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      return res.redirect(`/markets/${marketId}?error=Minimum+bet+is+10+points`);
    }

    const user = await User.findById(req.user._id);
    if (user.points < parsedAmount) {
      return res.redirect(`/markets/${marketId}?error=Insufficient+points`);
    }

    // Check if user already bet on this market
    const existingBet = await Bet.findOne({ user: req.user._id, market: marketId });
    if (existingBet) {
      return res.redirect(`/markets/${marketId}?error=You+already+placed+a+bet+on+this+market`);
    }

    // Deduct points
    user.points -= parsedAmount;
    await user.save();

    // Create bet
    await Bet.create({ user: req.user._id, market: marketId, prediction, amount: parsedAmount });

    // Update market totals and participants
    const updateField = prediction === 'YES' ? 'totalYesPoints' : 'totalNoPoints';
    await Market.findByIdAndUpdate(marketId, {
      $inc: { [updateField]: parsedAmount },
      $addToSet: { participants: req.user._id }
    });

    res.redirect(`/markets/${marketId}?success=Bet+placed+successfully`);
  } catch (err) {
    if (err.code === 11000) {
      return res.redirect(`/markets/${marketId}?error=You+already+placed+a+bet+on+this+market`);
    }
    res.render('error', { title: 'Error', message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const bet = await Bet.findById(req.params.id);
    if (!bet) return res.status(404).render('404', { title: '404' });

    // Only owner or admin can delete
    if (bet.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).render('error', { title: 'Forbidden', message: 'Access denied' });
    }

    const market = await Market.findById(bet.market);
    if (market && market.status !== 'open') {
      return res.redirect('/bets?error=Cannot+cancel+a+bet+on+a+closed+market');
    }

    // Refund points if market still open
    if (bet.status === 'pending') {
      await User.findByIdAndUpdate(bet.user, { $inc: { points: bet.amount } });
      const updateField = bet.prediction === 'YES' ? 'totalYesPoints' : 'totalNoPoints';
      await Market.findByIdAndUpdate(bet.market, {
        $inc: { [updateField]: -bet.amount },
        $pull: { participants: bet.user }
      });
    }

    await bet.deleteOne();
    res.redirect('/bets');
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

// Admin: view all bets
exports.allBets = async (req, res) => {
  try {
    const bets = await Bet.find()
      .populate('user', 'username')
      .populate('market', 'title status')
      .sort({ createdAt: -1 });
    res.render('bets/all', { title: 'All Bets', bets });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};
