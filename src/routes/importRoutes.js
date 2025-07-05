const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');

// Import management routes
router.post('/trigger', importController.triggerImport);
router.get('/history', importController.getImportHistory);
router.get('/history/:id', importController.getImportLogById);
router.get('/stats', importController.getImportStats);

// Queue management routes
router.get('/queue/stats', importController.getQueueStats);
router.post('/queue/pause', importController.pauseQueue);
router.post('/queue/resume', importController.resumeQueue);
router.post('/queue/retry', importController.retryFailedJobs);
router.post('/queue/clean', importController.cleanQueue);

module.exports = router; 