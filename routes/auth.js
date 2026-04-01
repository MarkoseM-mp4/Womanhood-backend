const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/login — Owner login
router.post('/login', (req, res) => {
  try {
    const { username, phoneNumber } = req.body;

    if (!username || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Username and phone number are required.'
      });
    }

    // Validate against env credentials
    if (
      username !== process.env.OWNER_USERNAME ||
      phoneNumber !== process.env.OWNER_PHONE
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { username, role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
});

module.exports = router;
