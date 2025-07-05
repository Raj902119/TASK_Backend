require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job_importer',
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },

  // Queue Configuration
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 5,
    batchSize: parseInt(process.env.BATCH_SIZE) || 50,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  },

  // Cron Configuration
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 * * * *', // Every hour
  },

  // API Configuration
  api: {
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
    sources: [
      'https://jobicy.com/?feed=job_feed',
      'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
      'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
      'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
      'https://jobicy.com/?feed=job_feed&job_categories=data-science',
      'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
      'https://jobicy.com/?feed=job_feed&job_categories=business',
      'https://jobicy.com/?feed=job_feed&job_categories=management',
      'https://www.higheredjobs.com/rss/articleFeed.cfm'
    ]
  }
};

module.exports = config; 