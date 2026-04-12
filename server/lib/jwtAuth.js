const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getCollection } = require('./database');

const JWT_SECRET = 'your-jwt-secret-key-change-in-production'; // Change this in production
const JWT_EXPIRY = '24h';

const registerCustomer = async (email, password, name) => {
  try {
    const customers = getCollection('customers');
    
    // Check if user already exists
    const existingCustomer = await customers.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new customer
    const result = await customers.insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name,
      createdAt: new Date(),
      bookings: [] // Will store booking IDs
    });

    return { 
      success: true, 
      customerId: result.insertedId,
      message: 'Registration successful'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Login customer and return JWT token
 */
const loginCustomer = async (email, password) => {
  try {
    const customers = getCollection('customers');
    
    const customer = await customers.findOne({ email: email.toLowerCase() });
    if (!customer) {
      return { success: false, error: 'Email not found' };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, customer.password);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid password' };
    }

    // Generate JWT token
    const accessToken = jwt.sign(
      { customerId: customer._id.toString(), email: customer.email, name: customer.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return {
      success: true,
      accessToken,
      customer: {
        customerId: customer._id,
        email: customer.email,
        name: customer.name
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, data: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Middleware: Require JWT authentication for requests
 */
const requireAuthJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const verification = verifyToken(token);
  
  if (!verification.valid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach customer data to request
  req.customer = verification.data;
  next();
};

module.exports = {
  registerCustomer,
  loginCustomer,
  verifyToken,
  requireAuthJWT,
  JWT_SECRET
};
