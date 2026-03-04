// check-pending.js
const mongoose = require('mongoose');
require('dotenv').config();

const TeamInvitation = require('./models/TeamInvitation');

async function checkPending() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const pendings = await TeamInvitation.find({ status: 'pending' });

    console.log('Pending invitations:', pendings.length);
    pendings.forEach(inv => {
      console.log(`Team: ${inv.team}, User: ${inv.invitedUser}, InvitedBy: ${inv.invitedBy}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPending();