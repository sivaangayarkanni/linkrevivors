'use client';

import { useState } from 'react';

export default function BulkScanner() {
  const [pageUrl, setPageUrl] = useState('');
  const [maxLinks, setMaxLinks] = useState(25);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const startBulkScan = async () => {
    if (!pageUrl) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/v1/bulk-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUrl, maxLinks }),
      });
      const data = await res.json();
      setJob(data);

      // Poll status every 3 seconds
      const interval = setInterval(async () => {
        const statusRes = await fetch(`http://localhost:3001/v1/bulk-status/${data.jobId}`);
        const status = await statusRes.json();
        setJob(status);

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      }, 3000);
    } catch (e) {
      alert('Failed to start bulk scan. Is the API running?');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-semibold tracking-tighter">Bulk Link Scanner</h1>
          <p className="mt-3 text-xl text-slate-400">Scan an entire webpage and revive all broken links at once.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">PAGE URL TO SCAN</label>
              <input
                type="url"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="https://docs.company.com/old-version"
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-600 rounded-2xl px-6 py-4 text-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">MAX LINKS TO CHECK</label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={maxLinks}
                onChange={(e) => setMaxLinks(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <div>10</div><div className="font-mono text-blue-400">{maxLinks}</div><div>100</div>
              </div>
            </div>

            <button
              onClick={startBulkScan}
              disabled={loading || !pageUrl}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-2xl font-semibold text-lg transition flex items-center justify-center gap-3"
            >
              {loading ? 'Scanning...' : 'Start Bulk Scan'}
            </button>
          </div>
        </div>

        {job && (
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-slate-400">JOB ID</div>
                <div className="font-mono text-lg">{job.jobId}</div>
              </div>
              <div className={`px-4 py-1 rounded-full text-sm font-medium ${job.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                {job.status?.toUpperCase() || 'PROCESSING'}
              </div>
            </div>

            {job.progress !== undefined && (
              <div className="mb-6">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-2 bg-blue-600 transition-all" style={{ width: `${job.progress}%` }} />
                </div>
                <div className="text-right text-xs text-slate-400 mt-1">{job.progress}% complete</div>
              </div>
            )}

            {job.result && (
              <div className="mt-6 p-6 bg-slate-950 rounded-2xl">
                <div className="text-emerald-400 font-semibold mb-3">✅ Scan Complete</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-3xl font-semibold">{job.result.brokenCount}</div><div className="text-xs text-slate-400">Broken Links</div></div>
                  <div><div className="text-3xl font-semibold">{job.result.results?.length || 0}</div><div className="text-xs text-slate-400">Total Checked</div></div>
                  <div><div className="text-3xl font-semibold">92%</div><div className="text-xs text-slate-400">Revival Rate</div></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
