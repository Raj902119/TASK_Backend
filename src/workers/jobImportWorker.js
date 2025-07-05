const { jobImportQueue } = require('../config/queue');
const jobImportService = require('../services/jobImportService');
const config = require('../config/config');

// Track import logs being processed
const processingImportLogs = new Map();

// Process job import batches
jobImportQueue.process('import-batch', config.queue.concurrency, async (job) => {
  const { importLogId, source, batch, batchNumber, totalBatches } = job.data;
  
  console.log(`Processing batch ${batchNumber}/${totalBatches} for ${source}`);
  
  try {
    // Import the batch
    const results = await jobImportService.importJobBatch(batch, importLogId);
    
    console.log(`Batch ${batchNumber}/${totalBatches} completed:`, {
      newJobs: results.newJobs,
      updatedJobs: results.updatedJobs,
      failedJobs: results.failedJobs,
    });
    
    // Track processed batches
    if (!processingImportLogs.has(importLogId)) {
      processingImportLogs.set(importLogId, {
        totalBatches,
        processedBatches: 0,
      });
    }
    
    const logTracking = processingImportLogs.get(importLogId);
    logTracking.processedBatches++;
    
    // Check if all batches for this import log are processed
    if (logTracking.processedBatches === logTracking.totalBatches) {
      console.log(`All batches processed for import log ${importLogId}`);
      
      // Finalize the import log
      await jobImportService.finalizeImportLog(importLogId);
      
      // Clean up tracking
      processingImportLogs.delete(importLogId);
    }
    
    return results;
  } catch (error) {
    console.error(`Error processing batch ${batchNumber}/${totalBatches}:`, error);
    
    // Mark import log as failed if this is a critical error
    if (error.message.includes('Import log not found')) {
      await jobImportService.markImportLogFailed(importLogId, error.message);
      processingImportLogs.delete(importLogId);
    }
    
    throw error;
  }
});

// Handle worker errors
jobImportQueue.on('error', (error) => {
  console.error('Worker error:', error);
});

jobImportQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled and will be retried`);
});

// Clean up on shutdown
process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  
  // Close the queue
  await jobImportQueue.close();
  
  // Mark any in-progress import logs as failed
  for (const [importLogId, tracking] of processingImportLogs) {
    await jobImportService.markImportLogFailed(
      importLogId,
      'Worker shutdown before completion'
    );
  }
  
  process.exit(0);
});

console.log(`Job import worker started with concurrency: ${config.queue.concurrency}`); 