// controllers/collaborationController.js
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Search for users by TaskFlow ID
 * Public endpoint - no tenant restriction
 * Used to find collaborators across tenants
 */
exports.searchUserByTaskflowId = asyncHandler(async (req, res, next) => {
  const { taskflowId } = req.params;

  if (!taskflowId) {
    return next(new ErrorResponse('TaskFlow ID is required', 400));
  }

  const user = await User.findOne({ taskflowId: taskflowId.toLowerCase() })
    .select('name email avatar taskflowId role')
    .lean();

  if (!user) {
    return res.status(200).json({
      success: false,
      message: `No user found with TaskFlow ID: @${taskflowId}`,
      data: null
    });
  }

  res.status(200).json({
    success: true,
    message: `Found user with TaskFlow ID: @${taskflowId}`,
    data: user
  });
});

/**
 * Search users by name or taskflowId
 * Public search endpoint for finding collaborators
 */
exports.searchUsers = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return next(new ErrorResponse('Search query must be at least 2 characters', 400));
  }

  const searchQuery = query.toLowerCase();

  const users = await User.find({
    $or: [
      { taskflowId: { $regex: searchQuery, $options: 'i' } },
      { name: { $regex: searchQuery, $options: 'i' } }
    ],
    isActive: true
  })
    .select('name email avatar taskflowId role')
    .limit(10)
    .lean();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

/**
 * Get user profile by TaskFlow ID
 * Public endpoint - shows basic profile info
 */
exports.getUserByTaskflowId = asyncHandler(async (req, res, next) => {
  const { taskflowId } = req.params;

  if (!taskflowId) {
    return next(new ErrorResponse('TaskFlow ID is required', 400));
  }

  const user = await User.findOne({ taskflowId: taskflowId.toLowerCase(), isActive: true })
    .select('name avatar taskflowId role createdAt')
    .populate('teams', 'name description')
    .lean();

  if (!user) {
    return next(new ErrorResponse(`User not found with TaskFlow ID: @${taskflowId}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Get all collaborators for current user's tenant
 * Shows users in same tenant
 */
exports.getCollaborators = asyncHandler(async (req, res, next) => {
  const users = await User.find({
    tenantId: req.tenantId,
    isActive: true,
    _id: { $ne: req.user.id }
  })
    .select('name email avatar taskflowId role teams')
    .populate('teams', 'name')
    .sort('name')
    .lean();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

/**
 * Get user profile card with basic info
 * Used for hovercards/profile previews
 */
exports.getUserProfileCard = asyncHandler(async (req, res, next) => {
  const { taskflowId } = req.params;

  if (!taskflowId) {
    return next(new ErrorResponse('TaskFlow ID is required', 400));
  }

  const user = await User.findOne({ taskflowId: taskflowId.toLowerCase(), isActive: true })
    .select('name avatar taskflowId role teams createdAt')
    .populate({
      path: 'teams',
      select: 'name',
      options: { limit: 3 }
    })
    .lean();

  if (!user) {
    return next(new ErrorResponse(`User not found with TaskFlow ID: @${taskflowId}`, 404));
  }

  // Format response for profile card
  const profileCard = {
    name: user.name,
    avatar: user.avatar,
    taskflowId: user.taskflowId,
    role: user.role,
    teamCount: user.teams?.length || 0,
    teams: user.teams || [],
    joinedDate: user.createdAt
  };

  res.status(200).json({
    success: true,
    data: profileCard
  });
});

/**
 * Get connection info - shows if users are connected
 * Cross-tenant connection check
 */
exports.getConnectionInfo = asyncHandler(async (req, res, next) => {
  const { taskflowId } = req.params;

  if (!taskflowId) {
    return next(new ErrorResponse('TaskFlow ID is required', 400));
  }

  const otherUser = await User.findOne({ taskflowId: taskflowId.toLowerCase(), isActive: true })
    .select('_id taskflowId name')
    .lean();

  if (!otherUser) {
    return next(new ErrorResponse(`User not found with TaskFlow ID: @${taskflowId}`, 404));
  }

  // Check if same tenant
  const currentUser = await User.findById(req.user.id).select('tenantId').lean();
  const otherUserData = await User.findById(otherUser._id).select('tenantId').lean();

  const sameTenant = currentUser.tenantId === otherUserData.tenantId;

  res.status(200).json({
    success: true,
    data: {
      taskflowId: otherUser.taskflowId,
      name: otherUser.name,
      sameTenant,
      canCollaborate: true, // In future, check pending invites, blocks, etc.
      connectionStatus: sameTenant ? 'same-workspace' : 'different-workspace'
    }
  });
});
