const Project = require('../models/Project');
const Task = require('../models/Task');
const mongoose = require('mongoose');

/**
 * Remove a user from all project memberships and task assignments that are tied to a team.
 * This is used when a team owner kicks a user, and can also be invoked as a repair action.
 */
async function cleanupTeamMemberAccess({ tenantId, team, userId }) {
  const kickedUserObjectId = (() => {
    try {
      return new mongoose.Types.ObjectId(userId);
    } catch {
      return null;
    }
  })();

  const kickedUserIdRaw = String(userId);

  const teamProjectIds = Array.isArray(team?.projects) ? team.projects : [];

  const linkedProjects = await Project.find({
    tenantId,
    $or: [
      { team: team._id },
      ...(teamProjectIds.length > 0 ? [{ _id: { $in: teamProjectIds } }] : []),
    ],
  }).select('_id');

  const projectIds = linkedProjects.map((p) => p._id);

  let projectsUpdated = 0;
  let tasksAssigneesPulled = 0;
  let tasksPrimaryFixed = 0;

  if (projectIds.length > 0) {
    const projRes = await Project.updateMany(
      { tenantId, _id: { $in: projectIds } },
      {
        $pull: {
          members: {
            user: { $in: [kickedUserObjectId, kickedUserIdRaw].filter(Boolean) },
          },
        },
      },
    );
    projectsUpdated = projRes?.modifiedCount || projRes?.nModified || 0;

    const taskRes = await Task.updateMany(
      { tenantId, project: { $in: projectIds } },
      { $pull: { assignees: { $in: [kickedUserObjectId, kickedUserIdRaw].filter(Boolean) } } },
    );
    tasksAssigneesPulled = taskRes?.modifiedCount || taskRes?.nModified || 0;

    // Fix primary assignee if it points to the kicked user.
    const tasksWithPrimary = await Task.find({
      tenantId,
      project: { $in: projectIds },
      assignee: { $in: [kickedUserObjectId, kickedUserIdRaw].filter(Boolean) },
    }).select('_id assignees');

    for (const t of tasksWithPrimary) {
      const remaining = Array.isArray(t.assignees)
        ? t.assignees.filter((id) => id && id.toString() !== kickedUserIdRaw)
        : [];

      await Task.updateOne(
        { _id: t._id, tenantId },
        { $set: { assignees: remaining, assignee: remaining[0] || null } },
      );
      tasksPrimaryFixed += 1;
    }
  }

  return {
    projectIds,
    projectsUpdated,
    tasksAssigneesPulled,
    tasksPrimaryFixed,
  };
}

module.exports = {
  cleanupTeamMemberAccess,
};

