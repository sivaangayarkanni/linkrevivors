import { FastifyPluginAsync } from 'fastify';
import { Queue } from 'bullmq';

const bulkRoute: FastifyPluginAsync = async (fastify) => {
  const bulkQueue = new Queue('bulk-scan', {
    connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  });

  fastify.post('/v1/bulk-scan', {
    schema: {
      body: {
        type: 'object',
        required: ['pageUrl'],
        properties: {
          pageUrl: { type: 'string', format: 'uri' },
          maxLinks: { type: 'number', minimum: 5, maximum: 100, default: 25 },
        },
      },
    },
  }, async (request, reply) => {
    const { pageUrl, maxLinks } = request.body as any;

    const job = await bulkQueue.add('scan', { pageUrl, maxLinks }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return {
      jobId: job.id,
      status: 'queued',
      message: 'Bulk scan started. Poll /v1/bulk-status/:jobId for progress.',
      pageUrl,
      estimatedTime: '30-90 seconds',
    };
  });

  // Job status endpoint
  fastify.get('/v1/bulk-status/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await bulkQueue.getJob(jobId);

    if (!job) return reply.code(404).send({ error: 'Job not found' });

    const state = await job.getState();
    const progress = job.progress || 0;

    return {
      jobId,
      status: state,
      progress,
      result: job.returnvalue || null,
      failedReason: job.failedReason || null,
    };
  });
};

export default bulkRoute;
