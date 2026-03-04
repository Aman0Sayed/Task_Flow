const app = require('../app');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
  try {
    const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    if (isProductionRuntime) {
      const missingEnvVars = [];
      if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        missingEnvVars.push('MONGODB_URI|MONGO_URI');
      }
      if (!process.env.JWT_SECRET) {
        missingEnvVars.push('JWT_SECRET');
      }
      if (missingEnvVars.length > 0) {
        return res.status(500).json({
          success: false,
          message: `Missing environment variables: ${missingEnvVars.join(', ')}`
        });
      }
    }

    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error(`Serverless handler error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
      error: error.message
    });
  }
};
