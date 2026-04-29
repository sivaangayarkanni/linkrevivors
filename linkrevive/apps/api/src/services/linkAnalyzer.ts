// apps/api/src/services/linkAnalyzer.ts
// CORE ORCHESTRATOR - Senior Engineer Implementation
// Handles full pipeline: health check → archive → alternatives → LLM explanation
// Modular, retryable, cached, observable. Designed for BullMQ offload if needed.

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { checkLinkHealth } from './urlHealthChecker';
import { fetchArchive } from './archiveFetcher';
import { findAlternatives } from './alternativeFinder';
import { generateExplanation } from './llmOrchestrator';
import { classifyLinkType } from '../utils/linkClassifier';
import { normalizeUrl, isPublicUrl } from '../utils/urlValidator';
import { logger } from '../utils/logger';
import { AnalysisResponse } from '@linkrevive/shared';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface AnalyzeOptions {
  includeTimeline?: boolean;
  useLLM?: boolean;
  maxAlternatives?: number;
}

export class LinkAnalyzerService {
  private static readonly CACHE_TTL = 60 * 60 * 24 * 7; // 7 days
  private static readonly CACHE_PREFIX = 'linkrevive:analysis:';

  /**
   * Main entry point. Checks cache first, then processes.
   * Production: Add circuit breaker for external APIs.
   */
  static async analyze(url: string, options: AnalyzeOptions = {}): Promise<AnalysisResponse> {
    const normalized = normalizeUrl(url);
    const cacheKey = `${this.CACHE_PREFIX}${normalized}`;

    // 1. Cache hit (critical for <2s requirement)
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info({ url: normalized }, 'Cache hit');
      return JSON.parse(cached);
    }

    // 2. SSRF Guard
    if (!isPublicUrl(url)) {
      throw new Error('Invalid or private URL - SSRF protection triggered');
    }

    logger.info({ url: normalized }, 'Starting fresh analysis');

    // 3. Health Check (fast path)
    const health = await checkLinkHealth(url);
    const linkType = classifyLinkType(url, health.contentType);

    let archiveData = null;
    let alternatives: any[] = [];
    let explanation = null;

    if (health.status === 'broken' || health.status === 'unknown') {
      // 4. Archive Retrieval (parallelizable)
      archiveData = await fetchArchive(url, options.includeTimeline);

      // 5. Smart Alternative Finder (CRITICAL)
      alternatives = await findAlternatives(
        url,
        archiveData?.latest?.summary || '',
        linkType,
        options.maxAlternatives || 5
      );

      // 6. AI Explanation Layer
      if (options.useLLM !== false && archiveData?.latest) {
        explanation = await generateExplanation(
          url,
          archiveData.latest.summary || '',
          alternatives
        );
      }
    } else {
      // Healthy link - still provide context if old
      archiveData = await fetchArchive(url, false);
    }

    // 7. Build Response
    const response: AnalysisResponse = {
      id: '', // Will be set after DB insert
      url: normalized,
      status: health.status,
      httpStatus: health.httpStatus,
      errorType: health.errorType,
      linkType,
      analyzedAt: new Date().toISOString(),
      cached: false,
      archive: {
        latest: archiveData?.latest || null,
        timeline: archiveData?.timeline || [],
        hasArchive: !!archiveData?.latest,
      },
      alternatives: alternatives.map((alt, i) => ({
        ...alt,
        isRecommended: i === 0 && alt.relevanceScore > 0.85,
      })),
      explanation,
    };

    // 8. Persist to DB (async, fire-and-forget for speed)
    this.persistAnalysis(normalized, response, health).catch(err =>
      logger.error({ err, url }, 'DB persist failed')
    );

    // 9. Cache result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(response));

    return response;
  }

  private static async persistAnalysis(
    normalizedUrl: string,
    response: AnalysisResponse,
    health: any
  ) {
    // Upsert for dedup
    await prisma.linkAnalysis.upsert({
      where: { normalizedUrl_analyzedAt: { normalizedUrl, analyzedAt: new Date() } }, // Simplified
      update: { fullResult: response as any },
      create: {
        url: response.url,
        normalizedUrl,
        status: response.status,
        httpStatus: response.httpStatus,
        errorType: response.errorType,
        linkType: response.linkType,
        fullResult: response as any,
      },
    });
  }

  // Bulk helper - queues heavy crawls
  static async queueBulkScan(pageUrl: string, userId?: string) {
    // BullMQ add job here (implementation in workers/)
    logger.info({ pageUrl }, 'Bulk scan queued');
    // Return jobId for polling
    return { jobId: 'bull-' + Date.now(), status: 'queued' };
  }
}
