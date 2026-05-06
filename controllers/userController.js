const User = require('../models/User');
const Bet = require('../models/Bet');

// Admin: list all users
exports.index = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.render('users/index', { title: 'Manage Users', users });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

// Admin: show user profile
exports.show = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).render('404', { title: '404' });
    const bets = await Bet.find({ user: user._id }).populate('market', 'title status outcome');
    res.render('users/show', { title: user.username, user, bets });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

// Admin: edit user form
exports.editForm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).render('404', { title: '404' });
    res.render('users/edit', { title: 'Edit User', user, error: null });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

// Admin: update user
exports.update = async (req, res) => {
  try {
    const { username, email, role, points } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).render('404', { title: '404' });

    user.username = username;
    user.email = email;
    user.role = role;
    user.points = parseInt(points);
    await user.save();
    res.redirect('/users');
  } catch (err) {
    const user = await User.findById(req.params.id).select('-password');
    const message = err.errors ? Object.values(err.errors).map(e => e.message).join(', ') : err.message;
    res.render('users/edit', { title: 'Edit User', user, error: message });
  }
};

// Admin: delete user
exports.delete = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).render('404', { title: '404' });
    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.redirect('/users?error=Cannot+delete+your+own+account');
    }
    await Bet.deleteMany({ user: user._id });
    await user.deleteOne();
    res.redirect('/users');
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

// Profile: own profile
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const bets = await Bet.find({ user: req.user._id }).populate('market', 'title status outcome category');
    const stats = {
      total: bets.length,
      won: bets.filter(b => b.status === 'won').length,
      lost: bets.filter(b => b.status === 'lost').length,
      pending: bets.filter(b => b.status === 'pending').length,
      totalWon: bets.filter(b => b.status === 'won').reduce((s, b) => s + b.payout, 0),
      totalLost: bets.filter(b => b.status === 'lost').reduce((s, b) => s + b.amount, 0),
    };
    res.render('users/profile', { title: 'My Profile', user, bets, stats });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};
