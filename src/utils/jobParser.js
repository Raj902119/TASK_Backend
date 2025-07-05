// Parse job data from different feed formats
const parseJobFromFeed = (item, source) => {
  try {
    // Handle different feed formats
    if (source.includes('jobicy.com')) {
      return parseJobicyJob(item, source);
    } else if (source.includes('higheredjobs.com')) {
      return parseHigherEdJob(item, source);
    } else {
      // Generic RSS feed parser
      return parseGenericJob(item, source);
    }
  } catch (error) {
    throw new Error(`Job parsing error: ${error.message}`);
  }
};

// Parse Jobicy feed format
const parseJobicyJob = (item, source) => {
  const job = {
    externalId: extractExternalId(item),
    title: cleanText(item.title),
    description: cleanText(item.description || item['content:encoded']),
    company: extractCompany(item),
    location: item.location || extractLocation(item),
    category: item.category || extractCategory(item),
    jobType: extractJobType(item),
    salary: extractSalary(item),
    url: item.link,
    applyUrl: item.link,
    publishedDate: new Date(item.pubDate || item.pubdate),
    source: source,
    additionalData: {
      author: item['dc:creator'] || item.author,
      tags: item.tags || [],
    }
  };
  
  return job;
};

// Parse HigherEdJobs feed format
const parseHigherEdJob = (item, source) => {
  const job = {
    externalId: extractExternalId(item),
    title: cleanText(item.title),
    description: cleanText(item.description),
    company: extractFromDescription(item.description, 'Institution:') || 'Unknown',
    location: extractFromDescription(item.description, 'Location:') || 'Unknown',
    category: item.category || 'Education',
    jobType: extractFromDescription(item.description, 'Type:') || 'Full-time',
    salary: extractFromDescription(item.description, 'Salary:'),
    url: item.link,
    applyUrl: item.link,
    publishedDate: new Date(item.pubDate || item.pubdate),
    source: source,
    additionalData: {}
  };
  
  return job;
};

// Generic RSS feed parser
const parseGenericJob = (item, source) => {
  const job = {
    externalId: extractExternalId(item) || generateId(item),
    title: cleanText(item.title),
    description: cleanText(item.description || item.summary || item['content:encoded']),
    company: item.company || item.author || 'Unknown',
    location: item.location || 'Remote',
    category: item.category || 'General',
    jobType: 'Full-time',
    salary: null,
    url: item.link || item.url,
    applyUrl: item.link || item.url,
    publishedDate: new Date(item.pubDate || item.pubdate || item.date || Date.now()),
    source: source,
    additionalData: {}
  };
  
  return job;
};

// Helper functions
const cleanText = (text) => {
  if (!text) return '';
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

const extractCompany = (item) => {
  // Try different fields
  const possibleFields = ['company', 'employer', 'organization', 'author', 'dc:creator'];
  
  for (const field of possibleFields) {
    if (item[field]) {
      return cleanText(item[field]);
    }
  }
  
  // Try to extract from title or description
  const titleMatch = item.title?.match(/at\s+(.+?)(?:\s*-|\s*\||$)/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  return 'Unknown';
};

const extractLocation = (item) => {
  // Try different fields
  const possibleFields = ['location', 'geo', 'place'];
  
  for (const field of possibleFields) {
    if (item[field]) {
      return cleanText(item[field]);
    }
  }
  
  // Try to extract from description
  const locationMatch = item.description?.match(/Location:\s*([^\n\r<]+)/i);
  if (locationMatch) {
    return locationMatch[1].trim();
  }
  
  return 'Remote';
};

const extractCategory = (item) => {
  if (Array.isArray(item.category)) {
    return item.category[0];
  }
  return item.category || 'General';
};

const extractJobType = (item) => {
  const description = (item.description || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const combined = title + ' ' + description;
  
  if (combined.includes('part-time') || combined.includes('part time')) {
    return 'Part-time';
  } else if (combined.includes('contract')) {
    return 'Contract';
  } else if (combined.includes('freelance')) {
    return 'Freelance';
  } else if (combined.includes('intern')) {
    return 'Internship';
  }
  
  return 'Full-time';
};

const extractSalary = (item) => {
  const description = item.description || '';
  const salaryMatch = description.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:year|annual|month|hour))?/i);
  
  if (salaryMatch) {
    return salaryMatch[0];
  }
  
  return null;
};

const extractFromDescription = (description, label) => {
  if (!description) return null;
  
  const regex = new RegExp(`${label}\\s*([^\\n\\r<]+)`, 'i');
  const match = description.match(regex);
  
  return match ? match[1].trim() : null;
};

const generateId = (item) => {
  const title = item.title || '';
  const date = item.pubDate || Date.now();
  return `${title.substring(0, 20)}-${new Date(date).getTime()}`;
};

const extractExternalId = (item) => {
  // Handle guid that might be an object with attributes
  if (item.guid) {
    if (typeof item.guid === 'string') {
      return item.guid;
    } else if (typeof item.guid === 'object' && item.guid._) {
      // Handle case where guid is an object with text content in '_' property
      return item.guid._;
    }
  }
  
  // Fallback to link
  return item.link;
};

module.exports = { parseJobFromFeed }; 