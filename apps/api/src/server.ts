/**
 * AIWA v2 - Fastify API Server
 *
 * Main entry point for the API gateway.
 * Handles webhooks, REST API for dashboard, and SSE for realtime.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import { getPool, closePool } from '@aiwa/db';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import 'dotenv/config';

// Routes
import { webhookRoutes } from './routes/webhooks.js';
import { authRoutes } from './routes/auth.js';
import { conversationRoutes } from './routes/conversations.js';
import { catalogRoutes } from './routes/catalog.js';
import { contactRoutes } from './routes/contacts.js';
import { documentRoutes } from './routes/documents.js';
import { analyticsRoutes } from './routes/analytics.js';
import { tenantRoutes } from './routes/tenants.js';
import { eventRoutes } from './routes/events.js';

const PORT = parseInt(process.env.API_PORT || '3001');
const HOST = process.env.API_HOST || '0.0.0.0';

async function start() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
    },
    trustProxy: true,
  });

  // Redis connection for BullMQ
  const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  // BullMQ queues
  const queues = {
    conversation: new Queue('conversation', { connection: redis }),
    import: new Queue('catalog.import', { connection: redis }),
    enrich: new Queue('catalog.enrich', { connection: redis }),
    crm: new Queue('crm', { connection: redis }),
    followup: new Queue('followup', { connection: redis }),
  };

  // Decorate Fastify with shared resources
  app.decorate('db', getPool());
  app.decorate('redis', redis);
  app.decorate('queues', queues);

  // Plugins
  await app.register(cors, {
    origin: process.env.DASHBOARD_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.register(sensible);
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Routes
  await app.register(webhookRoutes, { prefix: '/webhooks' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(conversationRoutes, { prefix: '/api/conversations' });
  await app.register(catalogRoutes, { prefix: '/api/catalog' });
  await app.register(contactRoutes, { prefix: '/api/contacts' });
  await app.register(documentRoutes, { prefix: '/api/documents' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(tenantRoutes, { prefix: '/api/tenants' });
  await app.register(eventRoutes, { prefix: '/api/events' });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    await closePool();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`AIWA API running on ${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
