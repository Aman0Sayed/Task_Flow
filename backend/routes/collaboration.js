// routes/collaboration.js
const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  searchUserByTaskflowId,
  searchUsers,
  getUserByTaskflowId,
  getCollaborators,
  getUserProfileCard,
  getConnectionInfo
} = require('../controllers/collaborationController');

const router = express.Router();

/**
 * Public Routes (no authentication required)
 */

// Search for user by TaskFlow ID
// GET /api/collaboration/search/:taskflowId
router.get('/search/:taskflowId', searchUserByTaskflowId);

// Search users by name or taskflowId
// GET /api/collaboration/search?query=john
router.get('/search', searchUsers);

// Get user profile by TaskFlow ID (public view)
// GET /api/collaboration/user/:taskflowId
router.get('/user/:taskflowId', getUserByTaskflowId);

// Get user profile card (for hovers)
// GET /api/collaboration/card/:taskflowId
router.get('/card/:taskflowId', getUserProfileCard);

/**
 * Protected Routes (authentication required)
 */

// Get all collaborators in same workspace
// GET /api/collaboration/collaborators
router.get('/collaborators', protect, getCollaborators);

// Get connection info with another user
// GET /api/collaboration/connection/:taskflowId
router.get('/connection/:taskflowId', protect, getConnectionInfo);

module.exports = router;
