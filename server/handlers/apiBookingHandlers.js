const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

// GET /api/bookings/screening/:screeningId - Get all booked seats for a screening
const getBookingsByScreeningJSON = async (req, res) => {
  try {
    const bookings = getCollection('bookings');
    const screeningBookings = await bookings
      .find({ screeningId: new ObjectId(req.params.screeningId) })
      .toArray();

    // Extract all booked seat positions
    const bookedSeats = screeningBookings.flatMap(booking => booking.seats || []);
    
    res.status(200).json({
      screeningId: req.params.screeningId,
      bookedSeats: bookedSeats,
      totalBookings: screeningBookings.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/bookings - Create a new booking with race condition prevention
const createBookingJSON = async (req, res) => {
  console.log('Booking request:', req.body);
  
  try {
    const { screeningId, seatsToBook, paymentMethod, customerName, customerEmail, movieTitle, hallName, moviePrice } = req.body;
    
    // Validate input
    if (!screeningId || !seatsToBook || !Array.isArray(seatsToBook) || seatsToBook.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid booking data' 
      });
    }

    if (!customerName || !customerEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer name and email are required' 
      });
    }

    const screenings = getCollection('screenings');
    const bookings = getCollection('bookings');
    const seatReservations = getCollection('seatReservations');

    // Verify screening exists
    const screening = await screenings.findOne({ _id: new ObjectId(screeningId) });
    if (!screening) {
      return res.status(404).json({ 
        success: false, 
        error: 'Screening not found' 
      });
    }

    const screeningObjectId = new ObjectId(screeningId);
    const reservationToken = new ObjectId().toString();

    console.log('Attempting strict seat reservation:', seatsToBook);

    try {
      const reservationDocs = seatsToBook.map((seatLabel) => ({
        screeningId: screeningObjectId,
        seatLabel,
        reservationToken,
        status: 'reserved',
        createdAt: new Date()
      }));

      // DB-enforced uniqueness on (screeningId, seatLabel) prevents race-condition double booking.
      await seatReservations.insertMany(reservationDocs, { ordered: true });
    } catch (reservationError) {
      if (reservationError && reservationError.code === 11000) {
        // Roll back any seats inserted before duplicate key was hit.
        await seatReservations.deleteMany({ reservationToken });

        const conflicting = await seatReservations.find({
          screeningId: screeningObjectId,
          seatLabel: { $in: seatsToBook }
        }).toArray();

        const conflictingSeats = conflicting.map((r) => r.seatLabel);

        return res.status(409).json({
          success: false,
          error: 'One or more seats are no longer available. Please select different seats.',
          conflictingSeats
        });
      }

      throw reservationError;
    }

    console.log('Seats reserved, creating booking...');

    // Get customerId from JWT token (req.customer is set by requireAuthJWT middleware)
    const customerId = req.customer?.customerId ? new ObjectId(req.customer.customerId) : null;

    // ATOMIC: Create the booking record
    const booking = {
      screeningId: screeningObjectId,
      seats: seatsToBook,
      customerId: customerId, // Store the authenticated customer ID
      customerName,
      customerEmail,
      movieTitle,
      hallName,
      moviePrice: parseFloat(moviePrice),
      paymentMethod,
      totalAmount: seatsToBook.length * parseFloat(moviePrice) + 2.00,
      status: 'confirmed',
      createdAt: new Date()
    };

    let bookingResult;
    try {
      bookingResult = await bookings.insertOne(booking);
    } catch (insertError) {
      // Roll back seat reservations if booking write fails.
      await seatReservations.deleteMany({ reservationToken });
      throw insertError;
    }

    await seatReservations.updateMany(
      { reservationToken },
      {
        $set: {
          status: 'confirmed',
          bookingId: bookingResult.insertedId,
          confirmedAt: new Date()
        }
      }
    );

    console.log('Booking created:', bookingResult.insertedId);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Booking confirmed!',
      bookingId: bookingResult.insertedId,
      booking
    });

  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
};

module.exports = { 
  getBookingsByScreeningJSON,
  createBookingJSON
};
