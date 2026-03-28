const express = require('express');
const router = express.Router();
const { 
  getAllMoviesJSON, 
  getMovieByIdJSON 
} = require('../handlers/apiMovieHandlers');

// GET /api/movies - Get all movies
router.get('/', getAllMoviesJSON);

// GET /api/movies/:id - Get single movie by ID
router.get('/:id', getMovieByIdJSON);

module.exports = router;
