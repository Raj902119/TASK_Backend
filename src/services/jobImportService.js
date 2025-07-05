const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');

class JobImportService {
  // Import a batch of jobs
  async importJobBatch(batch, importLogId) {
    const importLog = await ImportLog.findById(importLogId);
    
    if (!importLog) {
      throw new Error('Import log not found');
    }
    
    const results = {
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 0,
      failedDetails: [],
    };
    
    // Process each job in the batch
    for (const jobData of batch) {
      try {
        const result = await this.importSingleJob(jobData);
        
        if (result.isNew) {
          results.newJobs++;
        } else if (result.isUpdated) {
          results.updatedJobs++;
        }
      } catch (error) {
        results.failedJobs++;
        results.failedDetails.push({
          externalId: jobData.externalId,
          reason: error.message,
          error: error,
        });
      }
    }
    
    // Update import log with results
    await this.updateImportLog(importLogId, results);
    
    return results;
  }

  // Import a single job
  async importSingleJob(jobData) {
    try {
      // Check if job already exists
      const existingJob = await Job.findOne({ externalId: jobData.externalId });
      
      if (existingJob) {
        // Check if job has changed
        if (existingJob.hasChanged(jobData)) {
          // Update existing job
          Object.assign(existingJob, jobData);
          existingJob.lastUpdatedAt = new Date();
          existingJob.updateCount += 1;
          
          await existingJob.save();
          
          return { isNew: false, isUpdated: true, job: existingJob };
        } else {
          // Job hasn't changed
          return { isNew: false, isUpdated: false, job: existingJob };
        }
      } else {
        // Create new job
        const newJob = new Job(jobData);
        await newJob.save();
        
        return { isNew: true, isUpdated: false, job: newJob };
      }
    } catch (error) {
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        throw new Error(`Duplicate job: ${jobData.externalId}`);
      }
      
      throw error;
    }
  }

  // Update import log with batch results
  async updateImportLog(importLogId, results) {
    try {
      const importLog = await ImportLog.findById(importLogId);
      
      if (!importLog) {
        throw new Error('Import log not found');
      }
      
      // Update counters
      importLog.newJobs += results.newJobs;
      importLog.updatedJobs += results.updatedJobs;
      importLog.failedJobs += results.failedJobs;
      importLog.totalImported += results.newJobs + results.updatedJobs;
      
      // Add failed job details
      results.failedDetails.forEach(detail => {
        importLog.addFailedJob(detail.externalId, detail.reason, detail.error);
      });
      
      await importLog.save();
    } catch (error) {
      console.error('Error updating import log:', error);
    }
  }

  // Finalize import log after all batches are processed
  async finalizeImportLog(importLogId) {
    try {
      const importLog = await ImportLog.findById(importLogId);
      
      if (!importLog) {
        throw new Error('Import log not found');
      }
      
      importLog.endTime = new Date();
      importLog.calculateDuration();
      importLog.status = 'completed';
      
      await importLog.save();
      
      return importLog;
    } catch (error) {
      console.error('Error finalizing import log:', error);
      throw error;
    }
  }

  // Mark import log as failed
  async markImportLogFailed(importLogId, error) {
    try {
      const importLog = await ImportLog.findById(importLogId);
      
      if (!importLog) {
        throw new Error('Import log not found');
      }
      
      importLog.endTime = new Date();
      importLog.calculateDuration();
      importLog.status = 'failed';
      importLog.error = error;
      
      await importLog.save();
      
      return importLog;
    } catch (err) {
      console.error('Error marking import log as failed:', err);
      throw err;
    }
  }
}

module.exports = new JobImportService(); 