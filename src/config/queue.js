const Bull = require('bull');
const config = require('./config');

// Create job import queue
const jobImportQueue = new Bull('job-import', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: config.queue.maxRetries,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Queue event handlers
jobImportQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

jobImportQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

jobImportQueue.on('active', (job) => {
  console.log(`Job ${job.id} has started`);
});

jobImportQueue.on('completed', (job) => {
  console.log(`Job ${job.id} has completed`);
});

jobImportQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} has failed:`, err);
});

module.exports = { jobImportQueue }; 