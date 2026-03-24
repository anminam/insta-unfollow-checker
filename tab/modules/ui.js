// ── UI Utilities Module ──

import { t } from './i18n.js';
import { UNFOLLOW_DELAY_MIN, UNFOLLOW_DELAY_MAX, UNFOLLOW_BATCH_SIZE, UNFOLLOW_BATCH_PAUSE, getMaliciousInfo } from '../storage/tier.js';

// ── HTML Escape ──

const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => escapeMap[c]);
}

export function usernameLink(u) {
  const safe = escapeHtml(u);
  const reason = getMaliciousInfo(u);
  if (reason !== null) {
    const tooltip = escapeHtml(t('maliciousTooltip', reason));
    return `<a href="https://www.instagram.com/${encodeURIComponent(u)}/" target="_blank" rel="noopener">@${safe}</a><span class="badge-malicious" data-tooltip="${tooltip}">${t('malicious')}</span>`;
  }
  return `<a href="https://www.instagram.com/${encodeURIComponent(u)}/" target="_blank" rel="noopener">@${safe}</a>`;
}

export function show(el) {
  el.classList.remove('hidden');
}

export function hide(el) {
  el.classList.add('hidden');
}

export function showConfirm(message) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirm-modal');
    const msg = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    msg.textContent = message;
    show(modal);
    const cleanup = (result) => {
      hide(modal);
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
      resolve(result);
    };
    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}

export function showToast(message, type = '', action = null) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast${type ? ` toast-${type}` : ''}`;
  toast.textContent = message;

  if (action) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.callback();
      toast.remove();
    });
    toast.appendChild(btn);
  }

  container.appendChild(toast);
  const duration = action ? 5000 : 3000;
  setTimeout(() => toast.remove(), duration);
}

export function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatEta(totalSeconds) {
  const sec = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? t('etaRemaining', m, s) : t('etaRemainingSeconds', s);
}

export function estimateEta(completed, total) {
  const remaining = total - completed;
  if (remaining <= 0) return 0;

  const avgDelay = (UNFOLLOW_DELAY_MIN + UNFOLLOW_DELAY_MAX) / 2 / 1000;
  const avgBatchPause = (UNFOLLOW_BATCH_PAUSE + 2500) / 1000;

  let eta = remaining * avgDelay;

  let pauses = 0;
  for (let i = 1; i <= remaining; i++) {
    if ((completed + i) % UNFOLLOW_BATCH_SIZE === 0 && (completed + i) < total) {
      pauses++;
    }
  }
  eta += pauses * avgBatchPause;

  return eta;
}

export function countdownDelay(seconds, onTick) {
  return new Promise(resolve => {
    let remaining = seconds;
    onTick(remaining);
    const timer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timer);
        resolve();
      } else {
        onTick(remaining);
      }
    }, 1000);
  });
}

export function formatDate(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return t('minutesAgo', diffMin);
  if (diffHour < 24) return t('hoursAgo', diffHour);
  if (diffDay < 7) return t('daysAgo', diffDay);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export const FALLBACK_AVATAR = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 44 44%22><rect fill=%22%23efefef%22 width=%2244%22 height=%2244%22 rx=%2222%22/><text x=%2222%22 y=%2228%22 text-anchor=%22middle%22 fill=%22%23bbb%22 font-size=%2218%22>?</text></svg>';

export async function loadImageAsBlob(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return FALLBACK_AVATAR;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return FALLBACK_AVATAR;
  }
}

export function getErrorText(errorCode) {
  return t(errorCode) || `${t('error')}: ${errorCode}`;
}

// ── Dark Mode ──

export function initDarkMode(darkModeBtn) {
  const saved = localStorage.getItem('insta-dark-mode');
  let isDark;
  if (saved !== null) {
    isDark = saved === 'true';
  } else {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyDarkMode(isDark, darkModeBtn);
}

export function applyDarkMode(isDark, darkModeBtn) {
  document.documentElement.classList.toggle('dark', isDark);
  darkModeBtn.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19';
}

export function toggleDarkMode(darkModeBtn) {
  const isDark = !document.documentElement.classList.contains('dark');
  applyDarkMode(isDark, darkModeBtn);
  localStorage.setItem('insta-dark-mode', String(isDark));
}
