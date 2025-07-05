# Scalable Job Import System

A production-ready job import system that fetches job listings from multiple external APIs, processes them through a Redis queue, imports them into MongoDB, and provides a modern admin dashboard for monitoring and management.

## Features

- **Automated Job Fetching**: Pulls jobs from multiple XML/RSS feeds on an hourly schedule
- **Queue Processing**: Uses Redis and Bull for scalable background job processing
- **Import History Tracking**: Detailed logging of all import operations
- **Real-time Dashboard**: Modern admin UI with live statistics and queue management
- **Error Handling**: Comprehensive error tracking with retry mechanisms
- **Scalable Architecture**: Microservices-ready design with separate API and worker processes

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Queue**: Redis with Bull queue management
- **Job Scheduling**: node-cron for scheduled imports

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   External APIs │────▶│   Job Fetcher   │────▶│   Redis Queue   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin UI      │◀────│   Express API   │◀────│   Worker Pool   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │    MongoDB      │     │   Import Logs   │
                        └─────────────────┘     └─────────────────┘
```

## Prerequisites

- Node.js 16+ and npm
- MongoDB (local or MongoDB Atlas)
- Redis (local or Redis Cloud)
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/job-importer.git
cd job-importer
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```
## Running the Application

### Development Mode

1. Start MongoDB and Redis services

2. Run the backend (API server + Worker):
```bash
cd backend
npm run monitor
```

This starts both the Express server and the worker process concurrently.

3. Run the frontend:
```bash
cd frontend
npm run monitor
```

4. Access the admin dashboard at `http://localhost:3000`

### Production Mode

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the backend services:
```bash
cd backend
# Start API server
npm start

# In another terminal, start the worker
npm run worker
```

3. Start the frontend:
```bash
cd frontend
npm start
```

## API Endpoints

### Import Management
- `POST /api/imports/trigger` - Manually trigger a job import
- `GET /api/imports/history` - Get import history with pagination
- `GET /api/imports/history/:id` - Get specific import log details
- `GET /api/imports/stats` - Get import statistics

### Queue Management
- `GET /api/imports/queue/stats` - Get queue statistics
- `POST /api/imports/queue/pause` - Pause queue processing
- `POST /api/imports/queue/resume` - Resume queue processing
- `POST /api/imports/queue/retry` - Retry failed jobs
- `POST /api/imports/queue/clean` - Clean old jobs from queue

## Data Sources

The system imports jobs from the following sources:
- Jobicy.com feeds (multiple categories)
- HigherEdJobs.com RSS feed

## Import Process Flow

1. **Fetching**: The cron job triggers hourly, fetching XML data from all configured sources
2. **Parsing**: XML is converted to JSON and job data is extracted
3. **Queueing**: Jobs are batched and added to the Redis queue
4. **Processing**: Worker processes pick up batches and import jobs to MongoDB
5. **Tracking**: Import logs record all statistics and failures
6. **Monitoring**: Admin UI displays real-time status and history

## Database Schema

### Job Collection
- External ID (unique identifier from source)
- Title, Description, Company, Location
- Category, Job Type, Salary
- URLs (job listing and application)
- Published Date
- Import tracking metadata

### Import Log Collection
- Source URL
- Import statistics (total, new, updated, failed)
- Failed job details with reasons
- Timing information
- Status tracking

## Error Handling

- Automatic retry with exponential backoff
- Detailed error logging for failed jobs
- Graceful shutdown handling
- Queue persistence across restarts

## Monitoring

The admin dashboard provides:
- Real-time queue statistics
- Import history with filtering
- Overall performance metrics
- Failed job details
- Manual import triggering
- Queue control (pause/resume/retry)

## Deployment

### Cloud Deployment

1. **MongoDB Atlas**: Use cloud MongoDB for production
2. **Redis Cloud**: Use managed Redis service
3. **Backend**: Deploy to services like Render, Railway, or Heroku
4. **Frontend**: Deploy to Vercel or Netlify
5. **Worker**: Deploy as a separate process/container

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```


## Assumptions

- Jobs are uniquely identified by their external ID from the source
- XML feeds follow RSS 2.0 or Atom format
- Job updates are detected by comparing key fields
- Failed jobs are retried up to 3 times with exponential backoff
- Import logs are retained indefinitely for auditing 