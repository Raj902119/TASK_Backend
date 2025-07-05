const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  // Import identification
  fileName: {
    type: String,
    required: true,
  },
  
  // Import statistics
  totalFetched: {
    type: Number,
    default: 0,
  },
  totalImported: {
    type: Number,
    default: 0,
  },
  newJobs: {
    type: Number,
    default: 0,
  },
  updatedJobs: {
    type: Number,
    default: 0,
  },
  failedJobs: {
    type: Number,
    default: 0,
  },
  
  // Failed job details
  failedJobDetails: [{
    externalId: String,
    reason: String,
    error: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
    }
  }],
  
  // Import timing
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in milliseconds
  },
  
  // Import status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  
  // Error tracking
  error: {
    type: mongoose.Schema.Types.Mixed,
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  }
}, {
  timestamps: true,
});

// Indexes for efficient querying
importLogSchema.index({ fileName: 1 });
importLogSchema.index({ startTime: -1 });
importLogSchema.index({ status: 1 });

// Method to calculate duration
importLogSchema.methods.calculateDuration = function() {
  if (this.startTime && this.endTime) {
    this.duration = this.endTime - this.startTime;
  }
};

// Method to add failed job
importLogSchema.methods.addFailedJob = function(externalId, reason, error) {
  this.failedJobDetails.push({
    externalId,
    reason,
    error,
  });
  this.failedJobs += 1;
};

const ImportLog = mongoose.model('ImportLog', importLogSchema, 'import_logs');

module.exports = ImportLog; 