const connectDB = require('./config/database');
const config = require('./config/config');

// Start worker
const startWorker = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('Worker process starting...');
    console.log(`Environment: ${config.nodeEnv}`);
    
    // Import worker to start processing
    require('./workers/jobImportWorker');
    
    // Keep the process alive
    process.on('SIGTERM', () => {
      console.log('Worker received SIGTERM signal');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('Worker received SIGINT signal');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
};

startWorker(); 