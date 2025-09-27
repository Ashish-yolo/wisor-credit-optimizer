const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory user storage (replace with database in production)
const users = new Map();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      name: user.name 
    },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new user
router.post('/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2-50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = Array.from(users.values()).find(user => user.email === email);
      if (existingUser) {
        return res.status(400).json({
          error: 'Registration failed',
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newUser = {
        id: userId,
        name,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      };

      users.set(userId, newUser);

      // Generate token
      const token = generateToken(newUser);

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'Internal server error'
      });
    }
  }
);

// Login user
router.post('/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = Array.from(users.values()).find(user => user.email === email);
      if (!user) {
        return res.status(401).json({
          error: 'Login failed',
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Login failed',
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Login failed',
          message: 'Invalid email or password'
        });
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      users.set(user.id, user);

      // Generate token
      const token = generateToken(user);

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'Internal server error'
      });
    }
  }
);

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = users.get(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', 
  auth,
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2-50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const user = users.get(req.user.id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      const updates = req.body;

      // Check if email is being changed and if it's already taken
      if (updates.email && updates.email !== user.email) {
        const existingUser = Array.from(users.values()).find(u => u.email === updates.email);
        if (existingUser) {
          return res.status(400).json({
            error: 'Update failed',
            message: 'Email already in use by another account'
          });
        }
      }

      // Update user data
      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      users.set(user.id, updatedUser);

      // Return updated user data (without password)
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: 'Internal server error'
      });
    }
  }
);

// Change password
router.put('/change-password',
  auth,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = users.get(req.user.id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Password change failed',
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
      user.updatedAt = new Date().toISOString();
      users.set(user.id, user);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        message: 'Internal server error'
      });
    }
  }
);

// Refresh token
router.post('/refresh-token', auth, async (req, res) => {
  try {
    const user = users.get(req.user.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const newToken = generateToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      message: 'Internal server error'
    });
  }
});

// Logout (client-side token invalidation)
router.post('/logout', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client storage.'
  });
});

// Get user statistics (admin endpoint)
router.get('/stats', auth, async (req, res) => {
  try {
    const allUsers = Array.from(users.values());
    
    const stats = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(user => user.isActive).length,
      inactiveUsers: allUsers.filter(user => !user.isActive).length,
      recentRegistrations: allUsers.filter(user => {
        const registrationDate = new Date(user.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return registrationDate > sevenDaysAgo;
      }).length
    };

    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch user statistics',
      message: 'Internal server error'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Authentication Service',
    status: 'healthy',
    features: [
      'User Registration',
      'User Login',
      'JWT Token Management',
      'Profile Management',
      'Password Change'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;