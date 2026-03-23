// ── User Preferences Storage ──

import { getJSON, setJSON } from './_base.js';

const SORT_KEY = 'insta-sort-preference';
const ONBOARDING_KEY = 'insta-onboarding-done';
const SCHEDULED_KEY = 'insta-scheduled-unfollow';
const SCHEDULED_INTERVAL_KEY = 'insta-scheduled-interval';
const SCHEDULED_DAILY_LIMIT_KEY = 'insta-scheduled-daily-limit';
const SMART_SCHEDULE_KEY = 'insta-smart-schedule';
const FIRST_SEEN_KEY = 'insta-first-seen';
const DARK_MODE_KEY = 'insta-dark-mode';

// ── Sort ──

export function getSortPreference() {
  return localStorage.getItem(SORT_KEY) || 'default';
}

export function saveSortPreference(value) {
  localStorage.setItem(SORT_KEY, value);
}

// ── Dark Mode ──

export { DARK_MODE_KEY };

// ── Onboarding ──

export function isOnboardingDone() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function setOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

// ── Scheduled Unfollow Queue ──

export function getScheduledQueue() {
  return getJSON(SCHEDULED_KEY, []);
}

export function saveScheduledQueue(queue) {
  setJSON(SCHEDULED_KEY, queue);
}

// ── Scheduled Settings ──

export function getScheduledInterval() {
  return parseInt(localStorage.getItem(SCHEDULED_INTERVAL_KEY), 10) || 4;
}

export function saveScheduledInterval(minutes) {
  localStorage.setItem(SCHEDULED_INTERVAL_KEY, String(minutes));
}

export function getScheduledDailyLimit() {
  return parseInt(localStorage.getItem(SCHEDULED_DAILY_LIMIT_KEY), 10) || 50;
}

export function saveScheduledDailyLimit(limit) {
  localStorage.setItem(SCHEDULED_DAILY_LIMIT_KEY, String(limit));
}

// ── Smart Schedule ──

export function getSmartSchedule() {
  return localStorage.getItem(SMART_SCHEDULE_KEY) === 'true';
}

export function saveSmartSchedule(enabled) {
  localStorage.setItem(SMART_SCHEDULE_KEY, String(enabled));
}

// ── First Seen ──

export function getFirstSeen() {
  return getJSON(FIRST_SEEN_KEY, {});
}

export function recordFirstSeen(users) {
  const seen = getFirstSeen();
  const now = new Date().toISOString();
  let changed = false;
  users.forEach(u => {
    if (!seen[u.id]) {
      seen[u.id] = now;
      changed = true;
    }
  });
  if (changed) {
    setJSON(FIRST_SEEN_KEY, seen);
  }
}

export function getFirstSeenDate(userId) {
  const seen = getFirstSeen();
  return seen[userId] || null;
}
