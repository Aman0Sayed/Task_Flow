// routes/teams.js
const express = require('express');
const { protect } = require('../middlewares/auth');
const Team = require('../models/Team');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const teamController = require('../controllers/teamController');

const router = express.Router();

router.use(protect);

// Get all teams for user
router.get('/', asyncHandler(async (req, res) => {
  const teams = await Team.find({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  })
  .populate('owner', 'name email avatar')
  .populate('members.user', 'name email avatar')
  .populate('projects', 'name status')
  .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: teams.length,
    data: teams
  });
}));

// Get single team
router.get('/:id', asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .populate('projects', 'name status progress');

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check if user has access to team
  const hasAccess = team.owner.equals(req.user.id) || 
                   team.members.some(member => member.user.equals(req.user.id));

  if (!hasAccess) {
    return next(new ErrorResponse('Not authorized to access this team', 403));
  }

  res.status(200).json({
    success: true,
    data: team
  });
}));

// Create new team
router.post('/', asyncHandler(async (req, res) => {
  req.body.owner = req.user.id;
  
  const team = await Team.create(req.body);
  
  // Generate invite code
  team.generateInviteCode();
  await team.save();

  // Add owner as admin member
  team.members.push({
    user: req.user.id,
    role: 'admin'
  });
  await team.save();

  // Update user's teams
  await User.findByIdAndUpdate(req.user.id, {
    $push: { teams: team._id }
  });

  res.status(201).json({
    success: true,
    data: team
  });
}));

// Update team
router.put('/:id', asyncHandler(async (req, res, next) => {
  let team = await Team.findById(req.params.id);

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check if user is owner or admin
  const isAdmin = team.members.some(member => 
    member.user.equals(req.user.id) && (member.role === 'admin' || member.role === 'lead')
  );

  if (!team.owner.equals(req.user.id) && !isAdmin) {
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
}));

// Delete team
router.delete('/:id', asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check if user is owner
  if (!team.owner.equals(req.user.id)) {
    return next(new ErrorResponse('Only team owner can delete the team', 403));
  }

  await team.remove();

  // Remove team from all members
  await User.updateMany(
    { teams: team._id },
    { $pull: { teams: team._id } }
  );

  res.status(200).json({
    success: true,
    data: {}
  });
}));

// Join team with invite code
router.post('/join', asyncHandler(async (req, res, next) => {
  const { inviteCode } = req.body;

  const team = await Team.findOne({ inviteCode });

  if (!team) {
    return next(new ErrorResponse('Invalid invite code', 400));
  }

  // Check if user is already a member
  const isMember = team.members.some(member => member.user.equals(req.user.id));

  if (isMember) {
    return next(new ErrorResponse('You are already a member of this team', 400));
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

  res.status(200).json({
    success: true,
    data: team
  });
}));

// Leave team
router.post('/:id/leave', asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Can't leave if you're the owner
  if (team.owner.equals(req.user.id)) {
    return next(new ErrorResponse('Team owner cannot leave the team', 400));
  }

  // Remove user from team
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
}));

// Update member role
router.put('/:id/members/:userId', asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check if user is owner or admin
  const isAdmin = team.members.some(member => 
    member.user.equals(req.user.id) && (member.role === 'admin' || member.role === 'lead')
  );

  if (!team.owner.equals(req.user.id) && !isAdmin) {
    return next(new ErrorResponse('Not authorized to update member roles', 403));
  }

  // Find and update member role
  const memberIndex = team.members.findIndex(member => 
    member.user.equals(req.params.userId)
  );

  if (memberIndex === -1) {
    return next(new ErrorResponse('Member not found in team', 404));
  }

  team.members[memberIndex].role = req.body.role;
  await team.save();

  res.status(200).json({
    success: true,
    data: team
  });
}));

// Add member and create user if not exists
router.post('/:id/add-member', asyncHandler(async (req, res, next) => {
  // This controller will create a user if not exists, then add to team
  return teamController.addMemberAndCreateUser(req, res, next);
}));

module.exports = router;

