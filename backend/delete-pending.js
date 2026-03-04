// delete-pending.js
const mongoose = require('mongoose');
require('dotenv').config();

const TeamInvitation = require('./models/TeamInvitation');

async function deletePending() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await TeamInvitation.deleteMany({
      invitedUser: '699f3b2e2fcf8622f56c3e07',
      status: 'pending',
      invitedBy: '699f3b2e2fcf8622f56c3e07'
    });

    console.log('Deleted pending requests:', result.deletedCount);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

deletePending();