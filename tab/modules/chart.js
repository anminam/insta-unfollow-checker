// ── Chart Module ──

import { t } from './i18n.js';
import { getSnapshots } from './storage.js';
import { show, hide } from './ui.js';

export function drawStatsChart() {
  const snapshots = getSnapshots();
  const canvas = document.getElementById('stats-chart');
  const section = document.getElementById('stats-section');

  if (snapshots.length < 2) {
    hide(section);
    return;
  }

  show(section);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const data = snapshots.slice(0, 10).reverse();
  const pad = { top: 24, right: 20, bottom: 38, left: 52 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  let allValues = [];
  data.forEach(d => allValues.push(d.following, d.followers, d.notFollowingBack));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const style = getComputedStyle(document.documentElement);
  const colorFollowers = style.getPropertyValue('--chart-line-followers').trim();
  const colorFollowing = style.getPropertyValue('--chart-line-following').trim();
  const colorNotFollowing = style.getPropertyValue('--chart-line-notfollowing').trim();
  const colorGrid = style.getPropertyValue('--chart-grid').trim();
  const colorText = style.getPropertyValue('--chart-text').trim();
  const bgCard = style.getPropertyValue('--bg-card').trim();

  ctx.fillStyle = bgCard;
  ctx.fillRect(0, 0, w, h);

  // Grid lines + Y axis values
  ctx.strokeStyle = colorGrid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();

    const val = Math.round(maxVal - (range / 4) * i);
    ctx.fillStyle = colorText;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, pad.left - 8, y + 3);
  }

  // Y axis label
  ctx.save();
  ctx.translate(10, pad.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colorText;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('chartAxisCount'), 0, 0);
  ctx.restore();

  // X axis dates
  ctx.fillStyle = colorText;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const x = pad.left + (chartW / (data.length - 1)) * i;
    const date = new Date(d.date);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    ctx.fillText(label, x, h - 16);
  });

  // X axis label
  ctx.fillStyle = colorText;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('chartAxisDate'), pad.left + chartW / 2, h - 4);

  // Data lines
  const drawLine = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.left + (chartW / (data.length - 1)) * i;
      const y = pad.top + chartH - ((d[key] - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    data.forEach((d, i) => {
      const x = pad.left + (chartW / (data.length - 1)) * i;
      const y = pad.top + chartH - ((d[key] - minVal) / range) * chartH;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  drawLine('followers', colorFollowers);
  drawLine('following', colorFollowing);
  drawLine('notFollowingBack', colorNotFollowing);

  // Legend
  const legends = [
    { label: t('chartFollowers'), color: colorFollowers },
    { label: t('chartFollowing'), color: colorFollowing },
    { label: t('chartNotFollowing'), color: colorNotFollowing }
  ];
  let lx = pad.left;
  ctx.font = '10px sans-serif';
  legends.forEach(leg => {
    ctx.fillStyle = leg.color;
    ctx.fillRect(lx, 6, 12, 3);
    ctx.fillStyle = colorText;
    ctx.textAlign = 'left';
    ctx.fillText(leg.label, lx + 15, 12);
    lx += ctx.measureText(leg.label).width + 30;
  });
}
