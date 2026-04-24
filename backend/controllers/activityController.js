// controllers/activityController.js
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const Team = require('../models/Team');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// Get all activities for user's projects
exports.getActivities = asyncHandler(async (req, res, next) => {
  const userId = req.user && (req.user._id || req.user.id);

  // Find teams the user currently belongs to (owner or member).
  const userTeams = await Team.find({
    tenantId: req.tenantId,
    $or: [{ owner: userId }, { 'members.user': userId }]
  }).select('_id');
  const userTeamIds = userTeams.map(t => t._id);

  // Only include projects the current user can access.
  const projects = await Project.find({
    tenantId: req.tenantId,
    $or: [
      { owner: userId },
      { 'members.user': userId },
      ...(userTeamIds.length > 0 ? [{ team: { $in: userTeamIds } }] : [])
    ]
  }).select('_id');

  const projectIds = projects.map(p => p._id);

  const activities = await Activity.find({ 
    project: { $in: projectIds },
    tenantId: req.tenantId
  })
  .populate('user', 'name email avatar')
  .populate('project', 'name')
  .populate('task', 'title')
  .sort('-createdAt')
  .limit(parseInt(req.query.limit) || 100);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// Get activities for a specific project
exports.getProjectActivities = asyncHandler(async (req, res, next) => {
  const userId = req.user && (req.user._id || req.user.id);

  const project = await Project.findOne({
    _id: req.params.projectId,
    tenantId: req.tenantId
  }).select('owner members team');

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  const isOwner = project.owner && project.owner.equals && project.owner.equals(userId);
  const isMember = Array.isArray(project.members) && project.members.some(m => m.user && m.user.equals && m.user.equals(userId));
  let isOnTeam = false;
  if (project.team) {
    const teamCheck = await Team.findOne({
      _id: project.team,
      tenantId: req.tenantId,
      $or: [{ owner: userId }, { 'members.user': userId }]
    }).select('_id');
    isOnTeam = Boolean(teamCheck);
  }

  if (!isOwner && !isMember && !isOnTeam) {
    return next(new ErrorResponse('Not authorized to view activities for this project', 403));
  }

  const activities = await Activity.find({ 
    project: req.params.projectId,
    tenantId: req.tenantId
  })
  .populate('user', 'name email avatar')
  .populate('task', 'title')
  .sort('-createdAt')
  .limit(parseInt(req.query.limit) || 50);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// Get activities for a specific user
exports.getUserActivities = asyncHandler(async (req, res, next) => {
  const userId = req.user && (req.user._id || req.user.id);

  // Only allow the user themself, or privileged roles, to view user-activity.
  if (String(req.params.userId) !== String(userId) && req.user?.role !== 'admin' && req.user?.role !== 'manager') {
    return next(new ErrorResponse('Not authorized to view these activities', 403));
  }

  const activities = await Activity.find({ 
    user: req.params.userId,
    tenantId: req.tenantId
  })
  .populate('user', 'name email avatar')
  .populate('project', 'name')
  .populate('task', 'title')
  .sort('-createdAt')
  .limit(parseInt(req.query.limit) || 50);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

