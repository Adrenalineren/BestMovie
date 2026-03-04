const bcrypt = require('bcrypt');
const { connectToDatabase, getCollection } = require('./lib/database');

async function seed() {
  await connectToDatabase();
  const staff = getCollection('staff');
  const hashed = await bcrypt.hash('hello', 10);
  await staff.insertOne({ username: 'adeline', password: hashed });
  console.log('Staff account created');
  process.exit(0);
}

seed();