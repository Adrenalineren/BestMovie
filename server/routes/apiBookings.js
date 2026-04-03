const express = require('express');
const router = express.Router();
const { getBookingsByScreeningJSON, createBookingJSON } = require('../handlers/apiBookingHandlers');

// POST /api/bookings - Create a new booking
router.post('/', createBookingJSON);

// GET /api/bookings/screening/:screeningId - Get booked seats for a screening
router.get('/screening/:screeningId', getBookingsByScreeningJSON);

module.exports = router;
