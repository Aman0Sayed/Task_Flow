// controllers/taskController.js
const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// Get all tasks for a project
exports.getTasks = asyncHandler(async (req, res, next) => {
  // Ensure user has access to the project
  const project = await Project.findOne({ _id: req.params.projectId, tenantId: req.tenantId }).select('owner members team');
  if (!project) return next(new ErrorResponse('Project not found', 404));

  const userId = req.user && (req.user._id || req.user.id);

  // Determine if the user is owner/member or belongs to the linked team (fresh DB check)
  const isProjectOwner = project.owner && project.owner.equals && project.owner.equals(userId);
  const isProjectMember = Array.isArray(project.members) && project.members.some(m => m.user && m.user.equals && m.user.equals(userId));
  let isOnTeam = false;
  if (project.team) {
    const teamCheck = await Team.findOne({
      _id: project.team,
      tenantId: req.tenantId,
      $or: [ { owner: userId }, { 'members.user': userId } ]
    }).select('_id');
    isOnTeam = Boolean(teamCheck);
  }

  if (!isProjectOwner && !isProjectMember && !isOnTeam) {
    return next(new ErrorResponse('Not authorized to view tasks for this project', 403));
  }

  const tasks = await Task.find({ 
    project: req.params.projectId,
    tenantId: req.tenantId
  })
    .populate('assignee', 'name email avatar')
    .populate('assignees', 'name email avatar')
    .populate('assignedBy', 'name email avatar')
    .sort('position');

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// Get single task
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  })
    .populate('assignee', 'name email avatar')
    .populate('assignees', 'name email avatar')
    .populate('assignedBy', 'name email avatar')
    .populate('project', 'name')
    .populate('comments.user', 'name email avatar');

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  // Check access to the task via its project
  const project = await Project.findOne({ _id: task.project, tenantId: req.tenantId }).select('owner members team');
  if (!project) return next(new ErrorResponse('Project not found', 404));

  const userId = req.user && (req.user._id || req.user.id);

  const isProjectOwner = project.owner && project.owner.equals && project.owner.equals(userId);
  const isProjectMember = Array.isArray(project.members) && project.members.some(m => m.user && m.user.equals && m.user.equals(userId));
  let isOnTeam = false;
  if (project.team) {
    const teamCheck = await Team.findOne({
      _id: project.team,
      tenantId: req.tenantId,
      $or: [ { owner: userId }, { 'members.user': userId } ]
    }).select('_id');
    isOnTeam = Boolean(teamCheck);
  }

  if (!isProjectOwner && !isProjectMember && !isOnTeam) {
    return next(new ErrorResponse('Not authorized to view this task', 403));
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// Get all tasks (for all projects the user has access to)
exports.getAllTasks = asyncHandler(async (req, res, next) => {
  const userId = req.user && (req.user._id || req.user.id);

  // Find teams the user currently belongs to
  const userTeams = await Team.find({
    tenantId: req.tenantId,
    $or: [ { owner: userId }, { 'members.user': userId } ]
  }).select('_id');
  const userTeamIds = userTeams.map(t => t._id);

  const projects = await Project.find({
    tenantId: req.tenantId,
    $or: [
      { owner: userId },
      { 'members.user': userId },
      ...(userTeamIds.length > 0 ? [{ team: { $in: userTeamIds } }] : [])
    ]
  }).select('_id');

  const projectIds = projects.map(p => p._id);

  const tasks = await Task.find({ 
    project: { $in: projectIds },
    tenantId: req.tenantId
  })
    .populate('assignee', 'name email avatar')
    .populate('assignees', 'name email avatar')
    .populate('assignedBy', 'name email avatar')
    .populate({
      path: 'project',
      select: '_id name team owner members',
      populate: [
        { path: 'owner', select: '_id name email avatar' },
        { path: 'members.user', select: '_id name email avatar' },
        { path: 'team', select: '_id name owner members', 
          populate: [
            { path: 'owner', select: '_id name email avatar' },
            { path: 'members.user', select: '_id name email avatar' }
          ]
        }
      ]
    })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// Create new task
exports.createTask = asyncHandler(async (req, res, next) => {
  req.body.assignedBy = req.user.id;
  req.body.tenantId = req.tenantId;

  // Multi-assignee support: if a primary assignee is provided, also store it in assignees[].
  if (req.body.assignee && !Array.isArray(req.body.assignees)) {
    req.body.assignees = [req.body.assignee];
  }
  if (req.body.assignee && Array.isArray(req.body.assignees)) {
    const hasPrimary = req.body.assignees.some((id) => String(id) === String(req.body.assignee));
    if (!hasPrimary) req.body.assignees.push(req.body.assignee);
  }

  // Check if project exists and user has access
  const project = await Project.findOne({
    _id: req.body.project,
    tenantId: req.tenantId
  });
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  const task = await Task.create(req.body);

  // Create activity
  await Activity.create({
    type: 'task_created',
    description: `${req.user.name} created task "${task.title}"`,
    user: req.user.id,
    project: project._id,
    task: task._id,
    tenantId: req.tenantId
  });

  // Create notification if task is assigned
  if (task.assignee && !task.assignee.equals(req.user.id)) {
    await Notification.create({
      recipient: task.assignee,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${req.user.name} assigned you a new task: ${task.title}`,
      link: `/tasks/${task._id}`,
      relatedProject: project._id,
      relatedTask: task._id
    });
  }

  // Emit socket event
  if (req.io) {
    req.io.to(`project-${project._id}`).emit('task-created', {
      task,
      user: req.user
    });
  }

  res.status(201).json({
    success: true,
    data: task
  });
});

// Update task
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  const isManagerOrAdmin = req.user?.role === 'manager' || req.user?.role === 'admin';
  const isPrimaryAssignee = Boolean(task.assignee && task.assignee.equals(req.user.id));
  const isAdditionalAssignee =
    Array.isArray(task.assignees) && task.assignees.some((assigneeId) => assigneeId && assigneeId.equals && assigneeId.equals(req.user.id));

  // Users cannot edit tasks (title/description/priority/etc) or reassign.
  // Allow non-manager users to update only their assigned task status.
  if (!isManagerOrAdmin) {
    const allowedKeys = new Set(['status']);
    const bodyKeys = Object.keys(req.body || {});
    const onlyAllowed = bodyKeys.every((key) => allowedKeys.has(key));

    if (!isPrimaryAssignee && !isAdditionalAssignee) {
      return next(new ErrorResponse('Not authorized to update this task', 403));
    }

    if (!onlyAllowed) {
      return next(new ErrorResponse('Only managers can edit tasks', 403));
    }
  }

  const hasAssigneeField = Object.prototype.hasOwnProperty.call(req.body || {}, 'assignee');
  const hasAssigneesField = Object.prototype.hasOwnProperty.call(req.body || {}, 'assignees');
  const isAssignmentChange = hasAssigneeField || hasAssigneesField;

  const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    try {
      return new mongoose.Types.ObjectId(value);
    } catch {
      return null;
    }
  };

  const uniqueObjectIds = (values) => {
    const unique = new Map();
    for (const value of values) {
      const objId = toObjectId(value);
      if (!objId) continue;
      unique.set(objId.toString(), objId);
    }
    return Array.from(unique.values());
  };

  const ensureAssignable = async (project, userId) => {
    const isProjectOwner = project.owner && project.owner.equals && project.owner.equals(userId);
    const isProjectMember = Array.isArray(project.members) && project.members.some((member) => member.user && member.user.equals && member.user.equals(userId));
    if (isProjectOwner || isProjectMember) return true;

    if (!project.team) return false;

    const team = await Team.findOne({
      _id: project.team,
      tenantId: req.tenantId
    }).select('members owner');

    const isTeamOwner = Boolean(team?.owner && team.owner.equals && team.owner.equals(userId));
    const isTeamMember = Array.isArray(team?.members) && team.members.some((member) => member.user && member.user.equals && member.user.equals(userId));
    return isTeamOwner || isTeamMember;
  };

  if (isAssignmentChange) {
    if (req.user?.role !== 'manager') {
      return next(new ErrorResponse('Only managers can assign tasks', 403));
    }

    const project = await Project.findOne({
      _id: task.project,
      tenantId: req.tenantId
    }).select('owner members team');

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Normalize empty/unassign values.
    if (hasAssigneeField && (req.body.assignee === '' || req.body.assignee === null)) {
      req.body.assignee = undefined;
    }

    const normalizedPrimary = hasAssigneeField ? toObjectId(req.body.assignee) : null;
    if (hasAssigneeField) {
      if (normalizedPrimary) {
        const ok = await ensureAssignable(project, normalizedPrimary);
        if (!ok) return next(new ErrorResponse('Assignee must be a member of the project', 400));
        // Normalize incoming assignee to an ID string so notifications receive an ID
        req.body.assignee = normalizedPrimary.toString();
      } else {
        // If the client sent a full user object, try to extract its id
        if (req.body.assignee && typeof req.body.assignee === 'object') {
          const candidateId = req.body.assignee._id || req.body.assignee.id;
          req.body.assignee = candidateId ? String(candidateId) : undefined;
        }
      }
    }

    // Start from current list, then apply updates.
    let nextAssignees = Array.isArray(task.assignees) ? [...task.assignees] : [];

    if (hasAssigneesField) {
      const raw = Array.isArray(req.body.assignees) ? req.body.assignees : [];
      nextAssignees = uniqueObjectIds(raw);
      for (const assigneeId of nextAssignees) {
        const ok = await ensureAssignable(project, assigneeId);
        if (!ok) return next(new ErrorResponse('Assignee must be a member of the project', 400));
      }
    }

    if (hasAssigneeField) {
      if (normalizedPrimary) {
        nextAssignees = uniqueObjectIds([...nextAssignees, normalizedPrimary]);
      } else if (req.body.assignee === undefined) {
        // Explicit unassign clears all assignees.
        nextAssignees = [];
      }
    }

    // Keep assignee consistent with assignees[].
    const currentPrimary = toObjectId(task.assignee);
    const primaryStillPresent = currentPrimary && nextAssignees.some((id) => id.toString() === currentPrimary.toString());
    if (!hasAssigneeField) {
      req.body.assignee = primaryStillPresent ? currentPrimary : (nextAssignees[0] || undefined);
    }

    req.body.assignees = nextAssignees;
    req.body.assignedBy = req.user.id;
  } else {
    // Prevent clients from tampering with assignedBy / assignees directly.
    delete req.body.assignedBy;
    delete req.body.assignees;
  }

  // Track changes for notifications
  const previousAssignee = task.assignee;
  const previousAssignees = Array.isArray(task.assignees) ? task.assignees.map((id) => id.toString()) : [];
  const previousStatus = task.status;

  task = await Task.findOneAndUpdate({
    _id: req.params.id,
    tenantId: req.tenantId
  }, req.body, {
    new: true,
    runValidators: true
  }).populate('assignee', 'name email avatar')
   .populate('assignees', 'name email avatar')
   .populate('assignedBy', 'name email avatar');

  // Create activity
  await Activity.create({
    type: 'task_updated',
    description: `${req.user.name} updated task "${task.title}"`,
    user: req.user.id,
    tenantId: req.tenantId,
    project: task.project,
    task: task._id,
    metadata: { changes: req.body }
  });

  // Handle notifications
  const reqAssigneeId = req.body.assignee ? String(req.body.assignee) : null;
  if (reqAssigneeId && reqAssigneeId !== previousAssignee?.toString()) {
    // Notify new assignee
    if (reqAssigneeId && reqAssigneeId !== String(req.user.id)) {
      await Notification.create({
        recipient: reqAssigneeId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you to task: ${task.title}`,
        link: `/tasks/${task._id}`,
        relatedProject: task.project,
        relatedTask: task._id
      });
    }
  }

  // Notify newly added assignees (multi-assign support)
  if (hasAssigneesField && Array.isArray(task.assignees)) {
    const nextIds = task.assignees
      .map((a) => {
        if (!a) return null;
        if (typeof a === 'string') return a;
        if (a._id) return a._id.toString();
        if (a.id) return a.id.toString();
        if (typeof a.toString === 'function') return a.toString();
        return null;
      })
      .filter(Boolean);

    const added = nextIds.filter((id) => !previousAssignees.includes(id));

    for (const addedUserId of added) {
      if (addedUserId === String(req.user.id)) continue;
      await Notification.create({
        recipient: addedUserId,
        type: 'task_assigned',
        title: 'Task Updated',
        message: `${req.user.name} added you to task: ${task.title}`,
        link: `/tasks/${task._id}`,
        relatedProject: task.project,
        relatedTask: task._id
      });
    }
  }

  // If task was completed, create notification
  if (req.body.status === 'done' && previousStatus !== 'done') {
    await Activity.create({
      type: 'task_completed',
      description: `${req.user.name} completed task "${task.title}"`,
      user: req.user.id,
      tenantId: req.tenantId,
      project: task.project,
      task: task._id
    });

    // Update project progress
    const project = await Project.findById(task.project);
    project.progress = await project.calculateProgress();
    await project.save();
  }

  // Emit socket event (guard when socket not available)
  if (req.io && typeof req.io.to === 'function') {
    req.io.to(`project-${task.project}`).emit('task-updated', {
      task,
      user: req.user
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// Delete task
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const isManagerOrAdmin = req.user?.role === 'manager' || req.user?.role === 'admin';
  if (!isManagerOrAdmin) {
    return next(new ErrorResponse('Only managers can delete tasks', 403));
  }

  const task = await Task.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  // Delete the task using the model to avoid calling instance methods that
  // might not exist on plain objects in some environments.
  const deletedTask = await Task.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  // Emit socket event if socket support is available
  if (req.io && typeof req.io.to === 'function') {
    const projectId = deletedTask?.project || task.project;
    req.io.to(`project-${projectId}`).emit('task-deleted', {
      taskId: deletedTask?._id || task._id,
      projectId,
      user: req.user
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Add comment to task
exports.addComment = asyncHandler(async (req, res, next) => {
  const task = await Task.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!task) {
    return next(new ErrorResponse(`Task not found with id of ${req.params.id}`, 404));
  }

  const isPrimaryAssignee = Boolean(task.assignee && task.assignee.equals(req.user.id));
  const isAdditionalAssignee =
    Array.isArray(task.assignees) && task.assignees.some((assigneeId) => assigneeId && assigneeId.equals && assigneeId.equals(req.user.id));

  const isManager = req.user?.role === 'manager' || req.user?.role === 'admin';

  if (!isPrimaryAssignee && !isAdditionalAssignee && !isManager) {
    return next(new ErrorResponse('Only assigned users or managers can comment on this task', 403));
  }

  if (!req.body?.text || !String(req.body.text).trim()) {
    return next(new ErrorResponse('Comment text is required', 400));
  }

  const comment = {
    user: req.user.id,
    text: String(req.body.text).trim(),
    createdAt: Date.now()
  };

  task.comments.push(comment);
  await task.save();

  // Create activity
  await Activity.create({
    type: 'comment_added',
    description: `${req.user.name} commented on task "${task.title}"`,
    user: req.user.id,
    tenantId: req.tenantId,
    project: task.project,
    task: task._id,
    metadata: { comment: req.body.text }
  });

  // Re-fetch task with populated relations so frontend can update comments without a full refetch
  const populatedTask = await Task.findOne({ _id: task._id, tenantId: req.tenantId })
    .populate('assignee', 'name email avatar')
    .populate('assignees', 'name email avatar')
    .populate('assignedBy', 'name email avatar')
    .populate('project', 'name')
    .populate('comments.user', 'name email avatar');

  // Emit socket event when socket support is available
  if (req.io && typeof req.io.to === 'function') {
    const projectId = populatedTask.project?._id || populatedTask.project;
    req.io.to(`project-${projectId}`).emit('comment-added', {
      task: populatedTask,
      comment,
      user: req.user
    });
  }

  res.status(200).json({
    success: true,
    data: populatedTask
  });
});

// Reorder tasks (drag and drop)
exports.reorderTasks = asyncHandler(async (req, res, next) => {
  const { taskId, newPosition, newStatus } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Update task position and status
  task.position = newPosition;
  if (newStatus) {
    task.status = newStatus;
  }
  await task.save();

  // Update positions of other tasks
  const tasksToReorder = await Task.find({
    project: task.project,
    status: task.status,
    _id: { $ne: taskId }
  }).sort('position');

  let position = 0;
  for (const t of tasksToReorder) {
    if (position === newPosition) position++;
    t.position = position;
    await t.save();
    position++;
  }

  // Emit socket event (guard when socket not available)
  if (req.io && typeof req.io.to === 'function') {
    req.io.to(`project-${task.project}`).emit('tasks-reordered', {
      projectId: task.project,
      taskId,
      newPosition,
      newStatus
    });
  }

  res.status(200).json({
    success: true,
    data: { message: 'Tasks reordered successfully' }
  });
});

