const express = require('express');
const requireLogin = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
router.get('/admin/dashboard', requireLogin, authController.getDashboard);

module.exports = router;