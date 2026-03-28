const express = require('express');
const router = express.Router();
const { 
  getAllScreeningsJSON, 
  getScreeningsByMovieJSON, 
  getScreeningByIdJSON 
} = require('../handlers/apiScreeningHandlers');

// GET /api/screenings - Get all screenings
router.get('/', getAllScreeningsJSON);

// GET /api/screenings/movie/:movieId - Get screenings for a specific movie
router.get('/movie/:movieId', getScreeningsByMovieJSON);

// GET /api/screenings/:id - Get single screening by ID
router.get('/:id', getScreeningByIdJSON);

module.exports = router;
