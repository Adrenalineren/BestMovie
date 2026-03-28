const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

const getHallManagement = async (req, res) => {
  const halls = getCollection('halls');
  const allHalls = await halls.find().toArray();
  const successMessage = req.session.successMessage;
  delete req.session.successMessage; // Clear it after reading
  res.render('hall/hall-management', { user: req.session.user, halls: allHalls, success: successMessage });
};

const getHallCreate = (req, res) => {
  res.render('hall/hall-create', { user: req.session.user, hall: null, error: null, success: undefined });
};

const postHallCreate = async (req, res) => {
  const { name, type, rows, columns, seat, wheelchair } = req.body;
  const halls = getCollection('halls');

  const existingHall = await halls.findOne({ name });
  if (existingHall) {
    return res.render('hall/hall-create', { user: req.session.user, hall: null, error: 'A hall with this name already exists', success: undefined });
  }

  await halls.insertOne({
    name,
    type,
    rows: parseInt(rows),
    columns: parseInt(columns),
    seat: seat ? JSON.parse(seat) : [],
    wheelchair: parseInt(wheelchair) || 0,
    status: 'active'
  });
  req.session.successMessage = `Hall "${name}" created successfully!`;
  res.redirect('/admin/hall/hall-management');
};

const getHallScreeningsCheck = async (req, res) => {
  const hallId = req.params.id;
  const halls = getCollection('halls');
  const screenings = getCollection('screenings');
  const movies = getCollection('movies');

  try {
    const hall = await halls.findOne({ _id: new ObjectId(hallId) });
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    const today = new Date(); // get today's date in YYYY-MM-DDT(Time)
    const todayStr = today.toISOString().split('T')[0]; // take out the unit before 'T'

    // upcoming screenings in this hall (date >= today)
    const upcomingScreenings = await screenings.find({
      hallId: new ObjectId(hallId),
      date: { $gte: todayStr }
    }).sort({ date: 1, screeningTime: 1 }).toArray();

    if (upcomingScreenings.length === 0) {
      return res.json({ hasUpcoming: false });
    }

    // Populate movie details
    const populatedScreenings = await Promise.all(
      upcomingScreenings.map(async (screening) => {
        const movie = await movies.findOne({ _id: screening.movieId });
        return {
          ...screening,
          movieTitle: movie?.title || 'Unknown Movie'
        };
      })
    );

    res.json({
      hasUpcoming: true,
      hallName: hall.name,
      screenings: populatedScreenings.map(s => ({
        movieTitle: s.movieTitle,
        date: s.date,
        time: s.screeningTime
      }))
    });
  } catch (err) {
    console.error('Error checking screenings:', err);
    res.status(500).json({ error: 'Error checking screenings' });
  }
};

const postHallStatus = async (req, res) => {
  const halls = getCollection('halls');
  const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
  const newStatus = hall.status === 'active' ? 'maintenance' : 'active';
  await halls.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: newStatus } });
  res.redirect('/admin/hall/hall-management');
};

const postHallDelete = async (req, res) => {
  const halls = getCollection('halls');
  await halls.deleteOne({ _id: new ObjectId(req.params.id) });
  res.redirect('/admin/hall/hall-management');
};

const getHallView = async (req, res) => {
  const halls = getCollection('halls');
  const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
  if (!hall) return res.status(404).send('Hall not found');
  res.render('hall/hall-view', { user: req.session.user, hall, error: undefined, success: undefined });
};

const getHallEdit = async (req, res) => {
  const halls = getCollection('halls');
  const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
  if (!hall) return res.status(404).send('Hall not found');
  res.render('hall/hall-create', { user: req.session.user, hall, error: null, success: undefined });
};

const postHallEdit = async (req, res) => {
  const hallId = req.params.id;
  const { name, type, rows, columns, seat, wheelchair } = req.body;
  const halls = getCollection('halls');

  const existingHall = await halls.findOne({ name, _id: { $ne: new ObjectId(hallId) } });
  if (existingHall) {
    const hall = await halls.findOne({ _id: new ObjectId(hallId) });
    return res.render('hall/hall-create', { user: req.session.user, hall, error: 'A hall with this name already exists', success: undefined });
  }

  await halls.updateOne(
    { _id: new ObjectId(hallId) },
    { $set: { name, type, rows: parseInt(rows), columns: parseInt(columns), seat: seat ? JSON.parse(seat) : [], wheelchair: parseInt(wheelchair) || 0 } }
  );
  req.session.successMessage = `Hall "${name}" updated successfully!`;
  res.redirect('/admin/hall/hall-management');
};

module.exports = { getHallManagement, getHallCreate, postHallCreate, getHallScreeningsCheck, postHallStatus, postHallDelete, getHallView, getHallEdit, postHallEdit };
