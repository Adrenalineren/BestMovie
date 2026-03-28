const {MongoClient, ObjectId} = require('mongodb');

let client = null;
let db = null;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    db = client.db('movie');
  }
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
  disconnect,
  getCollection,
}