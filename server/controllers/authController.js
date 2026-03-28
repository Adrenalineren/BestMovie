const bcrypt = require('bcrypt');
const { getCollection } = require('../lib/database');

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

const getLogin = (req, res) => {
  if (req.session.user) return res.redirect('/admin/dashboard');
  res.render('login', { error: null });
};

const postLogin = async (req, res) => {
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
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session error:', err);
    res.redirect('/login');
  });
};

const getDashboard = async (req, res) => {
  try {
    const movies = getCollection('movies');
    const screenings = getCollection('screenings');
    const halls = getCollection('halls');

    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    const currentTime = today.getHours() * 60 + today.getMinutes();

    const todayScreenings = await screenings.find({
      date: todayDateStr
    }).sort({ screeningTime: 1 }).toArray();

    const playingScreenings = todayScreenings.filter(screening => {
      const screeningStart = timeToMinutes(screening.screeningTime);
      const screeningEnd = timeToMinutes(screening.endTime);
      return currentTime >= screeningStart && currentTime <= screeningEnd;
    });

    const upcomingDates = [];
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      upcomingDates.push(date.toISOString().split('T')[0]);
    }

    const nextFiveDaysScreenings = await screenings.find({
      date: { $in: upcomingDates }
    }).sort({ date: 1, screeningTime: 1 }).toArray();

    const playingMovies = await Promise.all(
      playingScreenings.map(async (screening) => {
        const movie = await movies.findOne({ _id: screening.movieId });
        const hall = await halls.findOne({ _id: screening.hallId });
        return {
          ...screening, // include all details from screening
          movieTitle: movie?.title || 'Unknown Movie', // ? returns undefined safely if movie not found
          poster: movie?.poster || 'https://via.placeholder.com/200x300?text=No+Image',
          hallName: hall?.name || 'Unknown Hall'
        };
      })
    );

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

    const upcomingTodayScreenings = populatedTodayScreenings.filter(screening => {
      const screeningStart = timeToMinutes(screening.screeningTime);
      return currentTime < screeningStart;
    });

    const combinedUpcomingScreenings = [...upcomingTodayScreenings, ...populatedNextFiveDaysScreenings];

    const availableHalls = await halls.find({ status: 'active' }).toArray();

    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split('T')[0];
    const leavingSoonMovies = await movies.find({
      leavingCinema: { $gte: todayDateStr, $lte: in7DaysStr } // find movies greater than equal to today and less than or equal to 7 days from now
    }).sort({ leavingCinema: 1 }).toArray();

    res.render('dashboard', {
      user: req.session.user,
      playingMovies,
      playingMoviesCount: playingMovies.length,
      upcomingTodayScreenings,
      upcomingTodayScreeningsCount: upcomingTodayScreenings.length,
      todayScreenings: populatedTodayScreenings,
      todayScreeningsCount: populatedTodayScreenings.length,
      upcomingScreenings: combinedUpcomingScreenings,
      upcomingScreeningsCount: combinedUpcomingScreenings.length,
      availableHalls,
      availableHallsCount: availableHalls.length,
      leavingSoonMovies,
      leavingSoonMoviesCount: leavingSoonMovies.length
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
      leavingSoonMovies: [],
      leavingSoonMoviesCount: 0,
      error: err.message
    });
  }
};

module.exports = { getLogin, postLogin, logout, getDashboard };
