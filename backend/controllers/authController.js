// controllers/authController.js
const User = require('../models/User');
const Team = require('../models/Team');
const TeamInvitation = require('../models/TeamInvitation');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');

// Generate unique tenant ID
const generateTenantId = () => {
  return crypto.randomBytes(12).toString('hex');
};

// Generate unique TaskFlow ID (like social media username)
const generateTaskflowId = async (name) => {
  const baseId = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 20);

  let taskflowId = baseId;
  let counter = 1;

  while (await User.findOne({ taskflowId })) {
    const suffix = Math.floor(Math.random() * 10000);
    taskflowId = `${baseId}_${suffix}`;
    counter++;
    if (counter > 10) {
      taskflowId = `user_${crypto.randomBytes(6).toString('hex')}`;
      break;
    }
  }

  return taskflowId;
};

// Register user
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'user', companyName } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();
  const normalizedCompanyName = (companyName || '').trim();
  const isEmailLike = (value) => /^\S+@\S+\.\S+$/.test(value);

  const taskflowId = await generateTaskflowId(name);

  let tenantId;
  if (role === 'manager') {
    if (!normalizedCompanyName) {
      return next(new ErrorResponse('Company name is required for managers', 400));
    }

    if (
      normalizedCompanyName.toLowerCase() === normalizedEmail ||
      isEmailLike(normalizedCompanyName)
    ) {
      return next(new ErrorResponse('Enter a valid company name (not an email address)', 400));
    }

    tenantId = crypto
      .createHash('sha256')
      .update(normalizedCompanyName.toLowerCase())
      .digest('hex')
      .substring(0, 24);

    console.log(`Manager ${taskflowId} tenantId ${tenantId} (company: ${normalizedCompanyName})`);
  } else {
    // Regular users don't need company name - put them in the default global tenant
    tenantId = 'default_user_tenant';
    console.log(`User ${taskflowId} tenantId ${tenantId} (global user)`);
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    tenantId,
    taskflowId,
    companyName: role === 'manager' ? normalizedCompanyName : null
  });

  sendTokenResponse(user, 201, res);
});

// Login user
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide an email', 400));
  }

  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (password && user.role !== 'user') {
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
  }

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

// Delete own account permanently
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const ownedTeams = await Team.find({
    owner: user._id,
    tenantId: user.tenantId
  }).select('_id name members');

  const ownedTeamIds = ownedTeams.map(team => team._id);
  const affectedMembers = [];
  const notificationsToCreate = [];

  ownedTeams.forEach((team) => {
    team.members.forEach((member) => {
      const memberId = member.user?.toString();
      if (memberId && memberId !== user._id.toString()) {
        affectedMembers.push(memberId);
        notificationsToCreate.push({
          recipient: memberId,
          tenantId: user.tenantId,
          type: 'manager_account_deleted',
          title: 'Manager Account Deleted',
          message: 'Your manager deleted their account. Your team was removed.',
          link: '/team',
          relatedTeam: team._id
        });
      }
    });
  });

  if (notificationsToCreate.length > 0) {
    await Notification.insertMany(notificationsToCreate);
  }

  if (ownedTeamIds.length > 0) {
    await User.updateMany(
      { _id: { $in: [...new Set(affectedMembers)] } },
      {
        $pull: { teams: { $in: ownedTeamIds } },
        $set: { companyName: null }
      }
    );

    await TeamInvitation.deleteMany({ team: { $in: ownedTeamIds } });
    await Team.deleteMany({ _id: { $in: ownedTeamIds } });
  }

  // Remove user from teams where they are only a member.
  await Team.updateMany(
    { 'members.user': user._id },
    { $pull: { members: { user: user._id } } }
  );

  await TeamInvitation.deleteMany({
    $or: [{ invitedUser: user._id }, { invitedBy: user._id }]
  });

  await Notification.deleteMany({
    $or: [{ recipient: user._id }, { requestingUser: user._id }]
  });

  await User.deleteOne({ _id: user._id });

  res.status(200).json({
    success: true,
    message: 'Account deleted permanently'
  });
});

// Delete company (owner only)
exports.deleteCompany = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role !== 'manager' && user.role !== 'admin') {
    return next(new ErrorResponse('Only company owner can delete company', 403));
  }

  const ownedTeams = await Team.find({
    owner: user._id,
    tenantId: user.tenantId
  }).select('_id name members');

  const ownedTeamIds = ownedTeams.map(team => team._id);
  const affectedMembers = [];
  const notificationsToCreate = [];

  ownedTeams.forEach((team) => {
    team.members.forEach((member) => {
      const memberId = member.user?.toString();
      if (memberId && memberId !== user._id.toString()) {
        affectedMembers.push(memberId);
        notificationsToCreate.push({
          recipient: memberId,
          tenantId: user.tenantId,
          type: 'team_deleted',
          title: 'Company Deleted',
          message: 'Your company owner deleted the company. Your team was removed.',
          link: '/team',
          relatedTeam: team._id
        });
      }
    });
  });

  if (notificationsToCreate.length > 0) {
    await Notification.insertMany(notificationsToCreate);
  }

  if (ownedTeamIds.length > 0) {
    await User.updateMany(
      { _id: { $in: [...new Set(affectedMembers)] } },
      {
        $pull: { teams: { $in: ownedTeamIds } },
        $set: { companyName: null }
      }
    );

    await TeamInvitation.deleteMany({ team: { $in: ownedTeamIds } });
    await Team.deleteMany({ _id: { $in: ownedTeamIds } });
  }

  user.companyName = null;
  user.teams = (user.teams || []).filter(teamId =>
    !ownedTeamIds.some(ownedId => ownedId.toString() === teamId.toString())
  );
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Company deleted successfully'
  });
});

// Get token from model and send response
const sendTokenResponse = (user, statusCode, res) => {
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
        companyName: user.companyName,
        tenantId: user.tenantId,
        taskflowId: user.taskflowId,
        preferences: user.preferences
      }
    });
};
