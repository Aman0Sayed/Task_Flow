const mongoose = require('mongoose');
const User = require('../models/User');

let connectPromise = null;
let didCheckLegacyIndexes = false;
const LEGACY_DEV_MONGO_URI = 'mongodb+srv://backend:12345@inter.mgnp44y.mongodb.net/Inter?retryWrites=true&w=majority&appName=Inter';

const getMongoUri = () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoUri) {
    return mongoUri;
  }

  const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (isProductionRuntime) {
    throw new Error('MONGODB_URI is missing in production environment');
  }

  if (process.env.DEV_MONGODB_URI) {
    console.warn('MONGODB_URI missing, using DEV_MONGODB_URI fallback');
    return process.env.DEV_MONGODB_URI;
  }

  console.warn('MONGODB_URI missing, using legacy development cloud fallback');
  return LEGACY_DEV_MONGO_URI;
};

const dropLegacyUserIndexIfNeeded = async () => {
  if (didCheckLegacyIndexes) {
    return;
  }

  try {
    const indexes = await User.collection.indexes();
    const hasLegacyUsernameIndex = indexes.some((idx) => idx.name === 'username_1');

    if (hasLegacyUsernameIndex) {
      await User.collection.dropIndex('username_1');
      console.log('Dropped legacy users.username_1 index');
    }
  } catch (indexError) {
    console.warn(`Could not update legacy user indexes: ${indexError.message}`);
  } finally {
    didCheckLegacyIndexes = true;
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = mongoose
    .connect(getMongoUri())
    .then(async () => {
      await dropLegacyUserIndexIfNeeded();
      console.log('MongoDB connected successfully');
      return mongoose.connection;
    })
    .catch((error) => {
      throw error;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
};

module.exports = connectDB;
