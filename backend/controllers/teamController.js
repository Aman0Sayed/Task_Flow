// controllers/teamController.js
const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const TeamInvitation = require('../models/TeamInvitation');
const Notification = require('../models/Notification');
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

// Get all teams (for browsing and joining)
exports.getAllTeams = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const currentUserId = req.user._id || req.user.id;

  // Exclude teams already owned/joined by the current user.
  const allTeams = await Team.find({
    owner: { $ne: currentUserId },
    members: { $not: { $elemMatch: { user: currentUserId } } }
  })
    .populate('owner', 'name email avatar companyName')
    .populate('members.user', 'name email avatar')
    .select('name description owner members createdAt tenantId')
    .sort('-createdAt');

  // Ignore orphaned teams with deleted owners.
  const validTeams = allTeams.filter(team => team.owner);

  // Keep teams visible even when a join request is pending; UI can show disabled action.
  const pendingRequests = await TeamInvitation.find({
    invitedUser: req.user.id,
    status: 'pending',
    $expr: { $eq: ['$invitedBy', '$invitedUser'] },
    ...(validTeams.length > 0 ? { team: { $in: validTeams.map(team => team._id) } } : {})
  }).select('team');

  const pendingTeamIds = new Set(pendingRequests.map(r => r.team.toString()));

  const teams = validTeams.map(team => ({
    ...team.toObject(),
    hasPendingRequest: pendingTeamIds.has(team._id.toString())
  }));

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

// Rename team (owner/manager only)
exports.renameTeam = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const trimmedName = (name || '').trim();

  if (!trimmedName) {
    return next(new ErrorResponse('Team name is required', 400));
  }

  let team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  if (!team.owner.equals(req.user.id)) {
    return next(new ErrorResponse('Only team owner can rename the team', 403));
  }

  team.name = trimmedName;
  await team.save();

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

  const affectedMemberIds = team.members
    .map(member => member.user?.toString())
    .filter(memberId => memberId && memberId !== req.user.id.toString());

  if (affectedMemberIds.length > 0) {
    await Notification.insertMany(
      affectedMemberIds.map((memberId) => ({
        recipient: memberId,
        tenantId: req.tenantId,
        type: 'team_deleted',
        title: 'Team Deleted',
        message: `The team "${team.name}" was deleted by the manager.`,
        link: '/team',
        relatedTeam: team._id
      }))
    );
  }

  // Remove team from all users
  await User.updateMany(
    { teams: team._id },
    { $pull: { teams: team._id } }
  );

  // Remove team-bound join/invitation records
  await TeamInvitation.deleteMany({ team: team._id });

  await team.deleteOne();

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
  const { userId, role } = req.body;

  if (!userId) {
    return next(new ErrorResponse('User ID is required', 400));
  }

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

  const invitedUser = await User.findById(userId).select('_id');
  if (!invitedUser) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check if already a member
  const isMember = team.members.some(member => member.user.equals(userId));

  if (isMember) {
    return next(new ErrorResponse('User is already a member', 400));
  }

  const existingPending = await TeamInvitation.findOne({
    team: team._id,
    invitedUser: userId,
    status: 'pending'
  });

  if (existingPending) {
    const isJoinRequest = existingPending.invitedBy.toString() === existingPending.invitedUser.toString();
    if (isJoinRequest) {
      return next(new ErrorResponse('This user already has a pending join request for this team', 400));
    }

    // Re-send pending invitation instead of blocking manager action.
    existingPending.invitedBy = req.user.id;
    existingPending.role = role || existingPending.role || 'member';
    existingPending.invitedAt = new Date();
    await existingPending.save();

    await Notification.create({
      recipient: userId,
      tenantId: team.tenantId,
      type: 'team_invitation',
      title: 'Team Invitation',
      message: `${req.user.name} invited you to join "${team.name}".`,
      link: '/team',
      relatedTeam: team._id,
      joinRequest: existingPending._id
    });

    return res.status(200).json({
      success: true,
      message: 'Invitation already pending. Notification sent again.',
      data: existingPending
    });
  }

  const invitation = await TeamInvitation.create({
    team: team._id,
    invitedUser: userId,
    invitedBy: req.user.id,
    role: role || 'member',
    tenantId: team.tenantId,
    status: 'pending'
  });

  await Notification.create({
    recipient: userId,
    tenantId: team.tenantId,
    type: 'team_invitation',
    title: 'Team Invitation',
    message: `${req.user.name} invited you to join "${team.name}".`,
    link: '/team',
    relatedTeam: team._id,
    joinRequest: invitation._id
  });

  res.status(200).json({
    success: true,
    message: 'Team invitation sent successfully',
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

  // Restrict kicking to team owner (manager flow).
  if (!team.owner.equals(req.user.id)) {
    return next(new ErrorResponse('Only team owner can remove members', 403));
  }

  if (team.owner.equals(req.params.userId)) {
    return next(new ErrorResponse('Team owner cannot be removed', 400));
  }

  const isTargetMember = team.members.some(member => member.user.equals(req.params.userId));
  if (!isTargetMember) {
    return next(new ErrorResponse('Member not found in team', 404));
  }

  // Remove member
  team.members = team.members.filter(member => !member.user.equals(req.params.userId));
  await team.save();

  // Remove team from user
  await User.findByIdAndUpdate(req.params.userId, {
    $pull: { teams: team._id }
  });

  // Clear stale pending invites for this team/user so manager can invite again later.
  const stalePendingInvites = await TeamInvitation.find({
    team: team._id,
    invitedUser: req.params.userId,
    status: 'pending'
  }).select('_id');

  const stalePendingInviteIds = stalePendingInvites.map((inv) => inv._id);
  if (stalePendingInviteIds.length > 0) {
    await TeamInvitation.deleteMany({
      _id: { $in: stalePendingInviteIds }
    });
  }

  await Notification.deleteMany({
    recipient: req.params.userId,
    type: 'team_invitation',
    $or: [
      { relatedTeam: team._id },
      ...(stalePendingInviteIds.length > 0 ? [{ joinRequest: { $in: stalePendingInviteIds } }] : [])
    ]
  });

  await Notification.create({
    recipient: req.params.userId,
    tenantId: team.tenantId,
    type: 'team_member_kicked',
    title: 'Removed From Team',
    message: 'You have been removed from the team.',
    link: '/team',
    relatedTeam: team._id
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
    status: 'pending'
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
    status: 'pending'
  });

  if (!invitation) {
    return next(new ErrorResponse('Invitation not found', 404));
  }

  // Update invitation status
  invitation.status = 'accepted';
  invitation.respondedAt = new Date();
  await invitation.save();

  // If there are duplicate pending invites for the same team/user, close them as well.
  const duplicatePendingInvites = await TeamInvitation.find({
    team: invitation.team,
    invitedUser: req.user.id,
    status: 'pending',
    _id: { $ne: invitation._id }
  }).select('_id');
  const duplicatePendingInviteIds = duplicatePendingInvites.map((inv) => inv._id);
  if (duplicatePendingInviteIds.length > 0) {
    await TeamInvitation.updateMany(
      { _id: { $in: duplicatePendingInviteIds } },
      { $set: { status: 'accepted', respondedAt: new Date() } }
    );
  }

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

    // Add team to user and update tenant/company details.
    const teamOwner = await User.findById(team.owner).select('companyName');
    const userUpdate = {
      $push: { teams: team._id },
      tenantId: team.tenantId
    };
    if (teamOwner?.companyName) {
      userUpdate.companyName = teamOwner.companyName;
    }
    await User.findByIdAndUpdate(req.user.id, userUpdate);

    // Create notification for the inviter that the invitation was accepted
    const currentUser = await User.findById(req.user.id).select('name');
    await Notification.create({
      recipient: invitation.invitedBy,
      tenantId: team.tenantId,
      type: 'team_join_accepted',
      title: 'Invitation Accepted',
      message: `${currentUser.name} has accepted your invitation to join the team "${team.name}".`,
      link: '/team',
      relatedTeam: team._id
    });
  }

  await Notification.deleteMany({
    recipient: req.user.id,
    type: 'team_invitation',
    joinRequest: {
      $in: [invitation._id, ...duplicatePendingInviteIds]
    }
  });

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
    status: 'pending'
  });

  if (!invitation) {
    return next(new ErrorResponse('Invitation not found', 404));
  }

  // Update invitation status
  invitation.status = 'rejected';
  invitation.respondedAt = new Date();
  await invitation.save();

  // If there are duplicate pending invites for the same team/user, close them as well.
  const duplicatePendingInvites = await TeamInvitation.find({
    team: invitation.team,
    invitedUser: req.user.id,
    status: 'pending',
    _id: { $ne: invitation._id }
  }).select('_id');
  const duplicatePendingInviteIds = duplicatePendingInvites.map((inv) => inv._id);
  if (duplicatePendingInviteIds.length > 0) {
    await TeamInvitation.updateMany(
      { _id: { $in: duplicatePendingInviteIds } },
      { $set: { status: 'rejected', respondedAt: new Date() } }
    );
  }

  // Create notification for the inviter that the invitation was rejected
  const currentUser = await User.findById(req.user.id).select('name');
  const team = await Team.findById(invitation.team).select('name tenantId');
  const teamName = team?.name || 'the team';
  await Notification.create({
    recipient: invitation.invitedBy,
    tenantId: team?.tenantId,
    type: 'team_join_rejected',
    title: 'Invitation Rejected',
    message: `${currentUser.name} has declined your invitation to join "${teamName}".`,
    link: '/team',
    relatedTeam: invitation.team
  });

  await Notification.deleteMany({
    recipient: req.user.id,
    type: 'team_invitation',
    joinRequest: {
      $in: [invitation._id, ...duplicatePendingInviteIds]
    }
  });

  res.status(200).json({
    success: true,
    data: invitation
  });
});

// Request to join team (creates notification for managers)
exports.requestJoinTeam = asyncHandler(async (req, res, next) => {
  console.log('requestJoinTeam: User:', req.user.id, 'Team:', req.params.id);
  
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  if (!team) {
    console.log('requestJoinTeam: Team not found');
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  console.log('requestJoinTeam: Team found, owner:', team.owner._id, 'members:', team.members.length);

  // Check if user is already a member
  const isMember = team.members.some(member => member.user && member.user._id.equals(req.user.id));
  console.log('requestJoinTeam: isMember:', isMember);
  if (isMember) {
    console.log('requestJoinTeam: User is already a member');
    return next(new ErrorResponse('You are already a member of this team', 400));
  }

  // Check if there's already a pending request (we'll use TeamInvitation with a special status)
  // const existingRequest = await TeamInvitation.findOne({
  //   team: req.params.id,
  //   invitedUser: req.user.id,
  //   status: 'pending',
  //   invitedBy: req.user.id // Self-invitation indicates a join request
  // });
  
  // console.log('requestJoinTeam: existingRequest:', !!existingRequest);
  // if (existingRequest) {
  //   console.log('requestJoinTeam: Already has pending request');
  //   return next(new ErrorResponse('You already have a pending join request for this team', 400));
  // }

  console.log('requestJoinTeam: Creating join request');
  const joinRequest = await TeamInvitation.create({
    team: req.params.id,
    invitedUser: req.user.id,
    invitedBy: req.user.id, // Self-invitation
    role: 'member', // Default role
    tenantId: team.tenantId, // Use team's tenant
    status: 'pending'
  });

  // Create notifications for team managers (owner and admins)
  const Notification = require('../models/Notification');
  const toUserId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value._id) return value._id.toString();
    if (typeof value.toString === 'function') return value.toString();
    return null;
  };

  const managerIds = [toUserId(team.owner)];

  // Add admin and lead members
  team.members.forEach(member => {
    if (member.role === 'admin' || member.role === 'lead') {
      managerIds.push(toUserId(member.user));
    }
  });

  // Remove duplicates
  const uniqueManagerIds = [...new Set(managerIds.filter(Boolean))];

  // Create notifications for each manager
  const notifications = uniqueManagerIds.map(managerId => ({
    recipient: managerId,
    tenantId: team.tenantId, // Use team's tenant
    type: 'team_join_request',
    title: 'Team Join Request',
    message: `${req.user.name} has requested to join ${team.name}`,
    link: `/teams/${team._id}`,
    relatedTeam: team._id,
    requestingUser: req.user.id,
    joinRequest: joinRequest._id
  }));

  await Notification.insertMany(notifications);

  res.status(200).json({
    success: true,
    message: 'Join request sent successfully',
    data: joinRequest
  });
});

// Get join requests for team managers
exports.getJoinRequests = asyncHandler(async (req, res, next) => {
  const team = await Team.findOne({
    _id: req.params.id,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse(`Team not found with id of ${req.params.id}`, 404));
  }

  // Check if user is authorized to view requests (owner or admin/lead)
  const isAuthorized = team.owner.equals(req.user.id) ||
                      team.members.some(m => m.user.equals(req.user.id) &&
                      (m.role === 'admin' || m.role === 'lead'));

  if (!isAuthorized) {
    return next(new ErrorResponse('Not authorized to view join requests', 403));
  }

  // Get pending join requests (where invitedBy equals invitedUser - self requests)
  const joinRequests = await TeamInvitation.find({
    team: req.params.id,
    status: 'pending',
    $expr: { $eq: ['$invitedBy', '$invitedUser'] } // Self-invitations
  })
  .populate('invitedUser', 'name email avatar')
  .populate('invitedBy', 'name email')
  .sort('-invitedAt');

  res.status(200).json({
    success: true,
    count: joinRequests.length,
    data: joinRequests
  });
});

// Accept join request
exports.acceptJoinRequest = asyncHandler(async (req, res, next) => {
  const joinRequest = await TeamInvitation.findById(req.params.requestId);

  if (!joinRequest) {
    return next(new ErrorResponse('Join request not found', 404));
  }

  // Join requests are self-invitations (invitedBy === invitedUser)
  if (joinRequest.invitedBy.toString() !== joinRequest.invitedUser.toString()) {
    return next(new ErrorResponse('Join request not found', 404));
  }

  const team = await Team.findOne({
    _id: joinRequest.team,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse('Team not found', 404));
  }

  // Check authorization
  const isAuthorized = team.owner.equals(req.user.id) ||
                      team.members.some(m => m.user.equals(req.user.id) &&
                      (m.role === 'admin' || m.role === 'lead'));

  if (!isAuthorized) {
    return next(new ErrorResponse('Not authorized to accept join requests', 403));
  }

  const Notification = require('../models/Notification');

  // Idempotent response: request already handled earlier.
  if (joinRequest.status !== 'pending') {
    await Notification.deleteMany({
      type: 'team_join_request',
      joinRequest: joinRequest._id
    });

    return res.status(200).json({
      success: true,
      message: `Join request already ${joinRequest.status}`,
      data: joinRequest
    });
  }

  // Update request status
  joinRequest.status = 'accepted';
  joinRequest.respondedAt = new Date();
  await joinRequest.save();

  // Add user to team
  const isMember = team.members.some(member => member.user.equals(joinRequest.invitedUser));
  if (!isMember) {
    team.members.push({
      user: joinRequest.invitedUser,
      role: joinRequest.role
    });
    await team.save();
  }

  // Add team to user and update tenant/company details.
  const teamOwner = await User.findById(team.owner).select('companyName');
  const userUpdate = {
    $push: { teams: team._id },
    tenantId: team.tenantId
  };
  if (teamOwner?.companyName) {
    userUpdate.companyName = teamOwner.companyName;
  }
  await User.findByIdAndUpdate(joinRequest.invitedUser, userUpdate);

  // Create notification for the requesting user
  await Notification.create({
    recipient: joinRequest.invitedUser,
    type: 'team_join_accepted',
    title: 'Join Request Accepted',
    message: `Your request to join ${team.name} has been accepted`,
    link: `/teams/${team._id}`,
    relatedTeam: team._id
  });

  // Remove manager-side pending join request notifications once handled.
  await Notification.deleteMany({
    type: 'team_join_request',
    joinRequest: joinRequest._id
  });

  res.status(200).json({
    success: true,
    message: 'Join request accepted',
    data: joinRequest
  });
});

// Reject join request
exports.rejectJoinRequest = asyncHandler(async (req, res, next) => {
  const joinRequest = await TeamInvitation.findById(req.params.requestId);

  if (!joinRequest) {
    return next(new ErrorResponse('Join request not found', 404));
  }

  // Join requests are self-invitations (invitedBy === invitedUser)
  if (joinRequest.invitedBy.toString() !== joinRequest.invitedUser.toString()) {
    return next(new ErrorResponse('Join request not found', 404));
  }

  const team = await Team.findOne({
    _id: joinRequest.team,
    tenantId: req.tenantId
  });

  if (!team) {
    return next(new ErrorResponse('Team not found', 404));
  }

  // Check authorization
  const isAuthorized = team.owner.equals(req.user.id) ||
                      team.members.some(m => m.user.equals(req.user.id) &&
                      (m.role === 'admin' || m.role === 'lead'));

  if (!isAuthorized) {
    return next(new ErrorResponse('Not authorized to reject join requests', 403));
  }

  const Notification = require('../models/Notification');

  // Idempotent response: request already handled earlier.
  if (joinRequest.status !== 'pending') {
    await Notification.deleteMany({
      type: 'team_join_request',
      joinRequest: joinRequest._id
    });

    return res.status(200).json({
      success: true,
      message: `Join request already ${joinRequest.status}`,
      data: joinRequest
    });
  }

  // Update request status
  joinRequest.status = 'rejected';
  joinRequest.respondedAt = new Date();
  await joinRequest.save();

  // Create notification for the requesting user
  await Notification.create({
    recipient: joinRequest.invitedUser,
    type: 'team_join_rejected',
    title: 'Join Request Rejected',
    message: `Your request to join ${team.name} has been rejected`,
    link: `/teams/${team._id}`,
    relatedTeam: team._id
  });

  // Remove manager-side pending join request notifications once handled.
  await Notification.deleteMany({
    type: 'team_join_request',
    joinRequest: joinRequest._id
  });

  res.status(200).json({
    success: true,
    message: 'Join request rejected',
    data: joinRequest
  });
});

