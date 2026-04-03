const express = require('express');
const router = express.Router();
const { postCreateBooking, getBookingDetails } = require('../controllers/bookingController');

// POST /api/bookings - Create a new booking
router.post('/', postCreateBooking);

// GET /api/bookings/:id - Get booking details
router.get('/:id', getBookingDetails);

module.exports = router;
