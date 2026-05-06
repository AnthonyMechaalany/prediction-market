const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, dashboardController.home);
router.get('/dashboard', authenticate, dashboardController.dashboard);

module.exports = router;
