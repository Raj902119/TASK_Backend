const axios = require('axios');
const { parseXMLToJSON } = require('../utils/xmlParser');
const { parseJobFromFeed } = require('../utils/jobParser');
const config = require('../config/config');

class JobFetcherService {
  constructor() {
    this.timeout = config.api.timeout;
  }

  // Fetch jobs from a single source
  async fetchJobsFromSource(sourceUrl) {
    try {
      console.log(`Fetching jobs from: ${sourceUrl}`);
      
      // Fetch XML data
      const response = await axios.get(sourceUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'JobImporter/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });

      // Parse XML to JSON
      const jsonData = await parseXMLToJSON(response.data);
      
      // Extract jobs from feed
      const jobs = this.extractJobsFromFeed(jsonData, sourceUrl);
      
      console.log(`Fetched ${jobs.length} jobs from ${sourceUrl}`);
      
      return {
        success: true,
        source: sourceUrl,
        jobCount: jobs.length,
        jobs: jobs,
      };
    } catch (error) {
      console.error(`Error fetching jobs from ${sourceUrl}:`, error.message);
      
      return {
        success: false,
        source: sourceUrl,
        jobCount: 0,
        jobs: [],
        error: error.message,
      };
    }
  }

  // Extract jobs from different feed formats
  extractJobsFromFeed(jsonData, sourceUrl) {
    const jobs = [];
    
    try {
      // Handle RSS 2.0 format
      if (jsonData.rss && jsonData.rss.channel) {
        const items = jsonData.rss.channel.item;
        
        if (Array.isArray(items)) {
          items.forEach(item => {
            try {
              const job = parseJobFromFeed(item, sourceUrl);
              if (this.validateJob(job)) {
                jobs.push(job);
              }
            } catch (error) {
              console.error(`Error parsing job item:`, error.message);
            }
          });
        } else if (items) {
          // Single item
          try {
            const job = parseJobFromFeed(items, sourceUrl);
            if (this.validateJob(job)) {
              jobs.push(job);
            }
          } catch (error) {
            console.error(`Error parsing job item:`, error.message);
          }
        }
      }
      
      // Handle Atom format
      else if (jsonData.feed && jsonData.feed.entry) {
        const entries = jsonData.feed.entry;
        
        if (Array.isArray(entries)) {
          entries.forEach(entry => {
            try {
              const job = parseJobFromFeed(entry, sourceUrl);
              if (this.validateJob(job)) {
                jobs.push(job);
              }
            } catch (error) {
              console.error(`Error parsing job entry:`, error.message);
            }
          });
        } else if (entries) {
          // Single entry
          try {
            const job = parseJobFromFeed(entries, sourceUrl);
            if (this.validateJob(job)) {
              jobs.push(job);
            }
          } catch (error) {
            console.error(`Error parsing job entry:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting jobs from feed:`, error.message);
    }
    
    return jobs;
  }

  // Validate job data
  validateJob(job) {
    // Required fields
    const requiredFields = ['externalId', 'title', 'description', 'company', 'url', 'publishedDate', 'source'];
    
    for (const field of requiredFields) {
      if (!job[field]) {
        console.warn(`Job missing required field: ${field}`);
        return false;
      }
    }
    
    // Validate date
    if (!(job.publishedDate instanceof Date) || isNaN(job.publishedDate.getTime())) {
      console.warn(`Job has invalid date: ${job.externalId}`);
      return false;
    }
    
    return true;
  }

  // Fetch jobs from all configured sources
  async fetchJobsFromAllSources() {
    const sources = config.api.sources;
    const results = [];
    
    // Fetch from all sources in parallel
    const promises = sources.map(source => this.fetchJobsFromSource(source));
    const sourceResults = await Promise.allSettled(promises);
    
    sourceResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          source: sources[index],
          jobCount: 0,
          jobs: [],
          error: result.reason.message,
        });
      }
    });
    
    return results;
  }
}

module.exports = new JobFetcherService(); 