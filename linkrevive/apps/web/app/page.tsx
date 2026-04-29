// apps/web/app/page.tsx
// LinkRevive Landing + Main Analyzer - Clean Production UI (Next.js 15 + Tailwind + shadcn vibe)

'use client';

import { useState } from 'react';
import { AnalysisResponse } from '@linkrevive/shared';

export default function LinkReviveHome() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('https://api.linkrevive.com/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options: { includeTimeline: true, useLLM: true } }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur fixed w-full z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">🔗</div>
            <div>
              <div className="font-semibold text-xl tracking-tight">LinkRevive</div>
              <div className="text-[10px] text-slate-500 -mt-1">DEAD LINK FIXER</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#how" className="hover:text-blue-400 transition">How it works</a>
            <a href="#extension" className="hover:text-blue-400 transition">Extension</a>
            <button className="px-4 py-1.5 bg-white text-slate-950 rounded-full text-sm font-medium">Get API Key</button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 text-xs tracking-[2px] mb-6">PRODUCTION READY • 2026</div>
        
        <h1 className="text-6xl font-semibold tracking-tighter mb-4">Never hit a dead link again.</h1>
        <p className="text-2xl text-slate-400 max-w-md mx-auto">Instant archives + AI-powered modern alternatives for any broken URL.</p>

        <div className="mt-10 max-w-lg mx-auto">
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://old-docs.company.com/v1/api"
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-600 rounded-2xl px-6 py-4 text-lg placeholder:text-slate-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
            />
            <button
              onClick={analyze}
              disabled={loading || !url}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 transition px-8 rounded-2xl font-semibold text-lg flex items-center gap-2"
            >
              {loading ? 'Analyzing...' : 'Revive'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">Free • No signup • Results in &lt;2s (cached)</p>
        </div>
      </div>

      {error && (
        <div className="max-w-lg mx-auto px-6 -mt-4 mb-8 text-red-400 text-sm text-center">{error}</div>
      )}

      {result && (
        <div className="max-w-3xl mx-auto px-6 pb-24">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="uppercase tracking-[1px] text-xs text-emerald-400 mb-1">ANALYSIS COMPLETE</div>
                <div className="font-mono text-sm text-slate-400 break-all">{result.url}</div>
              </div>
              <div className={`px-3 py-1 rounded text-xs font-mono ${result.status === 'broken' ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
                {result.status.toUpperCase()}
              </div>
            </div>

            {/* Archive Section */}
            {result.archive.hasArchive && (
              <div className="mb-8">
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">ARCHIVED VERSION</div>
                <a href={result.archive.latest?.waybackUrl} target="_blank" className="block p-4 bg-slate-950 rounded-2xl hover:bg-slate-800 transition group">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{result.archive.latest?.title || 'Snapshot from Wayback Machine'}</div>
                      <div className="text-sm text-slate-400 mt-1">Captured {result.archive.latest?.timestamp}</div>
                    </div>
                    <div className="text-blue-400 group-hover:translate-x-0.5 transition">→</div>
                  </div>
                </a>
              </div>
            )}

            {/* Alternatives */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase tracking-widest text-slate-500">SMART ALTERNATIVES • AI RANKED</div>
                <div className="text-xs text-slate-500">{result.alternatives.length} found</div>
              </div>
              
              <div className="space-y-3">
                {result.alternatives.map((alt, index) => (
                  <a key={index} href={alt.url} target="_blank" className="block p-5 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 group transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-lg leading-tight group-hover:text-blue-400 transition">{alt.title}</div>
                        <div className="text-sm text-slate-400 mt-1.5 line-clamp-2">{alt.summary}</div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400">{alt.source}</span>
                          <span className="text-emerald-400 text-xs font-mono">{Math.round(alt.relevanceScore * 100)}% relevance</span>
                        </div>
                      </div>
                      <div className="text-2xl opacity-40 group-hover:opacity-100 transition">↗</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* AI Explanation */}
            {result.explanation && (
              <div className="mt-8 pt-8 border-t border-slate-800">
                <div className="uppercase text-xs tracking-[1.5px] text-amber-400 mb-3">AI INSIGHT</div>
                <div className="prose prose-invert max-w-none text-[15px] leading-relaxed text-slate-300">
                  <p><strong>Summary:</strong> {result.explanation.summary}</p>
                  <p className="mt-4"><strong>What changed:</strong> {result.explanation.whatChanged}</p>
                  <div className="mt-4 p-4 bg-slate-950 rounded-xl text-sm border-l-4 border-amber-500">
                    <strong>Recommendation:</strong> {result.explanation.recommendation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* How it works section */}
      <div id="how" className="max-w-4xl mx-auto px-6 py-16 border-t border-slate-800">
        <h2 className="text-center text-3xl font-semibold mb-12">How LinkRevive works in 3 seconds</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🔍', title: 'Detect & Archive', desc: 'Checks HTTP status + pulls latest Wayback snapshot + timeline' },
            { icon: '🧠', title: 'Find Alternatives', desc: 'Semantic search across Google + GitHub + LLM ranks best matches' },
            { icon: '✨', title: 'Explain & Recommend', desc: 'GPT-4o compares old vs new, tells you exactly what changed' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-4xl mb-6">{step.icon}</div>
              <div className="font-semibold text-xl mb-3">{step.title}</div>
              <p className="text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
