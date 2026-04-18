// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: String,
    index: true
  },
  type: {
    type: String,
    enum: ['task_assigned', 'task_due', 'mention', 'project_invite', 
           'deadline_approaching', 'task_completed', 'comment_reply',
           'team_join_request', 'team_invitation', 'team_join_accepted', 'team_join_rejected',
           'team_member_kicked', 'team_deleted', 'manager_account_deleted'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  relatedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  requestingUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  joinRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamInvitation'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);

