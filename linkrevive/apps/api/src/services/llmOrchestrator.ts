// apps/api/src/services/llmOrchestrator.ts
// AI Explanation Layer - Production with structured outputs
// Uses OpenAI GPT-4o-mini for speed/cost. Zod for validation.

import OpenAI from 'openai';
import { z } from 'zod';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ExplanationSchema = z.object({
  summary: z.string().min(20).max(300),
  whatChanged: z.string().min(10).max(200),
  isOutdated: z.boolean(),
  recommendation: z.string().min(20).max(250),
  confidence: z.number().min(0.6).max(1),
});

export async function generateExplanation(
  originalUrl: string,
  archivedSummary: string,
  alternatives: any[]
) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: 'Archived content retrieved successfully.',
      whatChanged: 'Content appears outdated based on archive date.',
      isOutdated: true,
      recommendation: alternatives[0]?.url || 'Check the top recommended resource.',
      confidence: 0.75,
    };
  }

  const prompt = `You are a senior technical documentation expert specializing in web resource evolution.

Analyze this dead link scenario:
- Original URL: ${originalUrl}
- Archived summary: ${archivedSummary || 'No detailed archive available'}
- Top modern alternatives found:
${alternatives.slice(0, 3).map((a, i) => `${i + 1}. ${a.title} (${a.url}) - ${a.summary || ''}`).join('\n')}

Provide a concise, actionable explanation in strict JSON format matching this schema:
{
  "summary": "1-2 sentence overview of what the original resource was about",
  "whatChanged": "Key differences or reasons it became inaccessible/outdated",
  "isOutdated": true/false,
  "recommendation": "Clear next step for the user (prefer the best alternative)",
  "confidence": 0.85
}

Be truthful. If no good alternatives, say so. Output ONLY the JSON object.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You output only valid JSON. No markdown, no explanations.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    return ExplanationSchema.parse(parsed);
  } catch (error) {
    logger.error({ error, url: originalUrl }, 'LLM explanation failed');
    return {
      summary: archivedSummary ? `The archived page covered: ${archivedSummary.substring(0, 100)}...` : 'Original resource unavailable.',
      whatChanged: 'The page is no longer accessible (404/timeout).',
      isOutdated: true,
      recommendation: alternatives.length > 0 ? `Try the top alternative: ${alternatives[0].url}` : 'Search for updated documentation on the topic.',
      confidence: 0.7,
    };
  }
}
