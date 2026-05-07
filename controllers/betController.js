const Bet = require('../models/Bet');
const Market = require('../models/Market');
const User = require('../models/User');

/**
 * GET /bets
 * Responsible for fetching and displaying the current user's personal betting history.
 */
exports.myBets = async (req, res) => {
  try {
    const bets = await Bet.find({ user: req.user._id })
      // We populate market details and include closesAt to check expiration in the UI
      .populate('market', 'title status outcome category closesAt')
      .sort({ createdAt: -1 });
    
    res.render('bets/index', { title: 'My Bets', bets });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

/**
 * POST /bets
 * Responsible for the logic of placing a bet, deducting points, and updating market totals.
 */
exports.place = async (req, res) => {
  const { marketId, prediction, amount } = req.body;
  try {
    const market = await Market.findById(marketId);
    
    // TIME-LOCK: Check if current time is past the market's closing deadline
    const isPastClosing = market && new Date() > new Date(market.closesAt);

    // 1. Availability Check: Ensure market exists, is 'open', and not past the deadline
    if (!market || market.status !== 'open' || isPastClosing) {
      return res.redirect(`/markets/${marketId}?error=Market+is+closed+for+new+bets`);
    }

    // 2. Amount Validation: Ensure the number is valid and meets the minimum requirement
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      return res.redirect(`/markets/${marketId}?error=Minimum+bet+is+10+points`);
    }

    // 3. Balance Check: Ensure user has enough points to cover the bet
    const user = await User.findById(req.user._id);
    if (user.points < parsedAmount) {
      return res.redirect(`/markets/${marketId}?error=Insufficient+points`);
    }

    // 4. Duplicate Check: Ensure user hasn't already bet (redundant to DB index but good for UX)
    const existingBet = await Bet.findOne({ user: req.user._id, market: marketId });
    if (existingBet) {
      return res.redirect(`/markets/${marketId}?error=You+already+placed+a+bet+on+this+market`);
    }

    // 5. Point Transaction: Deduct points from user's account before creating the bet
    user.points -= parsedAmount;
    await user.save();

    // 6. Record Creation: Save the bet using the Bet.js schema
    await Bet.create({ 
      user: req.user._id, 
      market: marketId, 
      prediction, 
      amount: parsedAmount 
    });

    // 7. Global Update: Increment the point pool for YES/NO and track the participant
    const updateField = prediction === 'YES' ? 'totalYesPoints' : 'totalNoPoints';
    await Market.findByIdAndUpdate(marketId, {
      $inc: { [updateField]: parsedAmount },
      $addToSet: { participants: req.user._id }
    });

    res.redirect(`/markets/${marketId}?success=Bet+placed+successfully`);
  } catch (err) {
    // Catch-all for unique index violations if two requests happen simultaneously
    if (err.code === 11000) {
      return res.redirect(`/markets/${marketId}?error=You+already+placed+a+bet+on+this+market`);
    }
    res.render('error', { title: 'Error', message: err.message });
  }
};

/**
 * DELETE /bets/:id
 * Responsible for canceling a bet, deleting the record, and refunding points to the user.
 */
exports.delete = async (req, res) => {
  try {
    const bet = await Bet.findById(req.params.id);
    if (!bet) return res.status(404).render('404', { title: '404' });

    // 1. Security: Ensure only the bet creator or an admin can perform the deletion
    if (bet.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).render('error', { title: 'Forbidden', message: 'Access denied' });
    }

    const market = await Market.findById(bet.market);
    
    // TIME-LOCK: Prevent refunding if the deadline has passed (stops "last second" cheating)
    const isPastClosing = market && new Date() > new Date(market.closesAt);

    if (market && (market.status !== 'open' || isPastClosing)) {
      return res.redirect('/bets?error=Cannot+cancel+a+bet+once+the+market+is+closed');
    }

    // 2. Refund Logic: Reverse the point transaction and update market pool totals
    if (bet.status === 'pending') {
      // Refund user's points
      await User.findByIdAndUpdate(bet.user, { $inc: { points: bet.amount } });
      
      // Remove points from the YES or NO pool total
      const updateField = bet.prediction === 'YES' ? 'totalYesPoints' : 'totalNoPoints';
      await Market.findByIdAndUpdate(bet.market, {
        $inc: { [updateField]: -bet.amount },
        $pull: { participants: bet.user }
      });
    }

    // 3. Database Cleanup: Permanently remove the bet record
    await bet.deleteOne();
    res.redirect('/bets');
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};

/**
 * GET /bets/all
 * Admin-only function to monitor all betting activity across the platform.
 */
exports.allBets = async (req, res) => {
  try {
    const bets = await Bet.find()
      .populate('user', 'username')
      .populate('market', 'title status closesAt')
      .sort({ createdAt: -1 });
    res.render('bets/all', { title: 'All Bets', bets });
  } catch (err) {
    res.render('error', { title: 'Error', message: err.message });
  }
};