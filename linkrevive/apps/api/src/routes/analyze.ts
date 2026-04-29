import { FastifyPluginAsync } from 'fastify';
import { LinkAnalyzerService } from '../services/linkAnalyzer';
import { AnalyzeRequestSchema } from '@linkrevive/shared';

const analyzeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/v1/analyze', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri' },
          options: {
            type: 'object',
            properties: {
              includeTimeline: { type: 'boolean', default: true },
              useLLM: { type: 'boolean', default: true },
              maxAlternatives: { type: 'number', minimum: 1, maximum: 10, default: 5 },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { url, options } = request.body as any;

    try {
      const result = await LinkAnalyzerService.analyze(url, options);
      return result;
    } catch (err: any) {
      fastify.log.error({ err, url }, 'Analysis failed');
      reply.code(500);
      return { error: 'Analysis failed', message: err.message };
    }
  });
};

export default analyzeRoute;
