/**
 * AIWA v2 - Worker Entry Point
 */

import IORedis from 'ioredis';
import pino from 'pino';
import { getPool, closePool } from '@aiwa/db';
import { startConversationWorker } from './conversation.worker.js';
import { startImportWorker } from './import.worker.js';
import { startEnrichWorker } from './enrich.worker.js';
import 'dotenv/config';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function start() {
  logger.info('Starting AIWA workers...');

  const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  // Initialize DB pool
  getPool();

  // Start workers
  const workers = [
    startConversationWorker(redis),
    startImportWorker(redis),
    startEnrichWorker(redis),
  ];

  logger.info(`${workers.length} workers started`);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await Promise.all(workers.map(w => w.close()));
    await closePool();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  logger.error(err, 'Worker startup failed');
  process.exit(1);
});
