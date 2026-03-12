const express = require('express');
const requireLogin = require('../middleware/auth');
const hallController = require('../controllers/hallController');

const router = express.Router();

router.get('/admin/hall-management', requireLogin, hallController.getHallManagement);
router.get('/admin/hall-management/create', requireLogin, hallController.getHallCreate);
router.post('/admin/hall-management/create', requireLogin, hallController.postHallCreate);
router.get('/admin/hall-management/:id/check-screenings', requireLogin, hallController.getHallScreeningsCheck);
router.post('/admin/hall-management/:id/status', requireLogin, hallController.postHallStatus);
router.post('/admin/hall-management/:id/delete', requireLogin, hallController.postHallDelete);
router.get('/admin/hall-management/:id/view', requireLogin, hallController.getHallView);
router.get('/admin/hall-management/:id/edit', requireLogin, hallController.getHallEdit);
router.post('/admin/hall-management/:id/edit', requireLogin, hallController.postHallEdit);

module.exports = router;