// routes/users.js
const express = require('express');
const { protect } = require('../middlewares/auth');
const User = require('../models/User');
const upload = require('../config/upload');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

// Get all users (for team member selection, etc.)
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true })
    .select('name email avatar')
    .sort('name');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
}));

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

module.exports = router;

