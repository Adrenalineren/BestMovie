const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

const postCreateBooking = async (req, res) => {
  try {
    const { screeningId, seatsToBook, paymentMethod, movieTitle, hallName, moviePrice } = req.body;
    
    // Validate input
    if (!screeningId || !seatsToBook || !Array.isArray(seatsToBook) || seatsToBook.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid booking data' 
      });
    }

    const screenings = getCollection('screenings');
    const bookings = getCollection('bookings');

    // ATOMIC OPERATION: Check if seats are available AND book them in one operation
    // This prevents race conditions where two users book the same seat simultaneously
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

    // If no document was updated, it means seats were already booked
    if (!result.value) {
      return res.status(409).json({ 
        success: false, 
        error: 'One or more seats are no longer available. Please select different seats.',
        statusCode: 409
      });
    }

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
      error: 'Server error while processing booking: ' + error.message 
    });
  }
};

const getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const bookings = getCollection('bookings');
    const screenings = getCollection('screenings');

    const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Get screening details to show date/time
    const screening = await screenings.findOne({ _id: booking.screeningId });

    return res.json({ 
      success: true, 
      booking: {
        ...booking,
        screeningTime: screening?.time,
        screeningDate: screening?.date
      }
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
};

module.exports = { postCreateBooking, getBookingDetails };
