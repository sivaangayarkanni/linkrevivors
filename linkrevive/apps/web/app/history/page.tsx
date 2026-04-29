'use client';

import { useState, useEffect } from 'react';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production this would call /v1/history with auth
    const mock = [
      { id: '1', url: 'https://old-docs.company.com/v1', status: 'broken', analyzedAt: '2026-04-29T10:22:00Z', linkType: 'documentation' },
      { id: '2', url: 'https://blog.example.com/2022/post', status: 'broken', analyzedAt: '2026-04-28T14:55:00Z', linkType: 'blog' },
      { id: '3', url: 'https://github.com/user/old-repo', status: 'healthy', analyzedAt: '2026-04-27T09:10:00Z', linkType: 'github_repo' },
    ];
    setHistory(mock);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Analysis History</h1>
            <p className="text-slate-400 mt-2">Your recent link revivals</p>
          </div>
          <a href="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm font-medium transition">← Back to Analyzer</a>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading history...</div>
        ) : (
          <div className="space-y-3">
            {history.map((item, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between hover:border-slate-700 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${item.status === 'broken' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <div>
                    <div className="font-mono text-sm text-slate-400 break-all">{item.url}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(item.analyzedAt).toLocaleString()} • {item.linkType}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${item.status === 'broken' ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
                    {item.status.toUpperCase()}
                  </span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">Re-analyze →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-xs text-slate-500">
          In production this page would show real data from your account (Clerk + Prisma)
        </div>
      </div>
    </div>
  );
}
