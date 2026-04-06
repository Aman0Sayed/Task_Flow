/**
 * Drop the old unique index on TeamInvitation collection
 * Run this after fixing the model to allow multiple invitations
 */

const mongoose = require('mongoose');
require('dotenv').config();

const dropIndex = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Use legacy dev mongo URI as fallback
    const LEGACY_DEV_MONGO_URI = 'mongodb+srv://backend:12345@inter.mgnp44y.mongodb.net/Inter?retryWrites=true&w=majority&appName=Inter';
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DEV_MONGODB_URI || LEGACY_DEV_MONGO_URI;
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected successfully\n');

    // Drop the old unique index
    console.log('🔍 Dropping old unique index from TeamInvitation collection...');
    try {
      await mongoose.connection.collection('teaminvitations').dropIndex('team_1_invitedUser_1_status_1');
      console.log('✅ Old index dropped successfully!\n');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index already dropped or does not exist\n');
      } else {
        throw err;
      }
    }

    // Create new indexes (without unique constraint)
    console.log('📍 Creating new indexes...');
    await mongoose.connection.collection('teaminvitations').createIndex({ team: 1, invitedUser: 1 });
    await mongoose.connection.collection('teaminvitations').createIndex({ invitedUser: 1, status: 1 });
    console.log('✅ New indexes created!\n');

    console.log('🎉 Done! You can now send multiple invitations to the same user.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

dropIndex();
