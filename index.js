const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { ObjectId } = require('mongodb');
const {connectToDatabase, disconnect, getCollection} = require('./lib/database');
const requireLogin = require('./middleware/auth');
const app = express();
const port = 3000;

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
  res.render('hall-create', { user: req.session.user });
});
// specifics of creating hall
app.post('/admin/hall-management/create', requireLogin, async (req, res) => {
  const { name, type, rows, columns, seat } = req.body;
  const halls = getCollection('halls');
  await halls.insertOne({ 
    name, 
    type, 
    rows: parseInt(rows), 
    columns: parseInt(columns), 
    seat: seat ? JSON.parse(seat) : [], 
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

app.get('/admin/movie-management', requireLogin, (req, res) => {
  res.render('movie-management', { user: req.session.user });
});

app.get('/admin/screening-management', requireLogin, (req, res) => {
  res.render('screening-management', { user: req.session.user });
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