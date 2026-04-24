// routes/activities.js
const express = require('express');
const { protect } = require('../middlewares/auth');
const requireTeamForUserRole = require('../middlewares/requireTeamForUserRole');
const {
  getActivities,
  getProjectActivities,
  getUserActivities,
} = require('../controllers/activityController');

const router = express.Router();

router.use(protect);
router.use(requireTeamForUserRole);

// Dashboard feed
router.get('/', getActivities);
// Project feed
router.get('/project/:projectId', getProjectActivities);
// User feed
router.get('/user/:userId', getUserActivities);

module.exports = router;

