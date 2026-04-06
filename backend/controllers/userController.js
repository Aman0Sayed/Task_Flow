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
  
  const debug = {
    input: { search, teamId, userId: req.user.id, tenantId: req.tenantId },
    steps: []
  };

  // Get ALL users from database (GLOBAL - no tenantId filter)
  const allUsersInDatabase = await User.find({ isActive: true })
    .select('_id name email taskflowId isActive')
    .sort('name');
  
  debug.steps.push(`📊 Total users in database: ${allUsersInDatabase.length}`);
  allUsersInDatabase.slice(0, 10).forEach(u => {
    debug.steps.push(`  - ${u.name} (${u.taskflowId})`);
  });

  // Now build exclusion list
  let excludeUserIds = [req.user.id];
  debug.steps.push(`🚫 Always exclude current user: ${req.user.id}`);

  if (teamId) {
    try {
      const Team = require('../models/Team');
      const team = await Team.findById(teamId);
      if (team && team.members) {
        const memberIds = team.members.map(m => m.user);
        excludeUserIds = [...excludeUserIds, ...memberIds];
        debug.steps.push(`🚫 Also exclude ${memberIds.length} team members`);
      }
    } catch (err) {
      debug.steps.push(`❌ Error fetching team: ${err.message}`);
    }
  }

  debug.steps.push(`🚫 Total IDs to exclude: ${excludeUserIds.length}`);
  debug.excludeUserIds = excludeUserIds;

  // Build query - search across ALL users globally
  let query = {
    isActive: true,
    _id: { $nin: excludeUserIds }
  };

  // Add search terms if provided
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { taskflowId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    debug.steps.push(`🔎 Added search filter for: "${search}"`);
  }

  debug.queryStructure = JSON.stringify(query, null, 2);

  // Execute query
  const users = await User.find(query)
    .select('name email avatar role taskflowId _id')
    .sort('name')
    .limit(50);

  debug.steps.push(`✅ Query returned ${users.length} users`);
  users.slice(0, 10).forEach(u => {
    debug.steps.push(`  - ${u.name} (${u.taskflowId}) ${u.email}`);
  });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
    _debug: debug  // Include debug info in response
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

