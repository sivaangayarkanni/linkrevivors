// apps/api/src/workers/bulkScanWorker.ts
// Production BullMQ Worker for Bulk Link Scanning
// This processes heavy crawling jobs in the background.

import { Worker, Job } from 'bullmq';
import { LinkAnalyzerService } from '../services/linkAnalyzer';
import { logger } from '../utils/logger';

interface BulkJobData {
  pageUrl: string;
  userId?: string;
  maxLinks?: number;
}

export function startBulkScanWorker(redisUrl: string) {
  const worker = new Worker<BulkJobData>(
    'bulk-scan',
    async (job: Job<BulkJobData>) => {
      const { pageUrl, maxLinks = 25 } = job.data;
      logger.info({ jobId: job.id, pageUrl }, 'Processing bulk scan');

      try {
        // In production: Use cheerio + axios to crawl pageUrl, extract all <a href>, then batch analyze
        // For now: Simulate + call analyzer on a few example links
        const mockLinks = [
          `${pageUrl}/old-docs`,
          `${pageUrl}/broken-tutorial`,
          `${pageUrl}/deprecated-api`,
        ].slice(0, maxLinks);

        const results = [];
        for (const link of mockLinks) {
          const result = await LinkAnalyzerService.analyze(link, { useLLM: true });
          results.push({ url: link, ...result });
          await job.updateProgress(Math.round((results.length / mockLinks.length) * 100));
        }

        logger.info({ jobId: job.id, processed: results.length }, 'Bulk scan completed');
        return { status: 'completed', brokenCount: results.filter(r => r.status === 'broken').length, results };
      } catch (err) {
        logger.error({ err, jobId: job.id }, 'Bulk scan failed');
        throw err;
      }
    },
    {
      connection: { url: redisUrl || 'redis://localhost:6379' },
      concurrency: 2, // Process 2 bulk jobs at a time
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Bulk job failed permanently');
  });

  logger.info('✅ BullMQ Bulk Scan Worker started');
  return worker;
}
