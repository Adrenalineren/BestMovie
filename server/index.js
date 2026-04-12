const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const { connectToDatabase, ensureDatabaseIndexes } = require('./lib/database');
const requireLogin = require('./middleware/auth');
const cors = require('cors');

// Import route modules
const authRoutes = require('./routes/auth');
const hallRoutes = require('./routes/halls');
const movieRoutes = require('./routes/movies');
const screeningRoutes = require('./routes/screenings');
const bookingRoutes = require('./routes/bookings');
const apiMoviesRoutes = require('./routes/apiMovies');
const apiHallsRoutes = require('./routes/apiHalls');
const apiScreeningsRoutes = require('./routes/apiScreenings');
const apiBookingsRoutes = require('./routes/apiBookings');
const apiAuthRoutes = require('./routes/apiAuth');
const apiAdminRoutes = require('./routes/apiAdmin');

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

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// CORS configuration to allow credentials from React dev server
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));


// View engine setup
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

// Store upload middleware in app for use in routes
app.set('upload', upload);

// Routes
app.get('/', (req, res) => res.redirect('/login'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes (public, no login required - for React client)
app.use('/api/movies', apiMoviesRoutes);
app.use('/api/halls', apiHallsRoutes);
app.use('/api/screenings', apiScreeningsRoutes);
app.use('/api/bookings', apiBookingsRoutes);
app.use('/api/auth', apiAuthRoutes);
app.use('/api/admin', apiAdminRoutes);

// Auth routes (includes login, logout, dashboard)
app.use('/', authRoutes);

// Admin routes (protected by requireLogin middleware)
app.use('/', requireLogin, hallRoutes);
app.use('/', requireLogin, movieRoutes);
app.use('/', requireLogin, screeningRoutes);
app.use('/admin/bookings', requireLogin, bookingRoutes);

// Start server after connecting to database
connectToDatabase()
  .then(async () => {
    await ensureDatabaseIndexes();
    console.log('Connected to database');
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  })
  .catch(err => {
    console.error('Failed to connect to database', err);
    process.exit(1);
  });