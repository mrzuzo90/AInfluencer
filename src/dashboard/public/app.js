const REFRESH_MS = 15000;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function renderStatus(status) {
  const pills = document.getElementById('status-pills');
  const items = Object.entries(status.integrations).map(
    ([name, on]) => `<span class="pill ${on ? 'on' : ''}">${escapeHtml(name)}</span>`
  );
  pills.innerHTML = items.join('');

  const summary = document.getElementById('schedule-summary');
  summary.innerHTML = `
    <div>Próxima ejecución: <strong>${escapeHtml(status.scheduler.time)}</strong> ${status.scheduler.enabled ? '(scheduler activo)' : '(scheduler desactivado)'}</div>
    <div>Cadencia hybrid: <strong>1 de cada ${escapeHtml(status.hybrid.ratio)}</strong> posts ${status.hybrid.enabled ? '' : '(desactivado)'}</div>
    <div>Modo: <strong>${status.publishLive ? 'live' : 'draft'}</strong>${status.publishVideo ? ' + video' : ''}</div>
  `;
}

function scoreBar(label, value, cls) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return `
    <div class="bar-row">
      <span class="bar-label">${label}</span>
      <span class="bar-track"><span class="bar-fill ${cls}" style="width:${pct}%"></span></span>
      <span class="bar-value">${pct}</span>
    </div>
  `;
}

function renderArticles(articles) {
  const container = document.getElementById('scoring-list');
  if (!articles.length) {
    container.innerHTML = '<div class="empty">Sin artículos evaluados todavía.</div>';
    return;
  }
  container.innerHTML = articles.map((a) => `
    <div class="scoring-item">
      <span class="title">${escapeHtml(a.title)} <span class="dim">· ${escapeHtml(a.category || a.source)}</span></span>
      <div class="bars">
        ${scoreBar('Trending', a.trendingScore, 'trending')}
        ${scoreBar('Monetización', a.monetizationScore, 'monetization')}
        ${scoreBar('Final', a.finalScore, 'final')}
      </div>
    </div>
  `).join('');
}

function renderPosts(posts) {
  const tbody = document.querySelector('#posts-table tbody');
  if (!posts.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Sin posts todavía.</td></tr>';
    return;
  }
  tbody.innerHTML = posts.map((p) => `
    <tr>
      <td><span class="status-badge ${escapeHtml(p.status)}">${escapeHtml(p.status)}</span></td>
      <td>${escapeHtml(p.platform)}</td>
      <td>${fmtTime(p.publishedAt)}</td>
      <td>${escapeHtml((p.content || '').slice(0, 80))}${p.content && p.content.length > 80 ? '…' : ''}</td>
    </tr>
  `).join('');
}

function renderAnalytics({ today, weekly }) {
  const el = document.getElementById('analytics-summary');
  const weekPosts = weekly.reduce((s, r) => s + r.totalPosts, 0);
  const weekImpr = weekly.reduce((s, r) => s + r.totalImpressions, 0);
  el.innerHTML = `
    <div class="stat"><div class="num">${today ? today.totalPosts : 0}</div><div class="label">Posts hoy</div></div>
    <div class="stat"><div class="num">${today ? today.totalImpressions.toLocaleString() : 0}</div><div class="label">Impressions hoy</div></div>
    <div class="stat"><div class="num">${weekPosts}</div><div class="label">Posts (7d)</div></div>
    <div class="stat"><div class="num">${weekImpr.toLocaleString()}</div><div class="label">Impressions (7d)</div></div>
    ${today && today.topPost ? `<div class="stat" style="grid-column:1/-1"><div class="label">Top post hoy</div><div>${escapeHtml(today.topPost.postId)} · ${(today.topPost.engagementRate * 100).toFixed(1)}% engagement</div></div>` : ''}
  `;
}

function appendFeedLine(text, status) {
  const feed = document.getElementById('live-feed');
  const line = document.createElement('div');
  line.className = `feed-line ${status || ''}`;
  const ts = new Date().toLocaleTimeString();
  line.innerHTML = `<span class="ts">${ts}</span>${escapeHtml(text)}`;
  feed.appendChild(line);
  feed.scrollTop = feed.scrollHeight;
  while (feed.children.length > 200) feed.removeChild(feed.firstChild);
}

function setPhase(text) {
  document.getElementById('live-phase').textContent = text;
}

function connectEvents() {
  const source = new EventSource('/api/events');

  source.addEventListener('snapshot', (e) => {
    const { current, history } = JSON.parse(e.data);
    const feed = document.getElementById('live-feed');
    feed.innerHTML = '';
    const run = current || history[0];
    if (run) {
      appendFeedLine(`Run ${run.kind} — ${run.status}`, run.status === 'error' ? 'error' : 'done');
      run.steps.forEach((s) => appendFeedLine(`${s.label}${s.detail ? ` (${s.detail})` : ''}`, s.status === 'error' ? 'error' : s.status === 'done' ? 'done' : ''));
      setPhase(run.status === 'running' ? `Ejecutando: ${run.steps.at(-1)?.label || run.kind}` : `Último run: ${run.kind} (${run.status})`);
    }
  });

  source.addEventListener('run-start', (e) => {
    const run = JSON.parse(e.data);
    appendFeedLine(`▶ Nuevo run: ${run.kind}`, '');
    setPhase(`Ejecutando: ${run.kind}`);
  });

  source.addEventListener('step', (e) => {
    const { step } = JSON.parse(e.data);
    appendFeedLine(`${step.label}${step.detail ? ` (${step.detail})` : ''}`, step.status === 'error' ? 'error' : step.status === 'done' ? 'done' : '');
    if (step.status === 'running') setPhase(`Ejecutando: ${step.label}`);
  });

  source.addEventListener('run-end', (e) => {
    const run = JSON.parse(e.data);
    appendFeedLine(`■ Run finalizado: ${run.status}${run.summary ? ` — ${run.summary}` : ''}`, run.status === 'error' ? 'error' : 'done');
    setPhase(`Último run: ${run.kind} (${run.status})`);
    refreshAll();
  });

  source.onerror = () => {
    setPhase('Reconectando…');
  };
}

async function refreshAll() {
  try {
    const [status, articles, posts, analytics] = await Promise.all([
      fetchJson('/api/status'),
      fetchJson('/api/articles?limit=15'),
      fetchJson('/api/posts?limit=15'),
      fetchJson('/api/analytics'),
    ]);
    renderStatus(status);
    renderArticles(articles);
    renderPosts(posts);
    renderAnalytics(analytics);
  } catch (err) {
    console.error('Dashboard refresh failed', err);
  }
}

refreshAll();
setInterval(refreshAll, REFRESH_MS);
connectEvents();
