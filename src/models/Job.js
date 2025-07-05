const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // External ID from the API
  externalId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Job details
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  category: {
    type: String,
  },
  jobType: {
    type: String,
  },
  salary: {
    type: String,
  },
  
  // URLs
  url: {
    type: String,
    required: true,
  },
  applyUrl: {
    type: String,
  },
  
  // Dates
  publishedDate: {
    type: Date,
    required: true,
  },
  
  // Source tracking
  source: {
    type: String,
    required: true,
  },
  
  // Additional fields that might come from the API
  additionalData: {
    type: mongoose.Schema.Types.Mixed,
  },
  
  // Import tracking
  firstImportedAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  updateCount: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

// Indexes for efficient querying
jobSchema.index({ publishedDate: -1 });
jobSchema.index({ source: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ category: 1 });

// Method to check if job data has changed
jobSchema.methods.hasChanged = function(newData) {
  const fieldsToCheck = ['title', 'description', 'company', 'location', 'category', 'jobType', 'salary', 'url', 'applyUrl'];
  
  for (const field of fieldsToCheck) {
    if (this[field] !== newData[field]) {
      return true;
    }
  }
  
  return false;
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job; 