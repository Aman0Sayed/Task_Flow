const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const startServer = async () => {
  try {
    if (isProductionRuntime) {
      const missingEnvVars = [];
      if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        missingEnvVars.push('MONGODB_URI|MONGO_URI');
      }
      if (!process.env.JWT_SECRET) {
        missingEnvVars.push('JWT_SECRET');
      }
      if (missingEnvVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      }
    }

    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
