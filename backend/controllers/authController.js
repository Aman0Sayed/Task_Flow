// controllers/authController.js
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');

// Generate unique tenant ID
const generateTenantId = () => {
  return crypto.randomBytes(12).toString('hex');
};

// Generate unique TaskFlow ID (like social media username)
const generateTaskflowId = async (name) => {
  // Create base ID from name (slugify: lowercase, replace spaces with underscore)
  const baseId = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 20); // Limit to 20 chars

  let taskflowId = baseId;
  let counter = 1;

  // Check if ID exists, if so add random suffix
  while (await User.findOne({ taskflowId })) {
    const suffix = Math.floor(Math.random() * 10000);
    taskflowId = `${baseId}_${suffix}`;
    counter++;
    if (counter > 10) {
      // Fallback: use completely random ID
      taskflowId = `user_${crypto.randomBytes(6).toString('hex')}`;
      break;
    }
  }

  return taskflowId;
};

// Register user
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Generate unique TaskFlow ID
  const taskflowId = await generateTaskflowId(name);

  // Create user with manager role, unique tenant ID, and TaskFlow ID
  const user = await User.create({
    name,
    email,
    password,
    role: 'manager',
    tenantId: generateTenantId(),
    taskflowId
  });

  sendTokenResponse(user, 201, res);
});

// Login user
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get current logged in user
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('teams')
    .select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
});

// Update user details
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    preferences: req.body.preferences
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// Update password
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Logout user
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        taskflowId: user.taskflowId,
        preferences: user.preferences
      }
    });
};

