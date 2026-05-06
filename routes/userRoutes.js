const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/profile', authenticate, userController.profile);
router.get('/', authenticate, requireAdmin, userController.index);
router.get('/:id', authenticate, requireAdmin, userController.show);
router.get('/:id/edit', authenticate, requireAdmin, userController.editForm);
router.put('/:id', authenticate, requireAdmin, userController.update);
router.delete('/:id', authenticate, requireAdmin, userController.delete);

module.exports = router;
