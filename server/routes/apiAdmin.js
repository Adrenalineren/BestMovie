// Admin managment APIs for dashboard stats, booking management, and seat visualization

const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllBookings, getScreeningSeatsData, deleteBooking } = require('../handlers/apiAdminHandlers');

// GET /api/admin/dashboard-stats - Get real-time statistics
router.get('/dashboard-stats', getDashboardStats);

// GET /api/admin/bookings - Get all bookings
router.get('/bookings', getAllBookings);

// DELETE /api/admin/bookings/:bookingId - Delete a booking
router.delete('/bookings/:bookingId', deleteBooking);

// GET /api/admin/screening/:screeningId/seats - Get seat visualization for a screening
router.get('/screening/:screeningId/seats', getScreeningSeatsData);

module.exports = router;
