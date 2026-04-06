// routes/users.js
const express = require('express');
const { protect } = require('../middlewares/auth');
const userController = require('../controllers/userController');
const asyncHandler = require('../utils/asyncHandler');
const upload = require('../config/upload');
const User = require('../models/User');

const router = express.Router();

router.use(protect);

// Get all users
router.get('/', userController.getUsers);

// Get available users (users with role 'user' who are not in any team)
router.get('/available', userController.getAvailableUsers);

// Get all users for search
router.get('/search', userController.getAllUsers);

// Debug endpoint
router.get('/debug/stats', userController.debugUsers);

// Debug - see ALL users without filtering
router.get('/debug/all-users', asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const users = await User.find({ tenantId: req.tenantId })
    .select('name email taskflowId isActive _id teams')
    .limit(100);
  
  res.status(200).json({
    success: true,
    tenantId: req.tenantId,
    count: users.length,
    users: users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      taskflowId: u.taskflowId,
      isActive: u.isActive,
      teamsCount: u.teams?.length || 0
    }))
  });
}));

// Debug - comprehensive inspection
router.get('/debug/inspect', asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const Team = require('../models/Team');
  
  const currentUserId = req.user.id;
  const tenantId = req.tenantId;
  
  // Get current user info
  const currentUser = await User.findById(currentUserId).select('_id name email taskflowId tenantId');
  
  // Get ALL users in this tenant
  const allUsersInTenant = await User.find({ tenantId })
    .select('_id name email taskflowId isActive tenantId teams')
    .sort('name');
  
  // Get teams
  const teams = await Team.find({ createdBy: currentUserId })
    .select('_id name members owner')
    .populate('members.user', '_id name email taskflowId');
  
  const report = {
    currentUser: {
      id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      taskflowId: currentUser.taskflowId,
      tenantId: currentUser.tenantId
    },
    tenantId,
    allUsersInTenant: {
      count: allUsersInTenant.length,
      users: allUsersInTenant.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        taskflowId: u.taskflowId,
        isActive: u.isActive,
        tenantId: u.tenantId,
        teams: u.teams?.length || 0
      }))
    },
    myTeams: teams.map(t => ({
      id: t._id,
      name: t.name,
      members: t.members.map(m => ({
        userId: m.user?._id,
        userName: m.user?.name,
        email: m.user?.email,
        taskflowId: m.user?.taskflowId
      }))
    }))
  };
  
  res.status(200).json(report);
}));

// Get team members (users who are in at least one team)
router.get('/team-members', userController.getTeamMembers);

// Get single user
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('teams');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
}));

// Upload user avatar
router.post('/avatar', protect, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload a file'
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: `/uploads/${req.file.filename}` },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: user
  });
}));

// Update user preferences
router.put('/preferences', protect, asyncHandler(async (req, res) => {
  const { theme, color } = req.body;

  const allowedThemes = ['light', 'dark', 'system'];
  const allowedColors = ['Blue', 'Purple', 'Green', 'Red', 'Orange'];

  if (theme && !allowedThemes.includes(theme)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid theme'
    });
  }

  if (color && !allowedColors.includes(color)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid color'
    });
  }

  const update = {};
  if (theme !== undefined) update['preferences.theme'] = theme;
  if (color !== undefined) update['preferences.color'] = color;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    update,
    { new: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
}));

module.exports = router;

