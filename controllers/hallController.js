const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

const getHallManagement = async (req, res) => {
  const halls = getCollection('halls');
  const allHalls = await halls.find().toArray();
  res.render('hall-management', { user: req.session.user, halls: allHalls });
};

const getHallCreate = (req, res) => {
  res.render('hall-create', { user: req.session.user, hall: null, error: null });
};

const postHallCreate = async (req, res) => {
  const { name, type, rows, columns, seat, wheelchair } = req.body;
  const halls = getCollection('halls');

  const existingHall = await halls.findOne({ name });
  if (existingHall) {
    return res.render('hall-create', { user: req.session.user, hall: null, error: 'A hall with this name already exists' });
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
  res.redirect('/admin/hall-management');
};

const postHallStatus = async (req, res) => {
  const halls = getCollection('halls');
  const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
  const newStatus = hall.status === 'active' ? 'maintenance' : 'active';
  await halls.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: newStatus } });
  res.redirect('/admin/hall-management');
};

const postHallDelete = async (req, res) => {
  const halls = getCollection('halls');
  await halls.deleteOne({ _id: new ObjectId(req.params.id) });
  res.redirect('/admin/hall-management');
};

const getHallView = async (req, res) => {
  const halls = getCollection('halls');
  const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
  if (!hall) return res.status(404).send('Hall not found');
  res.render('hall-view', { user: req.session.user, hall });
};

const getHallEdit = async (req, res) => {
  const halls = getCollection('halls');
  const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
  if (!hall) return res.status(404).send('Hall not found');
  res.render('hall-create', { user: req.session.user, hall, error: null });
};

const postHallEdit = async (req, res) => {
  const hallId = req.params.id;
  const { name, type, rows, columns, seat, wheelchair } = req.body;
  const halls = getCollection('halls');

  const existingHall = await halls.findOne({ name, _id: { $ne: new ObjectId(hallId) } });
  if (existingHall) {
    const hall = await halls.findOne({ _id: new ObjectId(hallId) });
    return res.render('hall-create', { user: req.session.user, hall, error: 'A hall with this name already exists' });
  }

  await halls.updateOne(
    { _id: new ObjectId(hallId) },
    { $set: { name, type, rows: parseInt(rows), columns: parseInt(columns), seat: seat ? JSON.parse(seat) : [], wheelchair: parseInt(wheelchair) || 0 } }
  );
  res.redirect('/admin/hall-management');
};

module.exports = { getHallManagement, getHallCreate, postHallCreate, postHallStatus, postHallDelete, getHallView, getHallEdit, postHallEdit };
