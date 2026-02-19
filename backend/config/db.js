const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI.replace(/:.*@/, ':****@')}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Print full error for debugging
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
