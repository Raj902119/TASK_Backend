const cron = require('node-cron');
const jobFetcherService = require('./jobFetcher');
const queueService = require('./queueService');
const config = require('../config/config');

class CronService {
  constructor() {
    this.cronJob = null;
  }

  // Start the cron job
  start() {
    // Validate cron expression
    if (!cron.validate(config.cron.schedule)) {
      console.error('Invalid cron expression:', config.cron.schedule);
      return;
    }

    this.cronJob = cron.schedule(config.cron.schedule, async () => {
      console.log('Starting scheduled job import...');
      
      try {
        await this.runJobImport();
      } catch (error) {
        console.error('Error in scheduled job import:', error);
      }
    });

    console.log(`Cron job scheduled: ${config.cron.schedule}`);
    
    // Run immediately on startup
    this.runJobImport();
  }

  // Stop the cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Cron job stopped');
    }
  }

  // Run job import process
  async runJobImport() {
    console.log(`Job import started at ${new Date().toISOString()}`);
    
    try {
      // Fetch jobs from all sources
      const sourceResults = await jobFetcherService.fetchJobsFromAllSources();
      
      // Log fetch results
      const totalJobs = sourceResults.reduce((sum, result) => sum + result.jobCount, 0);
      console.log(`Fetched ${totalJobs} total jobs from ${sourceResults.length} sources`);
      
      // Add jobs to import queue
      const importLogs = await queueService.addJobsToQueue(sourceResults);
      
      console.log(`Created ${importLogs.length} import logs and queued jobs for processing`);
      
      // Get queue stats
      const queueStats = await queueService.getQueueStats();
      console.log('Queue stats:', queueStats);
      
      return {
        sourceResults,
        importLogs,
        queueStats,
      };
    } catch (error) {
      console.error('Error in job import process:', error);
      throw error;
    }
  }

  // Manually trigger job import
  async triggerImport() {
    console.log('Manually triggering job import...');
    return await this.runJobImport();
  }
}

module.exports = new CronService(); 