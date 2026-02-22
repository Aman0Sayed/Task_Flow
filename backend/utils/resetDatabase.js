/**
 * DATABASE RESET SCRIPT
 * 
 * ⚠️  WARNING: This script will DELETE ALL DATA from the database
 * 
 * Purpose: Clear all user accounts and related data to start fresh with multitenancy
 * 
 * Usage:
 *   node utils/resetDatabase.js
 * 
 * Environment Requirements:
 *   - MONGODB_URI must be set in .env file
 *   - Script will connect to MongoDB and clear all collections
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Team = require('../models/Team');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const resetDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected successfully');

    // Confirm before deletion
    console.log('\n⚠️  WARNING: About to delete ALL data from database!');
    console.log('📊 Clearing collections:');
    console.log('   - Users');
    console.log('   - Projects');
    console.log('   - Tasks');
    console.log('   - Teams');
    console.log('   - Activities');
    console.log('   - Notifications');

    // Delete all documents
    console.log('\n🗑️  Deleting data...');
    
    const userCount = await User.countDocuments();
    await User.deleteMany({});
    console.log(`✅ Deleted ${userCount} users`);

    const projectCount = await Project.countDocuments();
    await Project.deleteMany({});
    console.log(`✅ Deleted ${projectCount} projects`);

    const taskCount = await Task.countDocuments();
    await Task.deleteMany({});
    console.log(`✅ Deleted ${taskCount} tasks`);

    const teamCount = await Team.countDocuments();
    await Team.deleteMany({});
    console.log(`✅ Deleted ${teamCount} teams`);

    const activityCount = await Activity.countDocuments();
    await Activity.deleteMany({});
    console.log(`✅ Deleted ${activityCount} activities`);

    const notificationCount = await Notification.countDocuments();
    await Notification.deleteMany({});
    console.log(`✅ Deleted ${notificationCount} notifications`);

    console.log('\n🎉 Database reset complete!');
    console.log('🚀 Ready to start fresh with multitenancy!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your backend: npm start');
    console.log('   2. Visit your frontend');
    console.log('   3. Sign up a new account (will auto-create as manager with tenantId)');
    console.log('   4. All data is now isolated to this tenant');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the reset
resetDatabase();
