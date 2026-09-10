const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB & start server
const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Embroidery ERP Auth Server running on port ${PORT}`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });

    // Handle Unhandled Rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Unhandled Rejection] ${err.name}: ${err.message}`);
      console.error(err.stack);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
      console.error(`[Uncaught Exception] ${err.name}: ${err.message}`);
      console.error(err.stack);
      process.exit(1);
    });

    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received. Shutting down gracefully.');
      server.close(() => {
        console.log('Process terminated.');
      });
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
