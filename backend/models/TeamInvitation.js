// models/TeamInvitation.js
const mongoose = require('mongoose');

const teamInvitationSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'lead', 'admin'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
});

// Index for faster lookups (no unique constraint - allows multiple invitations to be sent)
teamInvitationSchema.index({ team: 1, invitedUser: 1 });
teamInvitationSchema.index({ invitedUser: 1, status: 1 });

module.exports = mongoose.model('TeamInvitation', teamInvitationSchema);