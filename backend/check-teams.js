// check-teams.js
const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('./models/Team');
const User = require('./models/User');

async function checkTeams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const teams = await Team.find({})
      .populate('owner', 'name email')
      .populate('members.user', '_id name email');

    console.log('Teams in DB:', teams.length);
    teams.forEach(team => {
      console.log(`Team: ${team.name}, ID: ${team._id}, Tenant: ${team.tenantId}, Owner: ${team.owner ? team.owner._id : 'null'}, Members: ${team.members.length}`);
      team.members.forEach(member => {
        console.log(`  Member: ${member.user ? member.user._id : 'null'}`);
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTeams();