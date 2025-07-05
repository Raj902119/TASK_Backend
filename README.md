# Job Import Backend

## Development

Run both API server and worker:
```bash
npm run monitor
```

Or run them separately:
```bash
# API Server
npm run dev

# Worker (in another terminal)
npm run worker:dev
```

## Production

```bash
# API Server
npm start

# Worker (in another process/container)
npm run worker
```

## API Endpoints

- `POST /api/imports/trigger` - Trigger manual import
- `GET /api/imports/history` - Get import history
- `GET /api/imports/stats` - Get statistics
- `GET /api/imports/queue/stats` - Get queue stats
- `POST /api/imports/queue/pause` - Pause queue
- `POST /api/imports/queue/resume` - Resume queue

## Architecture

- Express.js REST API
- MongoDB with Mongoose ODM
- Redis + Bull for queue management
- Separate worker processes for job processing
- Cron-based scheduled imports 


## RAW

- redis-cli ping       - If returned PONG redis is running 