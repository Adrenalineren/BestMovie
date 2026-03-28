const { ObjectId } = require('mongodb');
const { getCollection } = require('../lib/database');

// GET /api/halls - Get all active halls
const getAllHallsJSON = async (req, res) => {
  try {
    const halls = getCollection('halls');
    const allHalls = await halls.find({ status: 'active' }).toArray();
    res.status(200).json(allHalls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/halls/:id - Get single hall by ID
const getHallByIdJSON = async (req, res) => {
  try {
    const halls = getCollection('halls');
    const hall = await halls.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    
    res.status(200).json(hall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  getAllHallsJSON, 
  getHallByIdJSON 
};
