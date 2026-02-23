const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI contains the old cluster0 URI and override it
    let mongoURI = process.env.MONGODB_URI;
    if (!mongoURI || mongoURI.includes('cluster0.mongodb.net')) {
      mongoURI = 'mongodb+srv://backend:12345@inter.mgnp44y.mongodb.net/Inter?retryWrites=true&w=majority&appName=Inter';
      console.log('🔄 Overriding MONGODB_URI with correct value from .env');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`MONGODB_URI: ${mongoURI.replace(/:.*@/, ':****@')}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Print full error for debugging
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
