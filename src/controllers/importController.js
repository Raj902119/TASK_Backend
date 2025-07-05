const cronService = require('../services/cronService');
const queueService = require('../services/queueService');
const ImportLog = require('../models/ImportLog');

class ImportController {
  // Trigger manual import
  async triggerImport(req, res) {
    try {
      const result = await cronService.triggerImport();
      
      res.json({
        success: true,
        message: 'Import triggered successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error triggering import:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to trigger import',
        error: error.message,
      });
    }
  }

  // Get import history
  async getImportHistory(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        source,
        startDate,
        endDate,
      } = req.query;

      // Build query
      const query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (source) {
        query.fileName = new RegExp(source, 'i');
      }
      
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) {
          query.startTime.$gte = new Date(startDate);
        }
        if (endDate) {
          query.startTime.$lte = new Date(endDate);
        }
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [logs, total] = await Promise.all([
        ImportLog.find(query)
          .sort({ startTime: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('-failedJobDetails'),
        ImportLog.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching import history:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch import history',
        error: error.message,
      });
    }
  }

  // Get import log by ID
  async getImportLogById(req, res) {
    try {
      const { id } = req.params;
      
      const log = await ImportLog.findById(id);
      
      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Import log not found',
        });
      }

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      console.error('Error fetching import log:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch import log',
        error: error.message,
      });
    }
  }

  // Get import statistics
  async getImportStats(req, res) {
    try {
      const { days = 7 } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Aggregate statistics
      const stats = await ImportLog.aggregate([
        {
          $match: {
            startTime: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalImports: { $sum: 1 },
            totalFetched: { $sum: '$totalFetched' },
            totalImported: { $sum: '$totalImported' },
            totalNew: { $sum: '$newJobs' },
            totalUpdated: { $sum: '$updatedJobs' },
            totalFailed: { $sum: '$failedJobs' },
            avgDuration: { $avg: '$duration' },
            successfulImports: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
              },
            },
            failedImports: {
              $sum: {
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Get stats by source
      const statsBySource = await ImportLog.aggregate([
        {
          $match: {
            startTime: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$fileName',
            imports: { $sum: 1 },
            totalFetched: { $sum: '$totalFetched' },
            totalImported: { $sum: '$totalImported' },
            avgDuration: { $avg: '$duration' },
          },
        },
        {
          $sort: { totalImported: -1 },
        },
      ]);

      res.json({
        success: true,
        data: {
          overall: stats[0] || {
            totalImports: 0,
            totalFetched: 0,
            totalImported: 0,
            totalNew: 0,
            totalUpdated: 0,
            totalFailed: 0,
            avgDuration: 0,
            successfulImports: 0,
            failedImports: 0,
          },
          bySource: statsBySource,
          period: {
            days,
            startDate,
            endDate: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching import stats:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch import statistics',
        error: error.message,
      });
    }
  }

  // Get queue statistics
  async getQueueStats(req, res) {
    try {
      const stats = await queueService.getQueueStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch queue statistics',
        error: error.message,
      });
    }
  }

  // Pause queue processing
  async pauseQueue(req, res) {
    try {
      await queueService.pauseQueue();
      
      res.json({
        success: true,
        message: 'Queue paused successfully',
      });
    } catch (error) {
      console.error('Error pausing queue:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to pause queue',
        error: error.message,
      });
    }
  }

  // Resume queue processing
  async resumeQueue(req, res) {
    try {
      await queueService.resumeQueue();
      
      res.json({
        success: true,
        message: 'Queue resumed successfully',
      });
    } catch (error) {
      console.error('Error resuming queue:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to resume queue',
        error: error.message,
      });
    }
  }

  // Retry failed jobs
  async retryFailedJobs(req, res) {
    try {
      const retriedCount = await queueService.retryFailedJobs();
      
      res.json({
        success: true,
        message: `Retried ${retriedCount} failed jobs`,
        data: { retriedCount },
      });
    } catch (error) {
      console.error('Error retrying failed jobs:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retry jobs',
        error: error.message,
      });
    }
  }

  // Clean old jobs from queue
  async cleanQueue(req, res) {
    try {
      const { gracePeriod = 24 } = req.body;
      const gracePeriodMs = gracePeriod * 60 * 60 * 1000;
      
      const result = await queueService.cleanQueue(gracePeriodMs);
      
      res.json({
        success: true,
        message: 'Queue cleaned successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error cleaning queue:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to clean queue',
        error: error.message,
      });
    }
  }
}

module.exports = new ImportController(); 