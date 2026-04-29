// packages/shared/src/types.ts
// Shared TypeScript types + Zod schemas for full-stack type safety
// Senior note: Single source of truth. Used by web, api, extension.

import { z } from 'zod';

export const AnalyzeRequestSchema = z.object({
  url: z.string().url().max(2048),
  options: z.object({
    includeTimeline: z.boolean().default(true),
    useLLM: z.boolean().default(true),
    maxAlternatives: z.number().min(1).max(10).default(5),
  }).optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const AlternativeSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  source: z.enum(['github', 'google_cse', 'wayback', 'manual']),
  relevanceScore: z.number().min(0).max(1),
  summary: z.string().optional(),
  isRecommended: z.boolean().default(false),
});

export const ArchiveSnapshotSchema = z.object({
  timestamp: z.string(),
  waybackUrl: z.string().url(),
  title: z.string().optional(),
  summary: z.string().optional(),
});

export const AnalysisResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  status: z.enum(['healthy', 'broken', 'redirected', 'unknown']),
  httpStatus: z.number().optional(),
  errorType: z.string().optional(),
  linkType: z.enum(['documentation', 'blog', 'github_repo', 'pdf', 'tutorial', 'other']),
  analyzedAt: z.string(),
  cached: z.boolean(),
  archive: z.object({
    latest: ArchiveSnapshotSchema.nullable(),
    timeline: z.array(ArchiveSnapshotSchema),
    hasArchive: z.boolean(),
  }),
  alternatives: z.array(AlternativeSchema),
  explanation: z.object({
    summary: z.string(),
    whatChanged: z.string(),
    isOutdated: z.boolean(),
    recommendation: z.string(),
    confidence: z.number().min(0).max(1),
  }).nullable(),
  fullResult: z.any().optional(), // For DB storage
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

// Extension specific
export const ExtensionAnalyzeMessageSchema = z.object({
  type: z.literal('ANALYZE_CURRENT_TAB'),
  url: z.string().url(),
});

export type ExtensionMessage = z.infer<typeof ExtensionAnalyzeMessageSchema>;
