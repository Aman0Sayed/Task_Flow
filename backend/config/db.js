const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI contains the old cluster0 URI and override it
    let mongoURI = process.env.MONGODB_URI;
    if (!mongoURI || mongoURI.includes('cluster0.mongodb.net')) {
      mongoURI = 'mongodb+srv://backend:12345@inter.mgnp44y.mongodb.net/Inter?retryWrites=true&w=majority&appName=Inter';
      console.log('Overriding MONGODB_URI with fallback value');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB connected successfully');
    console.log(`MONGODB_URI: ${mongoURI.replace(/:.*@/, ':****@')}`);

    // Remove legacy unique index from old schema that blocks new signups.
    try {
      const indexes = await User.collection.indexes();
      const hasLegacyUsernameIndex = indexes.some((idx) => idx.name === 'username_1');

      if (hasLegacyUsernameIndex) {
        await User.collection.dropIndex('username_1');
        console.log('Dropped legacy users.username_1 index');
      }
    } catch (indexError) {
      console.warn(`Could not update legacy user indexes: ${indexError.message}`);
    }
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
