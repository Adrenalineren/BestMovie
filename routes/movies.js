const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');
const requireLogin = require('../middleware/auth');

const router = express.Router();

router.get('/admin/movie-management', requireLogin, async (req, res) => {
  const movies = getCollection('movies');
  const allMovies = await movies.find().toArray();
  res.render('movie-management', { user: req.session.user, movies: allMovies, error: undefined });
});

router.get('/admin/movie-management/create', requireLogin, (req, res) => {
  res.render('movie-create', { user: req.session.user, movie: null });
});

router.post('/admin/movie-management/create', requireLogin, async (req, res) => {
  const upload = req.app.get('upload');
  
  // Use uploadmiddleware if file is being uploaded
  upload.single('poster')(req, res, async (err) => {
    if (err) return res.status(400).send('Error uploading file: ' + err.message);
    
    const { title, poster, ageRating, rating, summary, price, duration, genre, releaseDate, leavingCinema } = req.body;
    const movies = getCollection('movies');
    
    // Use uploaded file path or provided URL or default
    let posterUrl = 'https://via.placeholder.com/200x300?text=No+Image';
    if (req.file) {
      posterUrl = '/uploads/posters/' + req.file.filename;
    } else if (poster) {
      posterUrl = poster;
    }
    
    // Convert genre to array if it's a string
    const genreArray = Array.isArray(genre) ? genre : (genre ? [genre] : []);
    
    await movies.insertOne({ 
      title, 
      poster: posterUrl, 
      ageRating: ageRating || '',
      rating: parseFloat(rating) || 0,
      summary,
      price: parseFloat(price) || 0,
      duration: parseInt(duration) || 0,
      genre: genreArray,
      releaseDate,
      leavingCinema
    });
    res.redirect('/admin/movie-management');
  });
});

router.post('/admin/movie-management/:id/delete', requireLogin, async (req, res) => {
  const movieId = req.params.id;
  const movies = getCollection('movies');
  const screenings = getCollection('screenings');
  
  try {
    // Check if movie has future screenings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Check for future screenings (date >= today)
    const futureScreeningsCount = await screenings.countDocuments({
      movieId: new ObjectId(movieId),
      date: { $gte: todayStr }
    });
    
    if (futureScreeningsCount > 0) {
      // Movie has future screenings - cannot delete
      const allMovies = await movies.find().toArray();
      return res.render('movie-management', { 
        user: req.session.user, 
        movies: allMovies,
        error: `Cannot delete movie. ${futureScreeningsCount} future screening(s) scheduled. Cancel all screenings first.`
      });
    }
    
    // No future screenings - delete all screenings (past) and the movie
    await screenings.deleteMany({ movieId: new ObjectId(movieId) });
    await movies.deleteOne({ _id: new ObjectId(movieId) });
    res.redirect('/admin/movie-management');
  } catch (err) {
    console.error('Error deleting movie:', err);
    const allMovies = await movies.find().toArray();
    res.render('movie-management', { 
      user: req.session.user, 
      movies: allMovies,
      error: 'Error deleting movie: ' + err.message
    });
  }
});

router.get('/admin/movie-management/:id/edit', requireLogin, async (req, res) => {
  const movieId = req.params.id;
  const movies = getCollection('movies');
  const movie = await movies.findOne({ _id: new ObjectId(movieId) });
  if (!movie) return res.status(404).send('Movie not found');
  res.render('movie-create', { user: req.session.user, movie });
});

router.post('/admin/movie-management/:id/edit', requireLogin, async (req, res) => {
  const upload = req.app.get('upload');
  
  upload.single('poster')(req, res, async (err) => {
    if (err) return res.status(400).send('Error uploading file: ' + err.message);
    
    const movieId = req.params.id;
    const { title, poster, ageRating, rating, summary, price, duration, genre, releaseDate, leavingCinema } = req.body;
    const movies = getCollection('movies');
    
    // Get existing movie to preserve poster if not uploading new one
    const existingMovie = await movies.findOne({ _id: new ObjectId(movieId) });
    
    let posterUrl = existingMovie.poster;
    if (req.file) {
      posterUrl = '/uploads/posters/' + req.file.filename;
    } else if (poster && poster !== existingMovie.poster) {
      posterUrl = poster;
    }
    
    // convert genre to array if it's a string
    const genreArray = Array.isArray(genre) ? genre : (genre ? [genre] : []);
    
    await movies.updateOne(
      { _id: new ObjectId(movieId) },
      { $set: { 
        title, 
        poster: posterUrl,
        ageRating: ageRating || '',
        rating: parseFloat(rating) || 0,
        summary,
        price: parseFloat(price) || 0,
        duration: parseInt(duration) || 0,
        genre: genreArray,
        releaseDate,
        leavingCinema: leavingCinema || null
      } }
    );
    res.redirect('/admin/movie-management');
  });
});

router.get('/admin/movie-management/:id/view', requireLogin, async (req, res) => {
  const movieId = req.params.id;
  const movies = getCollection('movies');
  const movie = await movies.findOne({ _id: new ObjectId(movieId) });
  if (!movie) return res.status(404).send('Movie not found');
  res.render('movie-view', { user: req.session.user, movie });
});

module.exports = router;
