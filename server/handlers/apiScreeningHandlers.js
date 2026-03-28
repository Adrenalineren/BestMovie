const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

// GET /api/screenings - Get all screenings
const getAllScreeningsJSON = async (req, res) => {
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
    
    res.status(200).json(populatedScreenings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/screenings/movie/:movieId - Get screenings for a specific movie
const getScreeningsByMovieJSON = async (req, res) => {
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
    
    res.status(200).json(populatedScreenings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/screenings/:id - Get single screening by ID
const getScreeningByIdJSON = async (req, res) => {
  try {
    const screenings = getCollection('screenings');
    const movies = getCollection('movies');
    const halls = getCollection('halls');

    const screening = await screenings.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!screening) {
      return res.status(404).json({ error: 'Screening not found' });
    }

    const movie = await movies.findOne({ _id: new ObjectId(screening.movieId) });
    const hall = await halls.findOne({ _id: new ObjectId(screening.hallId) });

    const populatedScreening = {
      ...screening,
      movieTitle: movie ? movie.title : 'Unknown Movie',
      hallName: hall ? hall.name : 'Unknown Hall'
    };

    res.status(200).json(populatedScreening);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  getAllScreeningsJSON, 
  getScreeningsByMovieJSON, 
  getScreeningByIdJSON 
};
