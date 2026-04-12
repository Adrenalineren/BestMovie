const express = require('express');
const router = express.Router();

// GET /admin/bookings/bookings-management - Bookings management page
router.get('/bookings-management', (req, res) => {
  res.render('bookings/bookings-management', { user: req.session.user });
});

module.exports = router;
