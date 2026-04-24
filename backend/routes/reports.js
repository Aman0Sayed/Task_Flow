// routes/reports.js
const express = require('express');
const { protect } = require('../middlewares/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const Team = require('../models/Team');
const requireTeamForUserRole = require('../middlewares/requireTeamForUserRole');

const router = express.Router();

router.use(protect);
router.use(requireTeamForUserRole);

// Get dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user && (req.user._id || req.user.id);

  const userTeams = await Team.find({
    tenantId: req.tenantId,
    $or: [ { owner: userId }, { 'members.user': userId } ]
  }).select('_id');
  const userTeamIds = userTeams.map(t => t._id);

  // Get user's projects
  const projects = await Project.find({
    tenantId: req.tenantId,
    $or: [
      { owner: userId },
      { 'members.user': userId },
      ...(userTeamIds.length > 0 ? [{ team: { $in: userTeamIds } }] : [])
    ]
  });

  const projectIds = projects.map(p => p._id);

  // Get task statistics
  const tasks = await Task.find({ tenantId: req.tenantId, project: { $in: projectIds } });
  
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.isOverdue).length
  };

  // Get project statistics
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on-hold').length
  };

  // Get recent activities
  const recentActivities = await Activity.find({ tenantId: req.tenantId, project: { $in: projectIds } })
    .populate('user', 'name email avatar')
    .populate('project', 'name')
    .sort('-createdAt')
    .limit(10);

  // Get upcoming deadlines
  const upcomingDeadlines = await Task.find({
    tenantId: req.tenantId,
    project: { $in: projectIds },
    dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    status: { $ne: 'done' }
  })
  .populate('assignee', 'name email')
  .populate('project', 'name')
  .sort('dueDate')
  .limit(10);

  res.status(200).json({
    success: true,
    data: {
      taskStats,
      projectStats,
      recentActivities,
      upcomingDeadlines
    }
  });
}));

// Get project report
router.get('/project/:projectId', asyncHandler(async (req, res) => {
  const userId = req.user && (req.user._id || req.user.id);

  const project = await Project.findOne({ _id: req.params.projectId, tenantId: req.tenantId })
    .populate('owner', 'name email')
    .populate('members.user', '_id name email');

  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found'
    });
  }

  // Access check: owner/member or linked team member/owner
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
    return res.status(403).json({ success: false, error: 'Not authorized to access this report' });
  }

  // Get task statistics
  const tasks = await Task.find({ tenantId: req.tenantId, project: req.params.projectId });
  
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length
  };

  const tasksByPriority = {
    low: tasks.filter(t => t.priority === 'low').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    high: tasks.filter(t => t.priority === 'high').length,
    urgent: tasks.filter(t => t.priority === 'urgent').length
  };

  // Get team member statistics
  const memberTasks = {};
  project.members.forEach(member => {
    memberTasks[member.user._id] = {
      user: member.user,
      assignedTasks: tasks.filter(t => t.assignee?.equals(member.user._id)).length,
      completedTasks: tasks.filter(t => 
        t.assignee?.equals(member.user._id) && t.status === 'done'
      ).length
    };
  });

  // Get activity timeline
  const activities = await Activity.find({ tenantId: req.tenantId, project: req.params.projectId })
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(30);

  // Calculate time tracking
  let totalEstimated = 0;
  let totalLogged = 0;
  tasks.forEach(task => {
    if (task.timeTracking) {
      totalEstimated += task.timeTracking.estimated || 0;
      totalLogged += task.timeTracking.logged || 0;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      project,
      tasksByStatus,
      tasksByPriority,
      memberTasks,
      activities,
      timeTracking: {
        totalEstimated,
        totalLogged,
        efficiency: totalEstimated > 0 ? (totalLogged / totalEstimated) * 100 : 0
      }
    }
  });
}));

// Get user performance report
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const userId = req.params.userId === 'me' ? req.user.id : req.params.userId;

  // Only allow the user themself, or privileged roles, to view user report.
  if (String(userId) !== String(req.user.id) && req.user?.role !== 'admin' && req.user?.role !== 'manager') {
    return res.status(403).json({ success: false, error: 'Not authorized to access this report' });
  }

  // Get user's tasks
  const tasks = await Task.find({ tenantId: req.tenantId, assignee: userId })
    .populate('project', 'name');

  // Task statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    overdue: tasks.filter(t => t.isOverdue).length
  };

  // Tasks by project
  const tasksByProject = {};
  tasks.forEach(task => {
    if (!tasksByProject[task.project._id]) {
      tasksByProject[task.project._id] = {
        project: task.project,
        tasks: 0,
        completed: 0
      };
    }
    tasksByProject[task.project._id].tasks++;
    if (task.status === 'done') {
      tasksByProject[task.project._id].completed++;
    }
  });

  // Activity history
  const activities = await Activity.find({ tenantId: req.tenantId, user: userId })
    .populate('project', 'name')
    .sort('-createdAt')
    .limit(50);

  // Completion rate over time (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const completedTasksByDay = {};
  
  tasks
    .filter(t => t.status === 'done' && t.updatedAt >= thirtyDaysAgo)
    .forEach(task => {
      const day = task.updatedAt.toISOString().split('T')[0];
      completedTasksByDay[day] = (completedTasksByDay[day] || 0) + 1;
    });

  res.status(200).json({
    success: true,
    data: {
      taskStats,
      tasksByProject: Object.values(tasksByProject),
      activities,
      completionTrend: completedTasksByDay
    }
  });
}));

module.exports = router;

