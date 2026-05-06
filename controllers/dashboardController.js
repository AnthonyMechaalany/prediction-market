const Market = require('../models/Market');
const Bet = require('../models/Bet');
const User = require('../models/User');

exports.home = async (req, res) => {
  try {
    const openMarkets = await Market.find({ status: 'open' })
      .populate('createdBy', 'username')
      .sort({ closesAt: 1 })
      .limit(6);
    res.render('home', { title: 'PredictIt - Prediction Markets', openMarkets });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const [totalMarkets, openMarkets, resolvedMarkets, totalUsers, recentBets] = await Promise.all([
      Market.countDocuments(),
      Market.countDocuments({ status: 'open' }),
      Market.countDocuments({ status: 'resolved' }),
      User.countDocuments(),
      Bet.find({ user: req.user._id }).populate('market', 'title status outcome').sort({ createdAt: -1 }).limit(5)
    ]);

    let adminStats = null;
    if (req.user.role === 'admin') {
      const totalBets = await Bet.countDocuments();
      const recentMarkets = await Market.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'username');
      adminStats = { totalBets, recentMarkets };
    }

    res.render('dashboard', {
      title: 'Dashboard',
      stats: { totalMarkets, openMarkets, resolvedMarkets, totalUsers },
      recentBets,
      adminStats
    });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};
