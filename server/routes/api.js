const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

// Get all movies
router.get('/movies', async (req, res) => {
  try {
    const movies = getCollection('movies');
    const allMovies = await movies.find().toArray();
    res.json(allMovies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all screenings
router.get('/screenings', async (req, res) => {
  try {
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
    res.json(populatedScreenings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get screenings for a specific movie
router.get('/screenings/movie/:movieId', async (req, res) => {
  try {
    const screenings = getCollection('screenings');
    const halls = getCollection('halls');

    const movieScreenings = await screenings
      .find({ movieId: new ObjectId(req.params.movieId) })
      .sort({ date: 1, screeningTime: 1 })
      .toArray();

    const populatedScreenings = await Promise.all(
      movieScreenings.map(async (screening) => {
        const hall = await halls.findOne({ _id: new ObjectId(screening.hallId) });
        return {
          ...screening,
          hallName: hall ? hall.name : 'Unknown Hall'
        };
      })
    );
    res.json(populatedScreenings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single movie by ID
router.get('/movies/:id', async (req, res) => {
  try {
    const movies = getCollection('movies');
    const movie = await movies.findOne({ _id: new ObjectId(req.params.id) });
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get hall details with available seats
router.get('/halls/:id', async (req, res) => {
  try {
    const halls = getCollection('halls');
    const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    res.json(hall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
