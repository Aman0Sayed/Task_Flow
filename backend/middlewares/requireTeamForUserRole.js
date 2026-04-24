const Team = require('../models/Team');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * For role `user` (member role), require at least one current team membership.
 * Managers/admins can still use the app without being on a team.
 */
module.exports = asyncHandler(async (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role !== 'user') return next();

  const userId = req.user && (req.user._id || req.user.id);
  if (!userId) {
    return next(new ErrorResponse('Not authenticated', 401));
  }

  const hasTeam = await Team.exists({
    tenantId: req.tenantId,
    $or: [{ owner: userId }, { 'members.user': userId }],
  });

  if (!hasTeam) {
    return next(new ErrorResponse('Join a team to access projects and tasks', 403));
  }

  next();
});

