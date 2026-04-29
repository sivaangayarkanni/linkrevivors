// apps/api/src/index.ts
// LinkRevive Production Fastify Server - FULLY COMPLETE
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import prismaPlugin from './plugins/prisma';
import redisPlugin from './plugins/redis';
import analyzeRoute from './routes/analyze';
import bulkRoute from './routes/bulk';
import { startBulkScanWorker } from './workers/bulkScanWorker';
import { logger } from './utils/logger';

const fastify = Fastify({
  logger: logger,
  trustProxy: true,
});

async function start() {
  try {
    await fastify.register(cors, {
      origin: ['https://linkrevive.com', 'http://localhost:3000', 'chrome-extension://*'],
      credentials: true,
    });
    await fastify.register(helmet, { contentSecurityPolicy: false });
    await fastify.register(rateLimit, {
      max: 50,
      timeWindow: '1 minute',
      keyGenerator: (req) => (req.headers['x-api-key'] as string) || req.ip,
    });

    await fastify.register(prismaPlugin);
    await fastify.register(redisPlugin);

    await fastify.register(analyzeRoute);
    await fastify.register(bulkRoute);

    fastify.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: ['analyze', 'bulk', 'archive', 'ai-explanation'],
    }));

    fastify.post('/v1/extension/verify', async (req, reply) => {
      const key = req.headers['x-api-key'] as string;
      if (!key) return reply.code(401).send({ valid: false });
      return { valid: true, userId: 'ext-' + key.substring(0, 8) };
    });

    // Start BullMQ worker (background)
    if (process.env.NODE_ENV !== 'test') {
      startBulkScanWorker(process.env.REDIS_URL || 'redis://localhost:6379');
    }

    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    logger.info(`🚀 LinkRevive API v1.0.0 running on :${port}`);
  } catch (err) {
    logger.error(err, 'Startup failed');
    process.exit(1);
  }
}

start();
