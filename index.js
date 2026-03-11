const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const {connectToDatabase} = require('./lib/database');
const requireLogin = require('./middleware/auth');

// Import route modules
const authRoutes = require('./routes/auth');
const hallRoutes = require('./routes/halls');
const movieRoutes = require('./routes/movies');
const screeningRoutes = require('./routes/screenings');

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

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

// Store upload middleware in app for use in routes
app.set('upload', upload);

// Routes
app.get('/', (req, res) => res.redirect('/login'));

// Auth routes (includes login, logout, dashboard)
app.use('/', authRoutes);

// Admin routes (protected by requireLogin middleware)
app.use('/', requireLogin, hallRoutes);
app.use('/', requireLogin, movieRoutes);
app.use('/', requireLogin, screeningRoutes);

// Start server after connecting to database
connectToDatabase()
  .then(() => {
    console.log('Connected to database');
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  })
  .catch(err => {
    console.error('Failed to connect to database', err);
    process.exit(1);
  });