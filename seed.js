const bcrypt = require('bcrypt');
const { connectToDatabase, getCollection } = require('./lib/database');

async function seed() {
  await connectToDatabase();
  const staff = getCollection('staff');
  const hashed = await bcrypt.hash('admin123', 10);
  await staff.insertOne({ username: 'admin', password: hashed });
  console.log('Staff account created');
  process.exit(0);
}

seed();