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
  console.log('BookingJSON called with body:', req.body);
  
  try {
    const { screeningId, seatsToBook, paymentMethod, movieTitle, hallName, moviePrice } = req.body;
    
    console.log('Received data:', { screeningId, seatsToBook, paymentMethod, movieTitle, hallName, moviePrice });
    
    // Validate input
    if (!screeningId || !seatsToBook || !Array.isArray(seatsToBook) || seatsToBook.length === 0) {
      console.log('Validation failed');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid booking data' 
      });
    }

    console.log('Validation passed, getting collections...');
    const screenings = getCollection('screenings');
    const bookings = getCollection('bookings');

    // First, check if screening exists and initialize bookedSeats if missing
    console.log('Checking screening...');
    const screening = await screenings.findOne({ _id: new ObjectId(screeningId) });
    
    if (!screening) {
      console.log('Screening not found:', screeningId);
      return res.status(404).json({ 
        success: false, 
        error: 'Screening not found' 
      });
    }

    // Initialize bookedSeats if it doesn't exist
    if (!screening.bookedSeats || !Array.isArray(screening.bookedSeats)) {
      console.log('Initializing bookedSeats for screening...');
      await screenings.updateOne(
        { _id: new ObjectId(screeningId) },
        { $set: { bookedSeats: [] } }
      );
      // Re-fetch to ensure we have the latest state
      const updatedScreening = await screenings.findOne({ _id: new ObjectId(screeningId) });
      console.log('Updated screening bookedSeats:', updatedScreening.bookedSeats);
    } else {
      console.log('Current bookedSeats:', screening.bookedSeats);
    }

    // ATOMIC OPERATION: Check if seats are available AND reserve them in one operation
    // This prevents race conditions where two users book the same seat simultaneously
    console.log('Attempting atomic update - checking if these seats are available:', seatsToBook);
    console.log('Query will look for screening where bookedSeats does NOT include:', seatsToBook);
    const result = await screenings.findOneAndUpdate(
      {
        _id: new ObjectId(screeningId),
        // Ensure NONE of the seats to book are already in bookedSeats
        bookedSeats: { $nin: seatsToBook }
      },
      {
        $push: {
          bookedSeats: { $each: seatsToBook }
        }
      },
      { returnDocument: 'after' }
    );

    // If no document was updated, it means seats were already booked by someone else
    if (!result.value) {
      console.log('Update failed - checking why...');
      const currentScreening = await screenings.findOne({ _id: new ObjectId(screeningId) });
      console.log('Current bookedSeats in database:', currentScreening?.bookedSeats);
      console.log('Seats we tried to book:', seatsToBook);
      const conflictingSeats = seatsToBook.filter(seat => currentScreening?.bookedSeats?.includes(seat));
      console.log('Conflicting seats:', conflictingSeats);
      
      return res.status(409).json({ 
        success: false, 
        error: 'One or more seats are no longer available. Please select different seats.',
        statusCode: 409,
        conflictingSeats: conflictingSeats
      });
    }

    console.log('Seats reserved, creating booking record...');
    // Seats are now locked! Create the booking record
    const booking = {
      screeningId: new ObjectId(screeningId),
      seats: seatsToBook,
      movieTitle,
      hallName,
      moviePrice: parseFloat(moviePrice),
      paymentMethod,
      totalAmount: seatsToBook.length * parseFloat(moviePrice) + 2.00,
      status: 'confirmed',
      createdAt: new Date(),
      userId: req.session?.user?._id || null // If user is logged in, associate booking
    };

    const bookingResult = await bookings.insertOne(booking);

    console.log('✅ Booking created with ID:', bookingResult.insertedId);
    return res.status(201).json({ 
      success: true, 
      message: 'Booking confirmed!',
      bookingId: bookingResult.insertedId,
      booking
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error while processing booking: ' + error.message 
    });
  }
};

module.exports = { 
  getBookingsByScreeningJSON,
  createBookingJSON
};
