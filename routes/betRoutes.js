const express = require('express');
const router = express.Router();
const betController = require('../controllers/betController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, betController.myBets);
router.post('/', authenticate, betController.place);
router.delete('/:id', authenticate, betController.delete);
router.get('/all', authenticate, requireAdmin, betController.allBets);

module.exports = router;
