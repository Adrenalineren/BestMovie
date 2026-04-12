const {MongoClient, ObjectId} = require('mongodb');

let client = null;
let db = null;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    db = client.db('movie');
  }
}

async function ensureDatabaseIndexes() {
  if (!db) throw new Error('Database not connected.');

  const seatReservations = db.collection('seatReservations');
  // Strict concurrency guard: one seat can only be reserved once per screening.
  await seatReservations.createIndex(
    { screeningId: 1, seatLabel: 1 },
    { unique: true, name: 'uniq_screening_seat' }
  );

  await seatReservations.createIndex(
    { reservationToken: 1 },
    { name: 'idx_reservation_token' }
  );
}

function getCollection(name) {
  if (!db) throw new Error('Database not connected.');
  return db.collection(name);
}

async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connectToDatabase,
  ensureDatabaseIndexes,
  disconnect,
  getCollection,
}