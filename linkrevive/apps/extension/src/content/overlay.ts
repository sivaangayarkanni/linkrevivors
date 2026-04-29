// apps/extension/src/content/overlay.ts
// Real-time broken page detector + beautiful overlay injection (MV3)
// Detects common 404 patterns, injects floating UI that calls backend API.

import { AnalysisResponse } from '@linkrevive/shared';

const API_BASE = 'https://api.linkrevive.com/v1'; // Production
// const API_BASE = 'http://localhost:3001/v1'; // Dev

function isLikelyBrokenPage(): boolean {
  const title = document.title.toLowerCase();
  const bodyText = document.body?.innerText?.toLowerCase() || '';
  const errorPhrases = ['404', 'not found', 'page not found', 'error 404', 'this page doesn\'t exist', 'broken link', 'unavailable'];
  
  return errorPhrases.some(phrase => 
    title.includes(phrase) || bodyText.includes(phrase)
  ) || window.location.pathname.includes('404');
}

function createOverlay(analysis?: AnalysisResponse) {
  // Shadow DOM for style isolation (production best practice)
  const host = document.createElement('div');
  host.id = 'linkrevive-overlay-host';
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .lr-pill {
      position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
      background: linear-gradient(135deg, #3b82f6, #1e40af);
      color: white; padding: 12px 20px; border-radius: 9999px;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
      display: flex; align-items: center; gap: 8px; cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .lr-pill:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
    .lr-modal {
      position: fixed; inset: 0; z-index: 2147483647; display: none;
      align-items: center; justify-content: center; background: rgba(0,0,0,0.6);
    }
    .lr-modal.show { display: flex; }
    .lr-card {
      background: white; border-radius: 16px; max-width: 520px; width: 90%;
      box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
      overflow: hidden;
    }
    .lr-header { padding: 20px 24px; background: #0f172a; color: white; }
    .lr-body { padding: 24px; max-height: 60vh; overflow-y: auto; }
    .lr-btn { background: #3b82f6; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
  `;
  shadow.appendChild(style);

  const pill = document.createElement('div');
  pill.className = 'lr-pill';
  pill.innerHTML = `
    <span>🔗</span>
    <span>This page looks broken. <strong>Revive it?</strong></span>
  `;
  pill.onclick = () => showModal(shadow, pill);

  const modal = document.createElement('div');
  modal.className = 'lr-modal';
  modal.innerHTML = `
    <div class="lr-card">
      <div class="lr-header">
        <h2 style="margin:0; font-size:20px;">LinkRevive</h2>
        <p style="margin:4px 0 0; opacity:0.8; font-size:13px;">Dead link fixer • Powered by AI</p>
      </div>
      <div class="lr-body" id="lr-body">
        <div style="text-align:center; padding:40px 20px;">
          <div style="width:48px;height:48px;border:3px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
          <p>Analyzing link and finding alternatives...</p>
        </div>
      </div>
      <div style="padding:16px 24px; border-top:1px solid #e2e8f0; display:flex; gap:12px; justify-content:flex-end;">
        <button class="lr-btn" id="lr-close">Close</button>
        <button class="lr-btn" id="lr-open-alt" style="display:none;">Open Best Alternative</button>
      </div>
    </div>
  `;

  shadow.appendChild(pill);
  shadow.appendChild(modal);

  // Close handlers
  modal.querySelector('#lr-close')?.addEventListener('click', () => modal.classList.remove('show'));
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };

  document.body.appendChild(host);

  async function showModal(shadowRoot: ShadowRoot, triggerPill: HTMLElement) {
    const modalEl = shadowRoot.querySelector('.lr-modal') as HTMLElement;
    const bodyEl = shadowRoot.querySelector('#lr-body') as HTMLElement;
    modalEl.classList.add('show');
    triggerPill.style.display = 'none';

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Extension': 'true' },
        body: JSON.stringify({ url: window.location.href }),
      });
      const analysis: AnalysisResponse = await res.json();

      bodyEl.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;">${analysis.status.toUpperCase()}</span>
            <span style="color:#64748b;font-size:13px;">${analysis.linkType}</span>
          </div>
          <h3 style="margin:0 0 8px; font-size:18px;">${analysis.explanation?.summary || 'Link revived successfully'}</h3>
        </div>

        ${analysis.archive.hasArchive ? `
          <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:16px;">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">📜 ARCHIVED VERSION</div>
            <a href="${analysis.archive.latest?.waybackUrl}" target="_blank" style="color:#1e40af;text-decoration:underline;font-weight:600;">
              View snapshot from ${analysis.archive.latest?.timestamp}
            </a>
          </div>
        ` : ''}

        <div>
          <div style="font-size:12px;color:#64748b;margin-bottom:8px;">✨ RECOMMENDED ALTERNATIVES</div>
          ${analysis.alternatives.slice(0, 3).map(alt => `
            <a href="${alt.url}" target="_blank" style="display:block; padding:10px 12px; background:#f1f5f9; border-radius:8px; margin-bottom:6px; text-decoration:none; color:#0f172a;">
              <div style="font-weight:600; font-size:14px;">${alt.title}</div>
              <div style="font-size:12px; color:#64748b; margin-top:2px;">${alt.url} • ${Math.round(alt.relevanceScore * 100)}% match</div>
            </a>
          `).join('')}
        </div>

        ${analysis.explanation ? `
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:13px; color:#475569;">
            <strong>What changed:</strong> ${analysis.explanation.whatChanged}<br>
            <strong>Recommendation:</strong> ${analysis.explanation.recommendation}
          </div>
        ` : ''}
      `;

      const openBtn = shadowRoot.querySelector('#lr-open-alt') as HTMLButtonElement;
      if (analysis.alternatives.length > 0) {
        openBtn.style.display = 'block';
        openBtn.onclick = () => window.open(analysis.alternatives[0].url, '_blank');
      }
    } catch (err) {
      bodyEl.innerHTML = `<p style="color:#b91c1c;">Failed to analyze. Please try the web app at linkrevive.com</p>`;
    }
  }
}

// Auto-run on load
if (isLikelyBrokenPage()) {
  setTimeout(() => createOverlay(), 800); // Slight delay for page render
}

// Expose for manual trigger from popup
(window as any).linkReviveTrigger = () => createOverlay();
