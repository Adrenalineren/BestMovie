const express = require('express');
const router = express.Router();
const { 
  getAllHallsJSON, 
  getHallByIdJSON 
} = require('../handlers/apiHallHandlers');

// GET /api/halls - Get all halls
router.get('/', getAllHallsJSON);

// GET /api/halls/:id - Get single hall by ID
router.get('/:id', getHallByIdJSON);

module.exports = router;
