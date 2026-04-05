// ── Dashboard Insights (Notable Changes + Sparkline) ──

import { t } from './i18n.js';
import { calcInsights, calcTrend } from './insights.js';
import { show, hide } from './ui.js';

/**
 * Build notable-changes insight items from snapshot data.
 * @returns {{ icon: string, text: string, value: string, cls: string }[]}
 */
function buildInsightItems() {
  const data = calcInsights();
  if (!data) return [];

  const items = [];
  const { newFollowers, lostFollowers, netChange, growthRate, churnRate, avgDailyGrowth } = data;

  // Mass unfollow detection (5+ lost)
  if (lostFollowers.length >= 5) {
    items.push({
      icon: '🚨',
      text: t('insightMassUnfollow', lostFollowers.length),
      value: `-${lostFollowers.length}`,
      cls: 'negative'
    });
  }

  // New follower surge (5+ gained)
  if (newFollowers.length >= 5) {
    items.push({
      icon: '🎉',
      text: t('insightMassFollow', newFollowers.length),
      value: `+${newFollowers.length}`,
      cls: 'positive'
    });
  }

  // Net growth
  if (netChange !== 0) {
    items.push({
      icon: netChange > 0 ? '📈' : '📉',
      text: t('insightNetGrowth', netChange),
      value: `${netChange > 0 ? '+' : ''}${netChange}`,
      cls: netChange > 0 ? 'positive' : 'negative'
    });
  }

  // High churn warning
  if (churnRate > 5) {
    items.push({ icon: '⚠️', text: t('insightChurnHigh'), value: `${churnRate.toFixed(1)}%`, cls: 'negative' });
  } else if (avgDailyGrowth > 0 && growthRate > 1) {
    items.push({ icon: '✨', text: t('insightGrowthGood'), value: `+${growthRate.toFixed(1)}%`, cls: 'positive' });
  }

  if (items.length === 0) {
    items.push({ icon: '✅', text: t('insightNoChange'), value: '', cls: '' });
  }

  return items;
}

/**
 * Render insights card into DOM.
 * @param {HTMLElement} container - #insights-list
 * @param {HTMLElement} section - #insights-card
 */
export function renderInsights(container, section) {
  const items = buildInsightItems();
  container.textContent = '';

  items.forEach(({ icon, text, value, cls }) => {
    const row = document.createElement('div');
    row.className = 'insight-item';

    const iconEl = document.createElement('span');
    iconEl.className = 'insight-icon';
    iconEl.textContent = icon;

    const textEl = document.createElement('span');
    textEl.className = 'insight-text';
    textEl.textContent = text;

    row.append(iconEl, textEl);

    if (value) {
      const valEl = document.createElement('span');
      valEl.className = `insight-value ${cls}`;
      valEl.textContent = value;
      row.appendChild(valEl);
    }

    container.appendChild(row);
  });

  show(section);
}

/**
 * Draw a mini sparkline chart (pure canvas, no Chart.js dependency).
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} section
 */
export function drawSparkline(canvas, section) {
  const trend = calcTrend(7);
  if (trend.followers.length < 2) { hide(section); return; }

  show(section);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement.clientWidth;
  const h = 80;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const isDark = document.documentElement.classList.contains('dark');
  const colors = {
    followers: isDark ? '#60a5fa' : '#3b82f6',
    following: isDark ? '#fbbf24' : '#f59e0b',
  };

  const drawLine = (data, color) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padY = 8;
    const padX = 4;
    const stepX = (w - padX * 2) / (data.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    data.forEach((val, i) => {
      const x = padX + i * stepX;
      const y = padY + (1 - (val - min) / range) * (h - padY * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw end dot
    const lastX = padX + (data.length - 1) * stepX;
    const lastY = padY + (1 - (data[data.length - 1] - min) / range) * (h - padY * 2);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  drawLine(trend.followers, colors.followers);
  drawLine(trend.following, colors.following);

  // Legend
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillStyle = colors.followers;
  ctx.fillText('● ' + t('followers'), 4, h - 2);
  ctx.fillStyle = colors.following;
  ctx.fillText('● ' + t('following'), 80, h - 2);
}
