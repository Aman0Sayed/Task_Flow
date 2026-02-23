/**
 * CHECK AND FIX USER ROLES
 *
 * Purpose: Check all users and their roles, and optionally fix incorrect roles
 *
 * Usage:
 *   node utils/checkUserRoles.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const checkUserRoles = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected successfully');

    // Get all users
    const users = await User.find({}).select('name email role taskflowId createdAt');

    console.log(`\n👥 Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   TaskFlow ID: @${user.taskflowId}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Check for users with default or incorrect roles
    const managers = users.filter(u => u.role === 'manager');
    const regularUsers = users.filter(u => u.role === 'user');
    const admins = users.filter(u => u.role === 'admin');

    console.log('📊 Role Summary:');
    console.log(`   Managers: ${managers.length}`);
    console.log(`   Users: ${regularUsers.length}`);
    console.log(`   Admins: ${admins.length}`);

    // Fix roles based on email/name patterns
    console.log('\n🔧 Fixing user roles based on naming patterns...');

    const updates = [];

    for (const user of users) {
      let newRole = user.role;

      // Skip users with invalid data
      if (!user.email || !user.name) {
        console.log(`   ⚠️  Skipping user with invalid data: ${user._id}`);
        continue;
      }

      // Fix based on email/name patterns
      const email = user.email.toLowerCase();
      const name = user.name.toLowerCase();

      if (email.includes('manager') || name.includes('manager')) {
        newRole = 'manager';
      } else if (email.includes('admin') || name.includes('admin')) {
        newRole = 'admin';
      } else if (email.includes('worker') || email.includes('user') || name.includes('worker')) {
        newRole = 'user';
      }

      if (newRole !== user.role) {
        await User.findByIdAndUpdate(user._id, { role: newRole });
        console.log(`   ✅ Updated ${user.name} (${user.email}): ${user.role} → ${newRole}`);
        updates.push(`${user.name} (${user.email}): ${user.role} → ${newRole}`);
      }
    }

    if (updates.length === 0) {
      console.log('   ℹ️  No role updates needed');
    } else {
      console.log(`\n✅ Updated ${updates.length} user roles`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
checkUserRoles();