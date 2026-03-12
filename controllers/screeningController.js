const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

const getScreeningManagement = async (req, res) => {
  const screenings = getCollection('screenings');
  const movies = getCollection('movies');
  const halls = getCollection('halls');
  const allScreenings = await screenings.find().sort({ date: 1, screeningTime: 1 }).toArray();

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
};

const getScreeningCreate = async (req, res) => {
  const movies = getCollection('movies');
  const halls = getCollection('halls');

  const allMovies = await movies.find().toArray();
  const activeHalls = await halls.find({ status: 'active' }).toArray();

  res.render('screening-create', { user: req.session.user, screening: null, movies: allMovies, halls: activeHalls });
};

const postScreeningCreate = async (req, res) => {
  const { movieId, hallId, date, screeningTime } = req.body;

  try {
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

    const screeningDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (screeningDate < today) {
      return res.status(400).type('text/plain').send('Cannot schedule screenings in the past.');
    }

    const existingScreenings = await screenings.find({
      hallId: new ObjectId(hallId),
      date
    }).toArray();

    for (const existing of existingScreenings) {
      const existingStart = timeToMinutes(existing.screeningTime);
      const existingEnd = timeToMinutes(existing.endTime);
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(409).type('text/plain').send(
          `Scheduling conflict! Hall is already booked from ${existing.screeningTime} to ${existing.endTime} on ${date}.`
        );
      }
    }

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
};

const getScreeningEdit = async (req, res) => {
  const screenings = getCollection('screenings');
  const movies = getCollection('movies');
  const halls = getCollection('halls');

  const screening = await screenings.findOne({ _id: new ObjectId(req.params.id) });
  if (!screening) return res.status(404).send('Screening not found');

  const allMovies = await movies.find().toArray();
  const activeHalls = await halls.find({ status: 'active' }).toArray();

  res.render('screening-create', {
    user: req.session.user,
    screening,
    movies: allMovies,
    halls: activeHalls
  });
};

const postScreeningEdit = async (req, res) => {
  const screeningId = req.params.id;
  const { movieId, hallId, date, screeningTime, status } = req.body;

  try {
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

    const conflictingScreenings = await screenings.find({
      hallId: new ObjectId(hallId),
      date,
      _id: { $ne: new ObjectId(screeningId) }
    }).toArray();

    for (const existing of conflictingScreenings) {
      const existingStart = timeToMinutes(existing.screeningTime);
      const existingEnd = timeToMinutes(existing.endTime);

      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(409).type('text/plain').send(
          `Scheduling conflict! Hall is already booked from ${existing.screeningTime} to ${existing.endTime} on ${date}.`
        );
      }
    }

    await screenings.updateOne(
      { _id: new ObjectId(screeningId) },
      {
        $set: {
          movieId: new ObjectId(movieId),
          hallId: new ObjectId(hallId),
          date,
          screeningTime,
          endTime,
          status: status || 'Available'
        }
      }
    );
    res.json({ success: true, message: 'Screening updated successfully' });
  } catch (err) {
    console.error('Error updating screening:', err);
    res.status(500).type('text/plain').send('Error: ' + err.message);
  }
};

const postScreeningDelete = async (req, res) => {
  const screenings = getCollection('screenings');
  await screenings.deleteOne({ _id: new ObjectId(req.params.id) });
  res.redirect('/admin/screening-management');
};

module.exports = { getScreeningManagement, getScreeningCreate, postScreeningCreate, getScreeningEdit, postScreeningEdit, postScreeningDelete };
