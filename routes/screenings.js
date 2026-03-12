const express = require('express');
const requireLogin = require('../middleware/auth');
const screeningController = require('../controllers/screeningController');

const router = express.Router();

router.get('/admin/screening-management', requireLogin, screeningController.getScreeningManagement);
router.get('/admin/screening-management/create', requireLogin, screeningController.getScreeningCreate);
router.post('/admin/screening-management/create', requireLogin, screeningController.postScreeningCreate);
router.get('/admin/screening-management/:id/edit', requireLogin, screeningController.getScreeningEdit);
router.post('/admin/screening-management/:id/edit', requireLogin, screeningController.postScreeningEdit);
router.post('/admin/screening-management/:id/delete', requireLogin, screeningController.postScreeningDelete);

module.exports = router;