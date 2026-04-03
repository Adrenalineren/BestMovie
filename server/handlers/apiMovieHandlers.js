const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

// GET /api/movies - Get movies currently in cinemas
const getAllMoviesJSON = async (req, res) => {
  try {
    const movies = getCollection('movies');
    
    // Get current date in YYYY-MM-DD format to compare with string dates
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // "2026-03-31"
    
    // Get movies where leavingCinema (string) >= today
    const moviesInCinema = await movies.find({
      leavingCinema: { $gte: dateString }
    }).toArray();
    const moviesWithUrls = moviesInCinema.map(movie => ({
      ...movie,
      poster: movie.poster ? (
        movie.poster.startsWith('http') ? 
          movie.poster : 
          `http://localhost:3000${movie.poster}`
      ) : null
    }));
    
    res.status(200).json(moviesWithUrls);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/movies/:id - Get single movie
const getMovieByIdJSON = async (req, res) => {
  try {
    const movies = getCollection('movies');
    const movie = await movies.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    const movieWithUrl = {
      ...movie,
      poster: movie.poster ? (
        movie.poster.startsWith('http') ? 
          movie.poster : 
          `http://localhost:3000${movie.poster}`
      ) : null
    };
    
    res.status(200).json(movieWithUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  getAllMoviesJSON, 
  getMovieByIdJSON
};
