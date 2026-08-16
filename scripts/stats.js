import * as state from './state.js';
import { t } from './i18n.js';
import { escapeHtml } from './utils.js';

export function recordUsage(emoji) {
  const stats = { ...state.get('stats') };
  stats.counts = { ...(stats.counts || {}) };
  stats.firstSeen = { ...(stats.firstSeen || {}) };
  stats.lastUsed = { ...(stats.lastUsed || {}) };

  stats.counts[emoji] = (stats.counts[emoji] || 0) + 1;
  const now = Date.now();
  if (!stats.firstSeen[emoji]) stats.firstSeen[emoji] = now;
  stats.lastUsed[emoji] = now;
  state.set('stats', stats);
}

export function totalCopies() {
  const counts = state.get('stats').counts || {};
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export function uniqueCount() {
  return Object.keys(state.get('stats').counts || {}).length;
}

export function topUsed(n = 10) {
  const counts = state.get('stats').counts || {};
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export function resetStats() {
  state.set('stats', { counts: {}, firstSeen: {}, lastUsed: {} });
}

function statCard(titleKey, value) {
  return `
      <div class="stats-card">
        <h3>${escapeHtml(t(titleKey))}</h3>
        <div class="stat-number">${escapeHtml(String(value))}</div>
      </div>`;
}

export function renderDashboard(container) {
  if (!container) return;
  const total = totalCopies();
  const unique = uniqueCount();
  const top = topUsed(10);
  const favCount = state.get('favorites').length;
  const collCount = state.get('collections').length;
  const maxCount = top.length ? top[0][1] : 1;

  container.innerHTML = `
    <div class="stats-section">
      ${statCard('statsTotalCopies', total)}
      ${statCard('statsUniqueEmojis', unique)}
      ${statCard('statsFavCount', favCount)}
      ${statCard('statsCollectionsCount', collCount)}
    </div>
    <div class="stats-card">
      <h3>${escapeHtml(t('statsTopUsed'))}</h3>
      <div id="topUsedChart"></div>
    </div>
    <div class="stats-actions">
      <button class="btn btn-danger" id="resetStatsBtn">${escapeHtml(t('btnReset'))}</button>
    </div>
  `;

  const chart = container.querySelector('#topUsedChart');
  if (!top.length) {
    const empty = document.createElement('div');
    empty.className = 'grid-status';
    empty.textContent = t('emptyRecent');
    chart.appendChild(empty);
  } else {
    // Counter keys come from persisted state, which an imported file can
    // supply — build the row with DOM APIs so nothing is ever parsed as HTML,
    // and set the bar width through CSSOM rather than a style attribute.
    top.forEach(([emoji, count]) => {
      const row = document.createElement('div');
      row.className = 'chart-bar';

      const label = document.createElement('span');
      label.className = 'bar-emoji';
      label.textContent = emoji;

      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = `${Math.max(2, (count / maxCount) * 100)}%`;
      track.appendChild(fill);

      const value = document.createElement('span');
      value.className = 'bar-value';
      value.textContent = String(count);

      row.append(label, track, value);
      chart.appendChild(row);
    });
  }

  const btn = container.querySelector('#resetStatsBtn');
  btn.addEventListener('click', () => {
    if (confirm(t('confirmResetStats'))) {
      resetStats();
      renderDashboard(container);
    }
  });
}
