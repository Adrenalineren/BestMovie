const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

/**
 * GET /api/admin/dashboard-stats
 * Returns real-time dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const bookings = getCollection('bookings');
    const screenings = getCollection('screenings');
    const movies = getCollection('movies');

    // Get today's date for statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total statistics
    const totalBookings = await bookings.countDocuments({});
    const todayBookings = await bookings.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Total revenue (excluding cancelled bookings)
    const allBookingsData = await bookings.find({ status: { $ne: 'cancelled' } }).toArray();
    const totalRevenue = allBookingsData.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    const todayBookingsData = await bookings.find({
      status: { $ne: 'cancelled' },
      createdAt: { $gte: today, $lt: tomorrow }
    }).toArray();
    const todayRevenue = todayBookingsData.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    // Track total refunds
    const refundedBookings = await bookings.find({ status: 'cancelled', refundedAt: { $exists: true } }).toArray();
    const totalRefunds = refundedBookings.reduce((sum, booking) => sum + (booking.refundAmount || booking.totalAmount || 0), 0);

    // Total tickets sold
    const totalTickets = allBookingsData.reduce((sum, booking) => sum + (booking.seats?.length || 0), 0);
    const todayTickets = todayBookingsData.reduce((sum, booking) => sum + (booking.seats?.length || 0), 0);

    // Most booked movie
    const movieStats = {};
    allBookingsData.forEach(booking => {
      const title = booking.movieTitle || 'Unknown';
      movieStats[title] = (movieStats[title] || 0) + 1;
    });
    const mostBookedMovie = Object.keys(movieStats).length > 0
      ? Object.entries(movieStats).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    // Average booking value
    const avgBookingValue = totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0;

    return res.json({
      success: true,
      stats: {
        totalBookings,
        todayBookings,
        totalRevenue: totalRevenue.toFixed(2),
        todayRevenue: todayRevenue.toFixed(2),
        totalRefunds: totalRefunds.toFixed(2),
        totalTickets,
        todayTickets,
        mostBookedMovie,
        avgBookingValue,
        lastUpdated: new Date().toLocaleTimeString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/bookings
 * Returns all bookings with filtering and sorting
 */
const getAllBookings = async (req, res) => {
  try {
    const bookings = getCollection('bookings');
    const screenings = getCollection('screenings');
    const movies = getCollection('movies');

    const { status, sortBy = 'createdAt', order = -1 } = req.query;

    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get bookings
    const allBookings = await bookings
      .find(filter)
      .sort({ [sortBy]: parseInt(order) })
      .toArray();

    // Enrich with screening details
    const enrichedBookings = await Promise.all(
      allBookings.map(async (booking) => {
        const screening = await screenings.findOne({ _id: booking.screeningId });
        
        return {
          ...booking,
          screeningDate: screening?.date,
          screeningTime: screening?.screeningTime,
          hallName: booking.hallName || screening?.hallName
        };
      })
    );

    res.json({
      success: true,
      count: enrichedBookings.length,
      bookings: enrichedBookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/admin/bookings/:bookingId
 * Deletes a booking from the database
 */
const deleteBooking = async (req, res) => {
  try {
    const bookings = getCollection('bookings');
    const { bookingId } = req.params;

    if (!bookingId || !ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const result = await bookings.deleteOne({ _id: new ObjectId(bookingId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllBookings,
  deleteBooking
};
