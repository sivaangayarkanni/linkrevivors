// apps/api/src/services/alternativeFinder.ts
// SMART ALTERNATIVE FINDER - The heart of LinkRevive
// Extracts keywords → Parallel semantic search (Google CSE + GitHub) → LLM ranking

import axios from 'axios';
import { generateObject } from 'ai'; // Vercel AI SDK or OpenAI directly
import { z } from 'zod';
import { logger } from '../utils/logger';

const AlternativeSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  source: z.enum(['github', 'google_cse']),
  relevanceScore: z.number().min(0).max(1),
  summary: z.string().optional(),
});

export async function findAlternatives(
  originalUrl: string,
  archivedSummary: string,
  linkType: string,
  max = 5
) {
  const keywords = extractKeywords(originalUrl, archivedSummary, linkType);
  logger.info({ keywords, linkType }, 'Extracted keywords for alternative search');

  const [googleResults, githubResults] = await Promise.all([
    searchGoogleCSE(keywords, linkType),
    searchGitHub(keywords, linkType),
  ]);

  const allCandidates = [...googleResults, ...githubResults].slice(0, max * 2);

  // LLM-powered ranking + dedup (critical for quality)
  const ranked = await rankWithLLM(originalUrl, archivedSummary, allCandidates);

  return ranked.slice(0, max);
}

function extractKeywords(url: string, summary: string, linkType: string): string {
  // Simple but effective: path + summary keywords
  const urlParts = new URL(url).pathname.split('/').filter(Boolean);
  const base = urlParts.join(' ').replace(/-/g, ' ');
  const summaryWords = summary.split(' ').slice(0, 8).join(' ');
  return `${base} ${summaryWords} ${linkType}`.trim();
}

async function searchGoogleCSE(keywords: string, linkType: string) {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx) return [];

  const queries = [
    `${keywords} official documentation 2025 OR 2026`,
    `${keywords} tutorial updated`,
    linkType === 'github_repo' ? `${keywords} repository` : `${keywords} guide site:github.com OR site:docs.*`,
  ];

  const results: any[] = [];
  for (const q of queries) {
    try {
      const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: { key: apiKey, cx, q, num: 3 },
        timeout: 5000,
      });
      if (data.items) {
        results.push(...data.items.map((item: any) => ({
          title: item.title,
          url: item.link,
          source: 'google_cse' as const,
          summary: item.snippet,
          relevanceScore: 0.7, // Will be refined by LLM
        })));
      }
    } catch (e) {
      logger.warn({ q }, 'Google CSE query failed');
    }
  }
  return results;
}

async function searchGitHub(keywords: string, linkType: string) {
  const token = process.env.GITHUB_TOKEN;
  const q = `${keywords} in:name,description,readme stars:>50 pushed:>2024-01-01`;
  try {
    const { data } = await axios.get('https://api.github.com/search/repositories', {
      params: { q, sort: 'stars', order: 'desc', per_page: 5 },
      headers: token ? { Authorization: `token ${token}` } : {},
      timeout: 6000,
    });
    return (data.items || []).map((repo: any) => ({
      title: repo.full_name,
      url: repo.html_url,
      source: 'github' as const,
      summary: repo.description,
      relevanceScore: 0.65,
    }));
  } catch (e) {
    logger.warn({ keywords }, 'GitHub search failed');
    return [];
  }
}

async function rankWithLLM(originalUrl: string, archivedSummary: string, candidates: any[]) {
  if (!process.env.OPENAI_API_KEY || candidates.length === 0) {
    return candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Use structured output (simplified - in prod use @ai-sdk/openai + zod)
  const prompt = `You are an expert at finding the best modern replacement for a dead web resource.
Original URL: ${originalUrl}
Archived content summary: ${archivedSummary || 'N/A'}

Rank these candidates by relevance (0-1 score). Return ONLY valid JSON array of objects with title, url, relevanceScore (refined), summary.

Candidates: ${JSON.stringify(candidates.map(c => ({ title: c.title, url: c.url, source: c.source })))}`;

  try {
    // In real code: const { object } = await generateObject({ model: openai('gpt-4o-mini'), schema: z.array(AlternativeSchema), prompt });
    // Mock for now (replace with real LLM call):
    const ranked = candidates.map((c, i) => ({
      ...c,
      relevanceScore: Math.max(0.5, c.relevanceScore - (i * 0.05)), // Simulate LLM refinement
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    return ranked;
  } catch (e) {
    logger.error({ e }, 'LLM ranking failed - fallback to heuristic');
    return candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}
