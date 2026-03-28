const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

const getMovieManagement = async (req, res) => {
  const movies = getCollection('movies');
  const allMovies = await movies.find().toArray();
  const successMessage = req.session.successMessage;
  delete req.session.successMessage; // Clear the message after displaying
  res.render('movie/movie-management', { user: req.session.user, movies: allMovies, error: undefined, success: successMessage });
};

const getMovieCreate = (req, res) => {
  res.render('movie/movie-create', { user: req.session.user, movie: null, error: undefined });
};

const postMovieCreate = (req, res) => {
  const upload = req.app.get('upload');

  upload.single('poster')(req, res, async (err) => {
    if (err) return res.status(400).send('Error uploading file: ' + err.message);

    const { title, poster, ageRating, rating, summary, price, duration, genre, releaseDate, leavingCinema } = req.body;
    const movies = getCollection('movies');

    let posterUrl = 'https://via.placeholder.com/200x300?text=No+Image';
    if (req.file) {
      posterUrl = '/uploads/posters/' + req.file.filename;
    } else if (poster) {
      posterUrl = poster;
    }

    const genreArray = Array.isArray(genre) ? genre : (genre ? [genre] : []);

    // All fields are required 
    if (!title || !summary || !releaseDate || !posterUrl || !price || !duration || genreArray.length === 0 || !ageRating || !rating) {
      const allMovies = await movies.find().toArray();
      return res.render('movie/movie-management', {
        user: req.session.user,
        movies: allMovies,
        error: 'All fields are required. Please fill in all fields and try again.',
        success: undefined
      });
    }
    // ensure movie title is unique 
    const existingMovie = await movies.findOne({ title });
    if (existingMovie) {
      const allMovies = await movies.find().toArray();
      return res.render('movie/movie-management', {
        user: req.session.user,
        movies: allMovies,
        error: 'A movie with this title already exists. Please choose a different title.',
        success: undefined
      });
    }
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
    req.session.successMessage = 'Movie created successfully!';
    res.redirect('/admin/movie/movie-management');
  });
};

const postMovieDelete = async (req, res) => {
  const movieId = req.params.id;
  const movies = getCollection('movies');
  const screenings = getCollection('screenings');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const futureScreeningsCount = await screenings.countDocuments({
      movieId: new ObjectId(movieId),
      date: { $gte: todayStr }
    });

    if (futureScreeningsCount > 0) {
      const allMovies = await movies.find().toArray();
      return res.render('movie/movie-management', {
        user: req.session.user,
        movies: allMovies,
        error: `Cannot delete movie. ${futureScreeningsCount} future screening(s) scheduled. Cancel all screenings first.`,
        success: undefined
      });
    }

    await screenings.deleteMany({ movieId: new ObjectId(movieId) });
    await movies.deleteOne({ _id: new ObjectId(movieId) });
    res.redirect('/admin/movie/movie-management');
  } catch (err) {
    console.error('Error deleting movie:', err);
    const allMovies = await movies.find().toArray();
    res.render('movie/movie-management', {
      user: req.session.user,
      movies: allMovies,
      error: 'Error deleting movie: ' + err.message,
      success: undefined
    });
  }
};

const getMovieEdit = async (req, res) => {
  const movies = getCollection('movies');
  const movie = await movies.findOne({ _id: new ObjectId(req.params.id) });
  if (!movie) return res.status(404).send('Movie not found');
  res.render('movie/movie-create', { user: req.session.user, movie });
};

const postMovieEdit = (req, res) => {
  const upload = req.app.get('upload');

  upload.single('poster')(req, res, async (err) => {
    if (err) return res.status(400).send('Error uploading file: ' + err.message);

    const movieId = req.params.id;
    const { title, poster, ageRating, rating, summary, price, duration, genre, releaseDate, leavingCinema } = req.body;
    const movies = getCollection('movies');

    const existingMovie = await movies.findOne({ _id: new ObjectId(movieId) });

    let posterUrl = existingMovie.poster;
    if (req.file) {
      posterUrl = '/uploads/posters/' + req.file.filename;
    } else if (poster && poster !== existingMovie.poster) {
      posterUrl = poster;
    }

    const genreArray = Array.isArray(genre) ? genre : (genre ? [genre] : []);

    await movies.updateOne(
      { _id: new ObjectId(movieId) },
      {
        $set: {
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
        }
      }
    );
    res.redirect('/admin/movie/movie-management');
  });
};

const getMovieView = async (req, res) => {
  const movies = getCollection('movies');
  const movie = await movies.findOne({ _id: new ObjectId(req.params.id) });
  if (!movie) return res.status(404).send('Movie not found');
  res.render('movie/movie-view', { user: req.session.user, movie });
};

module.exports = { getMovieManagement, getMovieCreate, postMovieCreate, postMovieDelete, getMovieEdit, postMovieEdit, getMovieView };
