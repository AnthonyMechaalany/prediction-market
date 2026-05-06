const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, marketController.index);
router.get('/new', authenticate, requireAdmin, marketController.newForm);
router.post('/', authenticate, requireAdmin, marketController.create);
router.get('/:id', optionalAuth, marketController.show);
router.get('/:id/edit', authenticate, requireAdmin, marketController.editForm);
router.put('/:id', authenticate, requireAdmin, marketController.update);
router.delete('/:id', authenticate, requireAdmin, marketController.delete);
router.post('/:id/resolve', authenticate, requireAdmin, marketController.resolve);

module.exports = router;
