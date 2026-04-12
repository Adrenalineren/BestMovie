const express = require('express');
const { registerCustomer, loginCustomer } = require('../lib/jwtAuth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new customer
 * Body: { email, password, name }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      });
    }

    const result = await registerCustomer(email, password, name);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Registration successful. Please log in.',
      customerId: result.customerId
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

/**
 * POST /api/auth/login
 * Login customer and return JWT token
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const result = await loginCustomer(email, password);

    if (!result.success) {
      return res.status(401).json({ 
        success: false, 
        error: result.error 
      });
    }

    return res.json({
      success: true,
      accessToken: result.accessToken,
      customer: result.customer,
      message: 'Login successful'
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

module.exports = router;
