const express = require('express');
const bcrypt = require('bcrypt');
const { getCollection } = require('../lib/database');
const requireLogin = require('../middleware/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin/dashboard');
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
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

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session error:', err);
    res.redirect('/login');
  });
});

router.get('/admin/dashboard', requireLogin, async (req, res) => {
  try {
    const movies = getCollection('movies');
    const screenings = getCollection('screenings');
    const halls = getCollection('halls');

    // Get today's date
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    const currentTime = today.getHours() * 60 + today.getMinutes(); // current time in minutes

    // Get all screenings for today
    const todayScreenings = await screenings.find({
      date: todayDateStr
    }).sort({ screeningTime: 1 }).toArray();

    // Find currently playing movies (screenings that are happening right now)
    const playingScreenings = todayScreenings.filter(screening => {
      const screeningStart = timeToMinutes(screening.screeningTime);
      const screeningEnd = timeToMinutes(screening.endTime);
      return currentTime >= screeningStart && currentTime <= screeningEnd;
    });

    // Get upcoming screenings for the next 5 days (starting from tomorrow)
    const upcomingDates = [];
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      upcomingDates.push(date.toISOString().split('T')[0]);
    }

    const nextFiveDaysScreenings = await screenings.find({
      date: { $in: upcomingDates }
    }).sort({ date: 1, screeningTime: 1 }).toArray();

    // populate movie and hall details for playing screenings
    const playingMovies = await Promise.all(
      playingScreenings.map(async (screening) => {
        const movie = await movies.findOne({ _id: screening.movieId });
        const hall = await halls.findOne({ _id: screening.hallId });
        return {
          ...screening,
          movieTitle: movie?.title || 'Unknown Movie',
          poster: movie?.poster || 'https://via.placeholder.com/200x300?text=No+Image',
          hallName: hall?.name || 'Unknown Hall'
        };
      })
    );

    // Populate movie and hall details for all today's screenings
    const populatedTodayScreenings = await Promise.all(
      todayScreenings.map(async (screening) => {
        const movie = await movies.findOne({ _id: screening.movieId });
        const hall = await halls.findOne({ _id: screening.hallId });
        return {
          ...screening,
          movieTitle: movie?.title || 'Unknown Movie',
          poster: movie?.poster || 'https://via.placeholder.com/200x300?text=No+Image',
          hallName: hall?.name || 'Unknown Hall'
        };
      })
    );

    // Populate movie and hall details for next 5 days screenings
    const populatedNextFiveDaysScreenings = await Promise.all(
      nextFiveDaysScreenings.map(async (screening) => {
        const movie = await movies.findOne({ _id: screening.movieId });
        const hall = await halls.findOne({ _id: screening.hallId });
        return {
          ...screening,
          movieTitle: movie?.title || 'Unknown Movie',
          poster: movie?.poster || 'https://via.placeholder.com/200x300?text=No+Image',
          hallName: hall?.name || 'Unknown Hall'
        };
      })
    );

    // Get upcoming screenings TODAY ONLY (today but not yet started)
    const upcomingTodayScreenings = populatedTodayScreenings.filter(screening => {
      const screeningStart = timeToMinutes(screening.screeningTime);
      return currentTime < screeningStart;
    });

    // Combine upcoming today screenings with next 5 days for the "Upcoming" panel
    const combinedUpcomingScreenings = [...upcomingTodayScreenings, ...populatedNextFiveDaysScreenings];

    // Get available halls (with status 'active')
    const availableHalls = await halls.find({ status: 'active' }).toArray();

    res.render('dashboard', { 
      user: req.session.user, 
      playingMovies: playingMovies,
      playingMoviesCount: playingMovies.length,
      upcomingTodayScreenings: upcomingTodayScreenings,
      upcomingTodayScreeningsCount: upcomingTodayScreenings.length,
      todayScreenings: populatedTodayScreenings,
      todayScreeningsCount: populatedTodayScreenings.length,
      upcomingScreenings: combinedUpcomingScreenings,
      upcomingScreeningsCount: combinedUpcomingScreenings.length,
      availableHalls: availableHalls,
      availableHallsCount: availableHalls.length
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('dashboard', { 
      user: req.session.user, 
      playingMovies: [],
      playingMoviesCount: 0,
      upcomingTodayScreenings: [],
      upcomingTodayScreeningsCount: 0,
      todayScreenings: [],
      todayScreeningsCount: 0,
      upcomingScreenings: [],
      upcomingScreeningsCount: 0,
      availableHalls: [],
      availableHallsCount: 0,
      error: err.message
    });
  }
});

// Helper function to convert time string to minutes since midnight
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = router;
