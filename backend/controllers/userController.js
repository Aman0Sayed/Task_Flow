// controllers/userController.js
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Get all users
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({ isActive: true, tenantId: req.tenantId })
    .select('name email avatar role teams')
    .populate('teams', 'name')
    .sort('name');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// Get available users (all users from same tenant not in any team, excluding current user)
exports.getAvailableUsers = asyncHandler(async (req, res, next) => {
  console.log('🔍 getAvailableUsers - Current user:', {
    id: req.user.id,
    role: req.user.role,
    tenantId: req.tenantId
  });

  // Get all users from same tenant OR default tenant who are NOT in any team, except current user
  const users = await User.find({
    isActive: true,
    $or: [
      { tenantId: req.tenantId },
      { tenantId: 'default_user_tenant' }
    ],
    _id: { $ne: req.user.id }, // Exclude current user
    $and: [
      {
        $or: [
          { teams: { $exists: false } },
          { teams: { $size: 0 } },
          { teams: { $eq: [] } }
        ]
      }
    ]
  })
    .select('name email avatar role')
    .sort('name');

  console.log('🔍 Query filter:', {
    isActive: true,
    tenantId: req.tenantId,
    _id: { $ne: req.user.id },
    $or: [
      { teams: { $exists: false } },
      { teams: { $size: 0 } },
      { teams: { $eq: [] } }
    ]
  });
  console.log(`✅ Found ${users.length} available users for tenant ${req.tenantId}`);
  console.log('📋 Users:', users.map(u => ({ name: u.name, email: u.email, role: u.role })));

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// Get team members (users who are in at least one team)
exports.getTeamMembers = asyncHandler(async (req, res, next) => {
  const users = await User.find({
    isActive: true,
    tenantId: req.tenantId,
    teams: { $exists: true, $ne: [] }
  })
    .select('name email avatar role teams')
    .populate('teams', 'name')
    .sort('name');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// Get all users for search (with optional search query)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { search, teamId } = req.query;
  console.log('🔍 getAllUsers called with:', { search, teamId, userId: req.user.id, tenantId: req.tenantId });

  let excludeUserIds = [req.user.id]; // Always exclude current user

  // If teamId is provided, also exclude users already in that team
  if (teamId) {
    try {
      const Team = require('../models/Team');
      const team = await Team.findById(teamId);
      console.log('🔍 Found team:', { teamId, teamExists: !!team, memberCount: team?.members?.length || 0 });
      
      if (team && team.members && Array.isArray(team.members)) {
        const memberUserIds = team.members.map(member => member.user);
        excludeUserIds = [...excludeUserIds, ...memberUserIds];
        console.log('🔍 Excluding IDs:', { count: excludeUserIds.length, ids: excludeUserIds });
      }
    } catch (err) {
      console.error('❌ Error fetching team:', err.message);
    }
  }

  // Build the main query with proper structure
  let query = {
    isActive: true,
    tenantId: req.tenantId,
    _id: { $nin: excludeUserIds }
  };

  // Add search filter if provided
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { taskflowId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  console.log('🔍 Final query:', JSON.stringify(query, null, 2));

  // First, let's see how many total active users exist for this tenant
  const totalUsers = await User.countDocuments({ isActive: true, tenantId: req.tenantId });
  console.log('📊 Total active users in tenant:', totalUsers);

  // See how many users we're excluding
  const excludedCount = await User.countDocuments({ _id: { $nin: excludeUserIds }, isActive: true, tenantId: req.tenantId });
  console.log('📊 Non-excluded users in tenant:', excludedCount);

  const users = await User.find(query)
    .select('name email avatar role taskflowId')
    .sort('name')
    .limit(50); // Limit results for performance

  console.log(`✅ Query returned ${users.length} users`);
  if (users.length > 0) {
    console.log('📋 Found users:', users.map(u => ({ name: u.name, taskflowId: u.taskflowId, email: u.email })));
  }

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// Debug endpoint to see database state
exports.debugUsers = asyncHandler(async (req, res, next) => {
  console.log('🐛 DEBUG: User database state for tenant:', req.tenantId);
  
  const totalUsers = await User.countDocuments({ tenantId: req.tenantId });
  const activeUsers = await User.countDocuments({ tenantId: req.tenantId, isActive: true });
  const currentUserId = req.user.id;
  const otherUsers = await User.countDocuments({ tenantId: req.tenantId, _id: { $ne: currentUserId }, isActive: true });
  
  const allUsers = await User.find({ tenantId: req.tenantId })
    .select('name email taskflowId isActive teams _id')
    .limit(50);
  
  // Get the current team info
  const Team = require('../models/Team');
  const teamId = req.query.teamId;
  let teamMembers = [];
  if (teamId) {
    const team = await Team.findById(teamId).select('members');
    teamMembers = team?.members?.map(m => m.user?.toString?.() || m.user) || [];
    console.log(`🐛 Team ${teamId} has ${teamMembers.length} members`);
  }
  
  console.log('🐛 DEBUG nums:', { totalUsers, activeUsers, otherUsers, currentUserId });
  allUsers.forEach(u => {
    const isTeamMember = teamMembers.includes(u._id.toString());
    console.log(`  - ${u.name} (${u.taskflowId}) isActive=${u.isActive} isTeamMember=${isTeamMember}`);
  });

  res.status(200).json({
    success: true,
    debug: {
      tenantId: req.tenantId,
      currentUserId,
      teamId,
      totalUsers,
      activeUsers,
      otherUsers,
      teamMemberCount: teamMembers.length,
      userDetails: allUsers.map(u => {
        const isTeamMember = teamMembers.includes(u._id.toString());
        const isCurrent = u._id.toString() === currentUserId;
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          taskflowId: u.taskflowId,
          isActive: u.isActive,
          isCurrent,
          isTeamMember
        };
      })
    }
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  })
    .select('-password')
    .populate('teams', 'name description');

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// Update user
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Verify user belongs to same tenant
  const targetUser = await User.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!targetUser) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    isActive: req.body.isActive
  };

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// Delete user (soft delete)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // Verify user belongs to same tenant
  const targetUser = await User.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!targetUser) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});

