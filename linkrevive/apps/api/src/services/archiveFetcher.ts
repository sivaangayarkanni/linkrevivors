// apps/api/src/services/archiveFetcher.ts
// Wayback Machine Integration - Production hardened
// Uses official Availability API + CDX for timeline. Graceful degradation.

import axios from 'axios';
import { logger } from '../utils/logger';

interface WaybackResponse {
  archived_snapshots?: {
    closest?: {
      status: string;
      available: boolean;
      url: string;
      timestamp: string;
    };
  };
}

export async function fetchArchive(originalUrl: string, includeTimeline = true) {
  try {
    // 1. Latest snapshot (fast)
    const availUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(originalUrl)}`;
    const { data } = await axios.get<WaybackResponse>(availUrl, { timeout: 6000 });

    const closest = data.archived_snapshots?.closest;
    if (!closest?.available) {
      return { latest: null, timeline: [], hasArchive: false };
    }

    const latest = {
      timestamp: closest.timestamp,
      waybackUrl: closest.url,
      title: undefined, // Enrich later if needed via CDX or LLM
    };

    let timeline: any[] = [];
    if (includeTimeline) {
      // 2. Timeline via CDX (limit to recent 8 for UX)
      const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(originalUrl)}&output=json&limit=8&sort=reverse`;
      const cdxRes = await axios.get(cdxUrl, { timeout: 8000 });
      if (Array.isArray(cdxRes.data) && cdxRes.data.length > 1) {
        timeline = cdxRes.data.slice(1).map((row: string[]) => ({
          timestamp: row[1],
          waybackUrl: `https://web.archive.org/web/${row[1]}/${row[2]}`,
        }));
      }
    }

    return { latest, timeline, hasArchive: true };
  } catch (error) {
    logger.warn({ error, url: originalUrl }, 'Wayback fetch failed - graceful fallback');
    return { latest: null, timeline: [], hasArchive: false };
  }
}
