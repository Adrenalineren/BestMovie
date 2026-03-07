const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const { ObjectId } = require('mongodb');
const {connectToDatabase, disconnect, getCollection} = require('./lib/database');
const requireLogin = require('./middleware/auth');
const app = express();
const port = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/posters');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'poster-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use('/admin', requireLogin);

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin/dashboard');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const staff = getCollection('staff');
    const user = await staff.findOne({ username });

    if (!user) return res.render('login', { error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Incorrect password' });

    req.session.user = { username: user.username };
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.render('login', { error: 'Login error: ' + err.message });
  }
});

app.get('/admin/dashboard', requireLogin, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session error:', err);
    res.redirect('/login');
  });
});

app.get('/admin/hall-management', requireLogin, async (req, res) => {
  const halls = getCollection('halls');
  const allHalls = await halls.find().toArray();
  res.render('hall-management', { user: req.session.user, halls: allHalls });
});

app.get('/admin/hall-management/create', requireLogin, (req, res) => {
  res.render('hall-create', { user: req.session.user, hall: null });
});
// specifics of creating hall
app.post('/admin/hall-management/create', requireLogin, async (req, res) => {
  const { name, type, rows, columns, seat, wheelchair } = req.body;
  const halls = getCollection('halls');
  await halls.insertOne({ 
    name, 
    type, 
    rows: parseInt(rows), 
    columns: parseInt(columns), 
    seat: seat ? JSON.parse(seat) : [], 
    wheelchair: parseInt(wheelchair) || 0,
    status: 'active' });
  res.redirect('/admin/hall-management');
});

//maintenance status 
app.post('/admin/hall-management/:id/status', requireLogin, async (req, res) => {
  const halls = getCollection('halls');
  const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
  const newStatus = hall.status === 'active' ? 'maintenance' : 'active';
  await halls.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: newStatus } });
  res.redirect('/admin/hall-management');
});

//delete hall
app.post('/admin/hall-management/:id/delete', requireLogin, async (req, res) => {
  const halls = getCollection('halls');
  await halls.deleteOne({ _id: new ObjectId(req.params.id) });
  res.redirect('/admin/hall-management');
});

app.get('/admin/hall-management/:id/edit', requireLogin, async (req, res) => {
  const hallId = req.params.id;
  const halls = getCollection('halls');
  const hall = await halls.findOne({ _id: new ObjectId(hallId) });
  if (!hall) return res.status(404).send('Hall not found');
  res.render('hall-create', { user: req.session.user, hall });
});

app.post('/admin/hall-management/:id/edit', requireLogin, async (req, res) => {
  const hallId = req.params.id;
  const { name, type, rows, columns, seat, wheelchair } = req.body;
  const halls = getCollection('halls');
  await halls.updateOne(
    { _id: new ObjectId(hallId) },
    { $set: { name, type, rows: parseInt(rows), columns: parseInt(columns), seat: seat ? JSON.parse(seat) : [], wheelchair: parseInt(wheelchair) || 0 } }
  );
  res.redirect('/admin/hall-management');
});

app.get('/admin/movie-management', requireLogin, async (req, res) => {
  const movies = getCollection('movies');
  const allMovies = await movies.find().toArray();
  res.render('movie-management', { user: req.session.user, movies: allMovies });
});

app.get('/admin/movie-management/create', requireLogin, (req, res) => {
  res.render('movie-create', { user: req.session.user, movie: null });
});

//create movie
app.post('/admin/movie-management/create', requireLogin, upload.single('poster'), async (req, res) => {
  const { title, poster, ageRating, rating, summary, price, duration, genre, releaseDate} = req.body;
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
    releaseDate
  });
  res.redirect('/admin/movie-management');
});

//delete movie
app.post('/admin/movie-management/:id/delete', requireLogin, async (req, res) => {
  const movies = getCollection('movies');
  await movies.deleteOne({ _id: new ObjectId(req.params.id) });
  res.redirect('/admin/movie-management');
});

app.get('/admin/movie-management/:id/edit', requireLogin, async (req, res) => {
  const movieId = req.params.id;
  const movies = getCollection('movies');
  const movie = await movies.findOne({ _id: new ObjectId(movieId) });
  if (!movie) return res.status(404).send('Movie not found');
  res.render('movie-create', { user: req.session.user, movie });
});

//edit movie
app.post('/admin/movie-management/:id/edit', requireLogin, upload.single('poster'), async (req, res) => {
  const movieId = req.params.id;
  const { title, poster, ageRating, rating, summary, price, duration, genre, releaseDate } = req.body;
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
      releaseDate
    } }
  );
  res.redirect('/admin/movie-management');
});


app.get('/admin/screening-management', requireLogin, async (req, res) => {
  const screenings = getCollection('screenings');
  const movies = getCollection('movies');
  const halls = getCollection('halls');
  const allScreenings = await screenings.find().toArray();
  // get movie titles and hall names
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
});

app.get('/admin/screening-management/create', requireLogin, async (req, res) => {
  const movies = getCollection('movies');
  const halls = getCollection('halls');
  
  const allMovies = await movies.find().toArray();
  const activeHalls = await halls.find({ status: 'active' }).toArray();
  
  res.render('screening-create', { user: req.session.user, screening: null, movies: allMovies, halls: activeHalls });
});

// function to convert time stringto minutes since midnight
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// function to convert minutes since midnight to time string
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

app.post('/admin/screening-management/create', requireLogin, async (req, res) => {
  const { movieId, hallId, date, screeningTime } = req.body;
  
  try {
    console.log('Creating screening:', { movieId, hallId, date, screeningTime });

    // Validate inputs
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

    // Check for date in past
    const screeningDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (screeningDate < today) {
      return res.status(400).type('text/plain').send('Cannot schedule screenings in the past.');
    }

    const existingScreenings = await screenings.find({
      hallId: new ObjectId(hallId),
      date: date
    }).toArray();

    // Check for overlap
    for (const existing of existingScreenings) {
      const existingStart = timeToMinutes(existing.screeningTime);
      const existingEnd = timeToMinutes(existing.endTime);
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(409).type('text/plain').send(
          `Scheduling conflict! Hall is already booked from ${existing.screeningTime} to ${existing.endTime} on ${date}.`
        );
      }
    }
    
    // No overlap - insert the screening
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
});

app.get('/admin/screening-management/:id/edit', requireLogin, async (req, res) => {
  const screeningId = req.params.id;
  const screenings = getCollection('screenings');
  const movies = getCollection('movies');
  const halls = getCollection('halls');
  
  const screening = await screenings.findOne({ _id: new ObjectId(screeningId) });
  if (!screening) return res.status(404).send('Screening not found');
  
  const allMovies = await movies.find().toArray();
  const activeHalls = await halls.find({ status: 'active' }).toArray();
  
  res.render('screening-create', { 
    user: req.session.user, 
    screening, 
    movies: allMovies, 
    halls: activeHalls 
  });
});

app.post('/admin/screening-management/:id/edit', requireLogin, async (req, res) => {
  const screeningId = req.params.id;
  const { movieId, hallId, date, screeningTime, status } = req.body;
  
  try {
    console.log('Updating screening:', { screeningId, movieId, hallId, date, screeningTime, status });

    // Validate inputs
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
    
    // Check for overlaps (excluding the current screening)
    const conflictingScreenings = await screenings.find({
      hallId: new ObjectId(hallId),
      date: date,
      _id: { $ne: new ObjectId(screeningId) }
    }).toArray();
    
    // Check for overlap
    for (const existing of conflictingScreenings) {
      const existingStart = timeToMinutes(existing.screeningTime);
      const existingEnd = timeToMinutes(existing.endTime);
      
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(409).type('text/plain').send(
          `Scheduling conflict! Hall is already booked from ${existing.screeningTime} to ${existing.endTime} on ${date}.`
        );
      }
    }

    // Update the screening
    await screenings.updateOne(
      { _id: new ObjectId(screeningId) },
      { $set: {
        movieId: new ObjectId(movieId),
        hallId: new ObjectId(hallId),
        date,
        screeningTime,
        endTime,
        status: status || 'Available'
      } }
    );
    res.json({ success: true, message: 'Screening updated successfully' });
  } catch (err) {
    console.error('Error updating screening:', err);
    res.status(500).type('text/plain').send('Error: ' + err.message);
  }
});

app.post('/admin/screening-management/:id/delete', requireLogin, async (req, res) => {
  const screenings = getCollection('screenings');
  await screenings.deleteOne({ _id: new ObjectId(req.params.id) });
  res.redirect('/admin/screening-management');
});

// only start server after connecting to database
connectToDatabase()
  .then(() => {
    console.log('Connected to database');
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  })
  .catch(err => {
    console.error('Failed to connect to database', err);
    process.exit(1);
  });