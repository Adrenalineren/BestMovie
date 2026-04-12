// Customer-facing booking APIs

const express = require('express');
const router = express.Router();
const { getCollection } = require('../lib/database');
const { ObjectId } = require('mongodb');
const { getBookingsByScreeningJSON, createBookingJSON } = require('../handlers/apiBookingHandlers');
const { requireAuthJWT } = require('../lib/jwtAuth');

// POST /api/bookings - Create a new booking (requires JWT auth)
router.post('/', requireAuthJWT, createBookingJSON);

// GET /api/bookings/search - for customers to view their own bookings (requires JWT auth)
router.get('/search', requireAuthJWT, async (req, res) => {
  try {
    const bookings = getCollection('bookings');
    const screenings = getCollection('screenings');
    const movies = getCollection('movies');
    
    // Get customerId from JWT token (attached by requireAuthJWT middleware)
    const customerId = req.customer.customerId;

    // Find all bookings for this customer
    const userBookings = await bookings.find({ 
      customerId: new ObjectId(customerId) 
    }).toArray();

    // Enrich with screening and movie details
    const enrichedBookings = await Promise.all(
      userBookings.map(async (booking) => {
        const screening = await screenings.findOne({ _id: booking.screeningId });
        const movie = await movies.findOne({ _id: screening?.movieId });
        
        return {
          ...booking,
          screeningDate: screening?.date,
          screeningTime: screening?.screeningTime,
          movieTitle: movie?.title || booking.movieTitle,
          posterUrl: movie?.posterUrl
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
});

// GET /api/bookings/screening/:screeningId - Get booked seats for a screening
router.get('/screening/:screeningId', getBookingsByScreeningJSON);
module.exports = router;
