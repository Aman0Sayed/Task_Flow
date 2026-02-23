// controllers/teamController.js
const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const TeamInvitation = require('../models/TeamInvitation');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

// Get all teams
exports.getTeams = asyncHandler(async (req, res, next) => {
  const teams = await Team.find({ tenantId: req.tenantId })
  .populate('owner', 'name email avatar')
  .populate('members.user', 'name email avatar')
  .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: teams.length,
    data: teams
  });
});

// Get single team
exports.getTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .populate('projects', 'name status progress');

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: team
  });
});

// Create team
exports.createTeam = asyncHandler(async (req, res, next) => {
  req.body.owner = req.user.id;
  req.body.tenantId = req.tenantId;

  const team = await Team.create(req.body);
  
  // Generate invite code
  team.generateInviteCode();
  
  // Add owner as admin
  team.members.push({
    user: req.user.id,
    role: 'admin'
  });
  
  await team.save();

  // Add team to user
  await User.findByIdAndUpdate(req.user.id, {
    $push: { teams: team._id }
  });

  res.status(201).json({
    success: true,
    data: team
  });
});

// Update team
exports.updateTeam = asyncHandler(async (req, res, next) => {
  let team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  const isAuthorized = team.owner.equals(req.user.id) || 
                      team.members.some(m => m.user.equals(req.user.id) && m.role === 'admin');

  if (!isAuthorized) {
    return next(new ErrorResponse('Not authorized to update this team', 403));
  }

  team = await Team.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: team
  });
});

// Delete team
exports.deleteTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Only owner can delete
  if (!team.owner.equals(req.user.id)) {
    return next(new ErrorResponse('Only team owner can delete the team', 403));
  }

  await team.deleteOne();

  // Remove team from all users
  await User.updateMany(
    { teams: team._id },
    { $pull: { teams: team._id } }
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Join team
exports.joinTeam = asyncHandler(async (req, res, next) => {
  const { inviteCode } = req.body;

  const team = await Team.findOne({ 
    inviteCode,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse('Invalid invite code', 400));
  }

  // Check if already a member
  const isMember = team.members.some(member => member.user.equals(req.user.id));

  if (isMember) {
    return next(new ErrorResponse('Already a member of this team', 400));
  }

  // Add user to team
  team.members.push({
    user: req.user.id,
    role: 'member'
  });
  await team.save();

  // Add team to user
  await User.findByIdAndUpdate(req.user.id, {
    $push: { teams: team._id }
  });

  // Create activity
  await Activity.create({
    type: 'member_joined',
    description: `${req.user.name} joined the team`,
    user: req.user.id,
    tenantId: req.tenantId,
    metadata: { teamId: team._id }
  });

  res.status(200).json({
    success: true,
    data: team
  });
});

// Leave team
exports.leaveTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Owner cannot leave
  if (team.owner.equals(req.user.id)) {
    return next(new ErrorResponse('Team owner cannot leave the team', 400));
  }

  // Remove from team
  team.members = team.members.filter(member => !member.user.equals(req.user.id));
  await team.save();

  // Remove team from user
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { teams: team._id }
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Send team invitation (replaces direct member addition)
exports.addMember = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  const isAuthorized = team.owner.equals(req.user.id) ||
                      team.members.some(m => m.user.equals(req.user.id) &&
                      (m.role === 'admin' || m.role === 'lead'));

  if (!isAuthorized) {
    return next(new ErrorResponse('Not authorized to invite members', 403));
  }

  // Check if already a member
  const isMember = team.members.some(member => member.user.equals(req.body.userId));

  if (isMember) {
    return next(new ErrorResponse('User is already a member', 400));
  }

  // Check if there's already a pending invitation
  const existingInvitation = await TeamInvitation.findOne({
    team: req.params.id,
    invitedUser: req.body.userId,
    status: 'pending'
  });

  if (existingInvitation) {
    return next(new ErrorResponse('Invitation already sent to this user', 400));
  }

  // Create invitation
  const invitation = await TeamInvitation.create({
    team: req.params.id,
    invitedUser: req.body.userId,
    invitedBy: req.user.id,
    role: req.body.role || 'member',
    tenantId: req.tenantId
  });

  res.status(200).json({
    success: true,
    data: invitation
  });
});

// Remove member
exports.removeMember = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  const isAuthorized = team.owner.equals(req.user.id) || 
                      team.members.some(m => m.user.equals(req.user.id) && m.role === 'admin');

  if (!isAuthorized) {
    return next(new ErrorResponse('Not authorized to remove members', 403));
  }

  // Remove member
  team.members = team.members.filter(member => !member.user.equals(req.params.userId));
  await team.save();

  // Remove team from user
  await User.findByIdAndUpdate(req.params.userId, {
    $pull: { teams: team._id }
  });

  res.status(200).json({
    success: true,
    data: team
  });
});

// Update member role
exports.updateMemberRole = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  const isAuthorized = team.owner.equals(req.user.id) || 
                      team.members.some(m => m.user.equals(req.user.id) && m.role === 'admin');

  if (!isAuthorized) {
    return next(new ErrorResponse('Not authorized to update member roles', 403));
  }

  // Find and update member
  const memberIndex = team.members.findIndex(m => m.user.equals(req.params.userId));

  if (memberIndex === -1) {
    return next(new ErrorResponse('Member not found', 404));
  }

  team.members[memberIndex].role = req.body.role;
  await team.save();

  res.status(200).json({
    success: true,
    data: team
  });
});

// Add member and create user if not exists
exports.addMemberAndCreateUser = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });
  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Only owner or admin/lead can add
  const isAuthorized = team.owner.equals(req.user.id) ||
    team.members.some(m => m.user.equals(req.user.id) && (m.role === 'admin' || m.role === 'lead'));
  if (!isAuthorized) {
    return next(new ErrorResponse('Not authorized to add members', 403));
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorResponse('Name, email, and password are required', 400));
  }

  // Check if user exists with same email in same tenant
  let user = await User.findOne({ email, tenantId: req.tenantId });
  if (!user) {
    // Generate unique TaskFlow ID
    const taskflowId = await generateTaskflowId(name);
    
    // Create user with same tenant ID
    user = await User.create({ 
      name, 
      email, 
      password,
      role: 'user',
      tenantId: req.tenantId,
      taskflowId,
      companyName: null
    });
  }

  // Check if already a member of this team
  const isMember = team.members.some(member => member.user.equals(user._id));
  if (!isMember) {
    // Add to team
    team.members.push({ user: user._id, role: 'member' });
    await team.save();
  }

  res.status(200).json({
    success: true,
    data: team
  });
});

// Get team invitations for current user
exports.getTeamInvitations = asyncHandler(async (req, res, next) => {
  const invitations = await TeamInvitation.find({
    invitedUser: req.user.id,
    tenantId: req.tenantId
  })
  .populate('team', 'name description')
  .populate('invitedBy', 'name email')
  .sort('-invitedAt');

  res.status(200).json({
    success: true,
    count: invitations.length,
    data: invitations
  });
});

// Accept team invitation
exports.acceptInvitation = asyncHandler(async (req, res, next) => {
  const invitation = await TeamInvitation.findOne({
    _id: req.params.id,
    invitedUser: req.user.id,
    tenantId: req.tenantId,
    status: 'pending'
  });

  if (!invitation) {
    return next(new ErrorResponse('Invitation not found', 404));
  }

  // Update invitation status
  invitation.status = 'accepted';
  invitation.respondedAt = new Date();
  await invitation.save();

  // Add user to team
  const team = await Team.findById(invitation.team);
  if (team) {
    // Check if not already a member
    const isMember = team.members.some(member => member.user.equals(req.user.id));
    if (!isMember) {
      team.members.push({
        user: req.user.id,
        role: invitation.role
      });
      await team.save();
    }

    // Add team to user and update tenantId
    await User.findByIdAndUpdate(req.user.id, {
      $push: { teams: team._id },
      tenantId: team.tenantId
    });
  }

  res.status(200).json({
    success: true,
    data: invitation
  });
});

// Reject team invitation
exports.rejectInvitation = asyncHandler(async (req, res, next) => {
  const invitation = await TeamInvitation.findOne({
    _id: req.params.id,
    invitedUser: req.user.id,
    tenantId: req.tenantId,
    status: 'pending'
  });

  if (!invitation) {
    return next(new ErrorResponse('Invitation not found', 404));
  }

  // Update invitation status
  invitation.status = 'rejected';
  invitation.respondedAt = new Date();
  await invitation.save();

  res.status(200).json({
    success: true,
    data: invitation
  });
});

