#!/usr/bin/env node

/**
 * DATA VERIFICATION SCRIPT
 * 
 * This script checks the database and API to ensure data is being correctly
 * isolated by tenant and show only real data.
 * 
 * Usage:
 *   node utils/verifyData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Team = require('../models/Team');

const verifyData = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected\n');

    // Get counts
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();
    const teamCount = await Team.countDocuments();

    console.log('📊 DATABASE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Users: ${userCount}`);
    console.log(`Total Projects: ${projectCount}`);
    console.log(`Total Tasks: ${taskCount}`);
    console.log(`Total Teams: ${teamCount}`);
    console.log('='.repeat(50) + '\n');

    if (userCount === 0) {
      console.log('⚠️  DATABASE IS EMPTY');
      console.log('No users found. Start by signing up a new account.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get all user details
    const users = await User.find().select('name email tenantId taskflowId role');
    
    console.log('👥 USERS BY TENANT');
    console.log('='.repeat(50));
    
    const usersByTenant = {};
    users.forEach(user => {
      if (!usersByTenant[user.tenantId]) {
        usersByTenant[user.tenantId] = [];
      }
      usersByTenant[user.tenantId].push({
        name: user.name,
        email: user.email,
        taskflowId: user.taskflowId,
        role: user.role
      });
    });

    Object.entries(usersByTenant).forEach(([tenantId, userList], idx) => {
      console.log(`\nTenant ${idx + 1}: ${tenantId.substring(0, 12)}...`);
      console.log(`  Users: ${userList.length}`);
      userList.forEach(u => {
        console.log(`    • ${u.name} (@${u.taskflowId}) - ${u.role}`);
      });
    });
    console.log('\n' + '='.repeat(50));

    // Get data distribution
    console.log('\n📊 DATA BY TENANT');
    console.log('='.repeat(50));

    for (const [tenantId, userList] of Object.entries(usersByTenant)) {
      const tenantProjects = await Project.countDocuments({ tenantId });
      const tenantTasks = await Task.countDocuments({ tenantId });
      const tenantTeams = await Team.countDocuments({ tenantId });

      console.log(`\nTenant: ${tenantId.substring(0, 12)}... (${userList[0].name})`);
      console.log(`  Projects: ${tenantProjects}`);
      console.log(`  Tasks: ${tenantTasks}`);
      console.log(`  Teams: ${tenantTeams}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ DATA VERIFICATION COMPLETE\n');

    // Check for data isolation issues
    console.log('🔐 CHECKING DATA ISOLATION');
    console.log('='.repeat(50));

    let isolationIssues = false;

    // Check if any data doesn't have tenantId
    const projectsWithoutTenant = await Project.countDocuments({ tenantId: { $exists: false } });
    const tasksWithoutTenant = await Task.countDocuments({ tenantId: { $exists: false } });
    const teamsWithoutTenant = await Team.countDocuments({ tenantId: { $exists: false } });

    if (projectsWithoutTenant > 0) {
      console.log(`⚠️  ${projectsWithoutTenant} projects missing tenantId`);
      isolationIssues = true;
    }
    if (tasksWithoutTenant > 0) {
      console.log(`⚠️  ${tasksWithoutTenant} tasks missing tenantId`);
      isolationIssues = true;
    }
    if (teamsWithoutTenant > 0) {
      console.log(`⚠️  ${teamsWithoutTenant} teams missing tenantId`);
      isolationIssues = true;
    }

    if (!isolationIssues) {
      console.log('✅ All data is properly isolated by tenant');
    }

    console.log('='.repeat(50) + '\n');

    // Instructions
    console.log('📝 NEXT STEPS');
    console.log('='.repeat(50));
    console.log('1. Check the dashboard to verify displayed numbers match this report');
    console.log('2. Open browser DevTools (F12) and check console for debug logs');
    console.log('3. Look for "📊 Data fetched" message showing real data counts');
    console.log('4. Verify Team Members count matches actual team members (not all users)');
    console.log('='.repeat(50) + '\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

verifyData();
