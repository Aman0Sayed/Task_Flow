// routes/notifications.js
const express = require('express');
const { protect } = require('../middlewares/auth');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

const NOTIFICATIONS_DISABLED = true;

// Get user notifications
router.get('/', asyncHandler(async (req, res) => {
  if (NOTIFICATIONS_DISABLED) {
    return res.status(200).json({
      success: true,
      count: 0,
      unreadCount: 0,
      data: []
    });
  }

  const notifications = await Notification.find({
    recipient: req.user.id,
    tenantId: req.tenantId
  })
    .populate('relatedProject', 'name')
    .populate('relatedTask', 'title')
    .populate('relatedTeam', 'name')
    .populate('requestingUser', 'name email avatar')
    .populate('joinRequest')
    .sort('-createdAt')
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    tenantId: req.tenantId,
    isRead: false
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: notifications
  });
}));

// Mark notification as read
router.put('/:id/read', asyncHandler(async (req, res) => {
  if (NOTIFICATIONS_DISABLED) {
    return res.status(200).json({
      success: true,
      data: {}
    });
  }

  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user.id,
    tenantId: req.tenantId
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    });
  }

  await notification.markAsRead();

  res.status(200).json({
    success: true,
    data: notification
  });
}));

// Mark all notifications as read
router.put('/read-all', asyncHandler(async (req, res) => {
  if (NOTIFICATIONS_DISABLED) {
    return res.status(200).json({
      success: true,
      message: 'Notifications are disabled'
    });
  }

  await Notification.updateMany(
    { recipient: req.user.id, tenantId: req.tenantId, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

// Delete notification
router.delete('/:id', asyncHandler(async (req, res) => {
  if (NOTIFICATIONS_DISABLED) {
    return res.status(200).json({
      success: true,
      data: {}
    });
  }

  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user.id,
    tenantId: req.tenantId
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}));

// Clear all notifications
router.delete('/', asyncHandler(async (req, res) => {
  if (NOTIFICATIONS_DISABLED) {
    return res.status(200).json({
      success: true,
      message: 'Notifications are disabled'
    });
  }

  await Notification.deleteMany({
    recipient: req.user.id,
    tenantId: req.tenantId
  });

  res.status(200).json({
    success: true,
    message: 'All notifications cleared'
  });
}));

module.exports = router;

