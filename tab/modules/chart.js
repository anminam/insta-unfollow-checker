// ── Chart Module (Chart.js) ──

import { t } from './i18n.js';
import { getSnapshots } from '../storage/snapshot.js';
import { show, hide } from './ui.js';

let chartInstance = null;

export function drawStatsChart(canvasEl, sectionEl) {
  const snapshots = getSnapshots();
  const canvas = canvasEl || document.getElementById('stats-chart');
  const section = sectionEl || document.getElementById('stats-section');

  if (snapshots.length < 2) {
    hide(section);
    return;
  }

  show(section);

  const data = snapshots.slice(0, 10).reverse();
  const labels = data.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#6b7280' : '#9ca3af';

  // Destroy previous instance
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const ctx = canvas.getContext('2d');

  // Gradient fills
  const makeGradient = (color, alpha) => {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight);
    grad.addColorStop(0, color.replace('1)', `${alpha})`).replace(')', `, ${alpha})`));
    grad.addColorStop(1, 'transparent');
    return grad;
  };

  const colors = {
    followers: isDark ? '#60a5fa' : '#3b82f6',
    following: isDark ? '#fbbf24' : '#f59e0b',
    notFollowing: isDark ? '#f87171' : '#ef4444'
  };

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('chartFollowers'),
          data: data.map(d => d.followers),
          borderColor: colors.followers,
          backgroundColor: `${colors.followers}18`,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.followers,
          pointBorderColor: isDark ? '#141418' : '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: t('chartFollowing'),
          data: data.map(d => d.following),
          borderColor: colors.following,
          backgroundColor: `${colors.following}18`,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.following,
          pointBorderColor: isDark ? '#141418' : '#ffffff',
          pointBorderWidth: 2
        },
        {
          label: t('chartNotFollowing'),
          data: data.map(d => d.notFollowingBack),
          borderColor: colors.notFollowing,
          backgroundColor: `${colors.notFollowing}18`,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.notFollowing,
          pointBorderColor: isDark ? '#141418' : '#ffffff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'center',
          labels: {
            color: textColor,
            font: { size: 11, weight: '600' },
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(30,30,36,0.95)' : 'rgba(255,255,255,0.95)',
          titleColor: isDark ? '#ececf0' : '#1a1a1a',
          bodyColor: isDark ? '#8e8e9a' : '#737373',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          titleFont: { size: 12, weight: '700' },
          bodyFont: { size: 12 },
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          callbacks: {
            labelPointStyle: () => ({ pointStyle: 'circle', rotation: 0 })
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: textColor,
            font: { size: 10, weight: '500' },
            padding: 8
          },
          border: { display: false }
        },
        y: {
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: textColor,
            font: { size: 10, weight: '500' },
            padding: 8,
            maxTicksLimit: 5
          },
          border: { display: false }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });
}
