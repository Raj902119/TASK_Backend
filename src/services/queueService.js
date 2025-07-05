const { jobImportQueue } = require('../config/queue');
const ImportLog = require('../models/ImportLog');
const config = require('../config/config');

class QueueService {
  // Add jobs to the import queue
  async addJobsToQueue(sourceResults) {
    const importLogs = [];
    
    for (const result of sourceResults) {
      // Create import log
      const importLog = new ImportLog({
        fileName: result.source,
        totalFetched: result.jobCount,
        startTime: new Date(),
        status: 'pending',
      });
      
      await importLog.save();
      
      if (result.success && result.jobs.length > 0) {
        // Split jobs into batches
        const batches = this.createBatches(result.jobs, config.queue.batchSize);
        
        // Add each batch to the queue
        for (let i = 0; i < batches.length; i++) {
          await jobImportQueue.add('import-batch', {
            importLogId: importLog._id,
            source: result.source,
            batch: batches[i],
            batchNumber: i + 1,
            totalBatches: batches.length,
          }, {
            attempts: config.queue.maxRetries,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          });
        }
        
        // Update import log status
        importLog.status = 'processing';
        await importLog.save();
      } else {
        // Mark as failed if no jobs fetched
        importLog.status = 'failed';
        importLog.endTime = new Date();
        importLog.calculateDuration();
        importLog.error = result.error || 'No jobs fetched';
        await importLog.save();
      }
      
      importLogs.push(importLog);
    }
    
    return importLogs;
  }

  // Create batches from jobs array
  createBatches(jobs, batchSize) {
    const batches = [];
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      batches.push(jobs.slice(i, i + batchSize));
    }
    
    return batches;
  }

  // Get queue statistics
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      jobImportQueue.getWaitingCount(),
      jobImportQueue.getActiveCount(),
      jobImportQueue.getCompletedCount(),
      jobImportQueue.getFailedCount(),
      jobImportQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  // Clean old jobs from queue
  async cleanQueue(gracePeriod = 24 * 60 * 60 * 1000) { // 24 hours
    const completed = await jobImportQueue.clean(gracePeriod, 'completed');
    const failed = await jobImportQueue.clean(gracePeriod, 'failed');
    
    return {
      completedRemoved: completed.length,
      failedRemoved: failed.length,
    };
  }

  // Pause queue processing
  async pauseQueue() {
    await jobImportQueue.pause();
  }

  // Resume queue processing
  async resumeQueue() {
    await jobImportQueue.resume();
  }

  // Get failed jobs
  async getFailedJobs(limit = 10) {
    const failedJobs = await jobImportQueue.getFailed(0, limit);
    
    return failedJobs.map(job => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    }));
  }

  // Retry failed jobs
  async retryFailedJobs() {
    const failedJobs = await jobImportQueue.getFailed();
    let retriedCount = 0;
    
    for (const job of failedJobs) {
      await job.retry();
      retriedCount++;
    }
    
    return retriedCount;
  }
}

module.exports = new QueueService(); 