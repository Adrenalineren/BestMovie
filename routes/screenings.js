const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');
const requireLogin = require('../middleware/auth');

const router = express.Router();

// Helper function to convert time string to minutes since midnight
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to convert minutes since midnight to time string
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

router.get('/admin/screening-management', requireLogin, async (req, res) => {
  const screenings = getCollection('screenings');
  const movies = getCollection('movies');
  const halls = getCollection('halls');
  const allScreenings = await screenings.find().sort({ date: 1, screeningTime: 1 }).toArray();
  // get movie titles and hall names
  const populatedScreenings = await Promise.all(
    allScreenings.map(async (screening) => {
      const movie = await movies.findOne({ _id: new ObjectId(screening.movieId) });
      const hall = await halls.findOne({ _id: new ObjectId(screening.hallId) });
      return {
        ...screening,
        movieTitle: movie ? movie.title : 'Unknown Movie',
        hallName: hall ? hall.name : 'Unknown Hall'
      };
    })
  );
  
  res.render('screening-management', { user: req.session.user, screenings: populatedScreenings });
});

router.get('/admin/screening-management/create', requireLogin, async (req, res) => {
  const movies = getCollection('movies');
  const halls = getCollection('halls');
  
  const allMovies = await movies.find().toArray();
  const activeHalls = await halls.find({ status: 'active' }).toArray();
  
  res.render('screening-create', { user: req.session.user, screening: null, movies: allMovies, halls: activeHalls });
});

router.post('/admin/screening-management/create', requireLogin, async (req, res) => {
  const { movieId, hallId, date, screeningTime } = req.body;
  
  try {
    console.log('Creating screening:', { movieId, hallId, date, screeningTime });

    // Validate inputs
    if (!movieId || !hallId || !date || !screeningTime) {
      return res.status(400).type('text/plain').send('Please fill in all required fields.');
    }

    const screenings = getCollection('screenings');
    const movies = getCollection('movies');

    const movie = await movies.findOne({ _id: new ObjectId(movieId) });
    if (!movie) {
      return res.status(404).type('text/plain').send('Movie not found');
    }

    const startMinutes = timeToMinutes(screeningTime);
    const endMinutes = startMinutes + movie.duration + 30;
    const endTime = minutesToTime(endMinutes);

    // check for date in past
    const screeningDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (screeningDate < today) {
      return res.status(400).type('text/plain').send('Cannot schedule screenings in the past.');
    }

    const existingScreenings = await screenings.find({
      hallId: new ObjectId(hallId),
      date: date
    }).toArray();

    // Check for overlap
    for (const existing of existingScreenings) {
      const existingStart = timeToMinutes(existing.screeningTime);
      const existingEnd = timeToMinutes(existing.endTime);
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(409).type('text/plain').send(
          `Scheduling conflict! Hall is already booked from ${existing.screeningTime} to ${existing.endTime} on ${date}.`
        );
      }
    }
    
    // No overlap - insert the screening
    await screenings.insertOne({
      movieId: new ObjectId(movieId),
      hallId: new ObjectId(hallId),
      date,
      screeningTime,
      endTime,
      status: 'Available'
    });
    
    res.json({ success: true, message: 'Screening created successfully' });
  } catch (err) {
    console.error('Error creating screening:', err);
    res.status(500).type('text/plain').send('Error: ' + err.message);
  }
});

router.get('/admin/screening-management/:id/edit', requireLogin, async (req, res) => {
  const screeningId = req.params.id;
  const screenings = getCollection('screenings');
  const movies = getCollection('movies');
  const halls = getCollection('halls');
  
  const screening = await screenings.findOne({ _id: new ObjectId(screeningId) });
  if (!screening) return res.status(404).send('Screening not found');
  
  const allMovies = await movies.find().toArray();
  const activeHalls = await halls.find({ status: 'active' }).toArray();
  
  res.render('screening-create', { 
    user: req.session.user, 
    screening, 
    movies: allMovies, 
    halls: activeHalls 
  });
});

router.post('/admin/screening-management/:id/edit', requireLogin, async (req, res) => {
  const screeningId = req.params.id;
  const { movieId, hallId, date, screeningTime, status } = req.body;
  
  try {
    console.log('Updating screening:', { screeningId, movieId, hallId, date, screeningTime, status });

    // Validate inputs
    if (!movieId || !hallId || !date || !screeningTime) {
      return res.status(400).type('text/plain').send('Please fill in all required fields.');
    }

    const screenings = getCollection('screenings');
    const movies = getCollection('movies');

    const movie = await movies.findOne({ _id: new ObjectId(movieId) });
    if (!movie) {
      return res.status(404).type('text/plain').send('Movie not found');
    }

    const startMinutes = timeToMinutes(screeningTime);
    const endMinutes = startMinutes + movie.duration + 30;
    const endTime = minutesToTime(endMinutes);
    
    // Check for overlaps (excluding the current screening)
    const conflictingScreenings = await screenings.find({
      hallId: new ObjectId(hallId),
      date: date,
      _id: { $ne: new ObjectId(screeningId) }
    }).toArray();
    
    // Check for overlap
    for (const existing of conflictingScreenings) {
      const existingStart = timeToMinutes(existing.screeningTime);
      const existingEnd = timeToMinutes(existing.endTime);
      
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(409).type('text/plain').send(
          `Scheduling conflict! Hall is already booked from ${existing.screeningTime} to ${existing.endTime} on ${date}.`
        );
      }
    }

    // Update the screening
    await screenings.updateOne(
      { _id: new ObjectId(screeningId) },
      { $set: {
        movieId: new ObjectId(movieId),
        hallId: new ObjectId(hallId),
        date,
        screeningTime,
        endTime,
        status: status || 'Available'
      } }
    );
    res.json({ success: true, message: 'Screening updated successfully' });
  } catch (err) {
    console.error('Error updating screening:', err);
    res.status(500).type('text/plain').send('Error: ' + err.message);
  }
});

router.post('/admin/screening-management/:id/delete', requireLogin, async (req, res) => {
  const screenings = getCollection('screenings');
  await screenings.deleteOne({ _id: new ObjectId(req.params.id) });
  res.redirect('/admin/screening-management');
});

module.exports = router;
