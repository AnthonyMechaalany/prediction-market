const Market = require('../models/Market');
const Bet = require('../models/Bet');
const User = require('../models/User');

exports.index = async (req, res) => {
  try {
    // 1. Automatically transition 'open' markets to 'closed' if their time has passed
    await Market.updateMany(
      { status: 'open', closesAt: { $lt: new Date() } },
      { $set: { status: 'closed' } }
    );

    // 2. Fetch markets with filters
    const { category, status, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const markets = await Market.find(filter)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.render('markets/index', { title: 'Markets', markets, query: req.query });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

exports.show = async (req, res) => {
  try {
    const market = await Market.findById(req.params.id).populate('createdBy', 'username');
    if (!market) return res.status(404).render('404', { title: '404' });

    // Ensure we trigger the auto-close check for this specific market too
    if (market.status === 'open' && new Date() > market.closesAt) {
      market.status = 'closed';
      await market.save();
    }

    const bets = await Bet.find({ market: market._id }).populate('user', 'username');
    let userBet = null;
    if (req.user) {
      userBet = await Bet.findOne({ market: market._id, user: req.user._id });
    }

    res.render('markets/show', { title: market.title, market, bets, userBet });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

exports.newForm = (req, res) => {
  res.render('markets/new', { title: 'Create Market', error: null });
};

exports.create = async (req, res) => {
  try {
    const { title, description, category, closesAt } = req.body;
    const market = await Market.create({
      title, description, category, closesAt,
      createdBy: req.user._id
    });
    res.redirect(`/markets/${market._id}`);
  } catch (err) {
    const message = err.errors ? Object.values(err.errors).map(e => e.message).join(', ') : err.message;
    res.render('markets/new', { title: 'Create Market', error: message });
  }
};

exports.editForm = async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).render('404', { title: '404' });
    if (market.status !== 'open') {
      return res.redirect(`/markets/${market._id}`);
    }
    res.render('markets/edit', { title: 'Edit Market', market, error: null });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, category, closesAt } = req.body;
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).render('404', { title: '404' });
    if (market.status !== 'open') return res.redirect(`/markets/${market._id}`);

    market.title = title;
    market.description = description;
    market.category = category;
    market.closesAt = closesAt;
    await market.save();
    res.redirect(`/markets/${market._id}`);
  } catch (err) {
    const market = await Market.findById(req.params.id);
    const message = err.errors ? Object.values(err.errors).map(e => e.message).join(', ') : err.message;
    res.render('markets/edit', { title: 'Edit Market', market, error: message });
  }
};

exports.delete = async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).render('404', { title: '404' });

    // Refund all pending bets
    const bets = await Bet.find({ market: market._id, status: 'pending' });
    for (const bet of bets) {
      await User.findByIdAndUpdate(bet.user, { $inc: { points: bet.amount } });
    }
    await Bet.deleteMany({ market: market._id });
    await market.deleteOne();
    res.redirect('/markets');
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

// Admin: resolve market with YES or NO outcome
exports.resolve = async (req, res) => {
  try {
    const { outcome } = req.body;
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).render('404', { title: '404' });
    if (market.status === 'resolved') return res.redirect(`/markets/${market._id}`);

    market.status = 'resolved';
    market.outcome = outcome;
    await market.save();

    // Settle bets
    const bets = await Bet.find({ market: market._id, status: 'pending' });
    for (const bet of bets) {
      if (bet.prediction === outcome) {
        // Winner: get back double their bet
        bet.status = 'won';
        bet.payout = bet.amount * 2;
        await User.findByIdAndUpdate(bet.user, { $inc: { points: bet.amount * 2 } });
      } else {
        bet.status = 'lost';
        bet.payout = 0;
      }
      await bet.save();
    }

    res.redirect(`/markets/${market._id}`);
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};
