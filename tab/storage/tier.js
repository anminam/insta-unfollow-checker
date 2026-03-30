// ── Freemium Tier Logic (centralized) ──

import { getDailyCount, incrementDailyCount } from './_base.js';

export const TIER = { FREE: 'free', PREMIUM: 'premium' };

export const FREE_ANALYSIS_LIMIT = 20;
export const FREE_UNFOLLOW_DAILY_LIMIT = 10;

const FREE_UNFOLLOW_COUNT_KEY = 'insta-free-unfollow-count';
const FREE_UNFOLLOW_DATE_KEY = 'insta-free-unfollow-date';

const SCHEDULED_DAILY_COUNT_KEY = 'insta-scheduled-daily-count';
const SCHEDULED_DAILY_DATE_KEY = 'insta-scheduled-daily-date';

// ── Unfollow Rate Constants ──

export const UNFOLLOW_DELAY_MIN = 3000;
export const UNFOLLOW_DELAY_MAX = 5000;
export const UNFOLLOW_BATCH_SIZE = 10;
export const UNFOLLOW_BATCH_PAUSE = 30000;
export const OLD_FOLLOWING_THRESHOLD = 0.7;

// ── Ghost Detection ──

export const GHOST_AVATAR_PATTERN = '44884218_345707102882519_';

export function calcGhostScore(user) {
  let score = 0;
  if (user.profile_pic_url && user.profile_pic_url.includes(GHOST_AVATAR_PATTERN)) score += 40;
  if (user.is_private) score += 20;
  if (!user.full_name || user.full_name.trim() === '') score += 20;
  if (!user.is_verified) score += 10;
  if (user.username && /^\w+\d{4,}$/.test(user.username)) score += 10;
  return Math.min(score, 100);
}

// ── Free Tier Unfollow ──

export function getFreeUnfollowCount() {
  return getDailyCount(FREE_UNFOLLOW_COUNT_KEY, FREE_UNFOLLOW_DATE_KEY);
}

export function incrementFreeUnfollowCount() {
  return incrementDailyCount(FREE_UNFOLLOW_COUNT_KEY, FREE_UNFOLLOW_DATE_KEY);
}

export function canFreeUserUnfollow() {
  const used = getFreeUnfollowCount();
  const remaining = Math.max(0, FREE_UNFOLLOW_DAILY_LIMIT - used);
  return { allowed: remaining > 0, remaining };
}

// ── Scheduled Daily Count ──

export function getScheduledDailyCount() {
  return getDailyCount(SCHEDULED_DAILY_COUNT_KEY, SCHEDULED_DAILY_DATE_KEY);
}

export function incrementScheduledDailyCount() {
  return incrementDailyCount(SCHEDULED_DAILY_COUNT_KEY, SCHEDULED_DAILY_DATE_KEY);
}

// ── Malicious Users Cache (in-memory) ──

let maliciousUsersCache = null;

export function setMaliciousUsers(users) {
  maliciousUsersCache = new Map(users.map(u => [u.username, u.reason]));
}

export function getMaliciousInfo(username) {
  if (!maliciousUsersCache) return null;
  const reason = maliciousUsersCache.get(username.toLowerCase());
  return reason !== undefined ? reason : null;
}

export function isMalicious(username) {
  return getMaliciousInfo(username) !== null;
}

// ── Backup Validation ──

const USERNAME_RE = /^[a-zA-Z0-9_.]{1,30}$/;
const VALID_TAGS = ['friend', 'celeb', 'brand', 'work'];

export function validateBackupData(data) {
  if (!data || typeof data !== 'object') return false;

  if (data.unfollowHistory && typeof data.unfollowHistory === 'object') {
    for (const [, entry] of Object.entries(data.unfollowHistory)) {
      if (typeof entry !== 'object') return false;
      if (entry.username && !USERNAME_RE.test(entry.username)) return false;
    }
  }

  if (data.memos && typeof data.memos === 'object') {
    for (const [, memo] of Object.entries(data.memos)) {
      if (typeof memo !== 'object') return false;
      if (memo.text && typeof memo.text !== 'string') return false;
      if (memo.tags) {
        if (!Array.isArray(memo.tags)) return false;
        if (!memo.tags.every(tag => VALID_TAGS.includes(tag))) return false;
      }
    }
  }

  if (data.scheduledQueue) {
    if (!Array.isArray(data.scheduledQueue)) return false;
    for (const item of data.scheduledQueue) {
      if (item.username && !USERNAME_RE.test(item.username)) return false;
    }
  }

  if (data.whitelist && !Array.isArray(data.whitelist)) return false;

  return true;
}
