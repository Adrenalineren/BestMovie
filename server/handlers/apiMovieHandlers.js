const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

// GET /api/movies - Get all movies
const getAllMoviesJSON = async (req, res) => {
  try {
    const movies = getCollection('movies');
    const allMovies = await movies.find().toArray();
    res.status(200).json(allMovies);
  } catch (err) {
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
    
    res.status(200).json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  getAllMoviesJSON, 
  getMovieByIdJSON 
};
