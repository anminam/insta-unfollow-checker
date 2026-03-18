// ── Storage Module ──

export const STORAGE_KEY = 'insta-unfollow-history';
export const SNAPSHOT_KEY = 'insta-analysis-snapshots';
export const MAX_SNAPSHOTS = 20;
export const WHITELIST_KEY = 'insta-whitelist';
export const DARK_MODE_KEY = 'insta-dark-mode';
export const SORT_KEY = 'insta-sort-preference';
export const CACHE_KEY = 'insta-analysis-cache';
export const SCHEDULED_KEY = 'insta-scheduled-unfollow';
export const MEMO_KEY = 'insta-user-memos';
export const ONBOARDING_KEY = 'insta-onboarding-done';
export const SCHEDULED_INTERVAL_KEY = 'insta-scheduled-interval';
export const SCHEDULED_DAILY_LIMIT_KEY = 'insta-scheduled-daily-limit';
export const AUTO_WHITELIST_KEY = 'insta-auto-whitelist';
export const SMART_SCHEDULE_KEY = 'insta-smart-schedule';

export const FIRST_SEEN_KEY = 'insta-first-seen';

export const GHOST_AVATAR_PATTERN = '44884218_345707102882519_';
export const VALID_TAGS = ['friend', 'celeb', 'brand', 'work'];
export const SCHEDULED_DAILY_COUNT_KEY = 'insta-scheduled-daily-count';
export const SCHEDULED_DAILY_DATE_KEY = 'insta-scheduled-daily-date';

export const UNFOLLOW_DELAY_MIN = 3000;
export const UNFOLLOW_DELAY_MAX = 5000;
export const UNFOLLOW_BATCH_SIZE = 10;
export const UNFOLLOW_BATCH_PAUSE = 30000;
export const OLD_FOLLOWING_THRESHOLD = 0.7;

// ── Whitelist ──

export function getWhitelist() {
  try {
    return new Set(JSON.parse(localStorage.getItem(WHITELIST_KEY)) || []);
  } catch {
    return new Set();
  }
}

export function saveWhitelist(set) {
  localStorage.setItem(WHITELIST_KEY, JSON.stringify([...set]));
}

export function isWhitelisted(userId) {
  return getWhitelist().has(userId);
}

export function toggleWhitelist(userId) {
  const wl = getWhitelist();
  if (wl.has(userId)) {
    wl.delete(userId);
  } else {
    wl.add(userId);
  }
  saveWhitelist(wl);
  return wl.has(userId);
}

// ── User Memos ──

export function getMemos() {
  try {
    return JSON.parse(localStorage.getItem(MEMO_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveMemos(memos) {
  localStorage.setItem(MEMO_KEY, JSON.stringify(memos));
}

export function getUserMemo(userId) {
  const memos = getMemos();
  return memos[userId] || null;
}

export function setUserMemo(userId, text, tags) {
  const memos = getMemos();
  if (!text && (!tags || tags.length === 0)) {
    delete memos[userId];
  } else {
    memos[userId] = { text: text || '', tags: tags || [] };
  }
  saveMemos(memos);
}

// ── Unfollow History ──

export function getUnfollowHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveUnfollowHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function recordUnfollow(userId, username) {
  const history = getUnfollowHistory();
  history[userId] = { username, date: new Date().toISOString() };
  saveUnfollowHistory(history);
}

export function removeUnfollowRecord(userId) {
  const history = getUnfollowHistory();
  delete history[userId];
  saveUnfollowHistory(history);
}

export function wasUnfollowed(userId) {
  const history = getUnfollowHistory();
  return !!history[userId];
}

// ── Analysis Cache (sessionStorage) ──

export function getCachedAnalysis() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > 600000) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCachedAnalysis(following, followers, notFollowingBack, mutual, followerOnly, totalFollowing, totalFollowers) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({
    following, followers, notFollowingBack, mutual, followerOnly,
    totalFollowing, totalFollowers,
    timestamp: Date.now()
  }));
}

// ── Analysis Snapshots ──

export function getSnapshots() {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveSnapshot(following, followers, notFollowingBack, followerUsernames, followingUsernames) {
  const snapshots = getSnapshots();
  snapshots.unshift({
    date: new Date().toISOString(),
    following,
    followers,
    notFollowingBack,
    followerUsernames: followerUsernames || [],
    followingUsernames: followingUsernames || []
  });
  if (snapshots.length > MAX_SNAPSHOTS) snapshots.length = MAX_SNAPSHOTS;
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
}

export function deleteSnapshot(index) {
  const snapshots = getSnapshots();
  snapshots.splice(index, 1);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
}

// ── Scheduled Unfollow ──

export function getScheduledQueue() {
  try {
    return JSON.parse(localStorage.getItem(SCHEDULED_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveScheduledQueue(queue) {
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(queue));
}

// ── Sort Preference ──

export function getSortPreference() {
  return localStorage.getItem(SORT_KEY) || 'default';
}

export function saveSortPreference(value) {
  localStorage.setItem(SORT_KEY, value);
}

// ── Scheduled Unfollow Settings ──

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

// ── First Seen ──

export function getFirstSeen() {
  try {
    return JSON.parse(localStorage.getItem(FIRST_SEEN_KEY)) || {};
  } catch {
    return {};
  }
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
    localStorage.setItem(FIRST_SEEN_KEY, JSON.stringify(seen));
  }
}

export function getFirstSeenDate(userId) {
  const seen = getFirstSeen();
  return seen[userId] || null;
}

// ── Malicious Users Cache ──

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

// ── Auto Whitelist ──

export function getAutoWhitelist() {
  return localStorage.getItem(AUTO_WHITELIST_KEY) === 'true';
}

export function saveAutoWhitelist(enabled) {
  localStorage.setItem(AUTO_WHITELIST_KEY, String(enabled));
}

// ── Smart Schedule ──

export function getSmartSchedule() {
  return localStorage.getItem(SMART_SCHEDULE_KEY) === 'true';
}

export function saveSmartSchedule(enabled) {
  localStorage.setItem(SMART_SCHEDULE_KEY, String(enabled));
}

// ── Unstable Followers ──

let unstableUsersCache = null;

export function buildUnstableUsers() {
  const snapshots = getSnapshots();
  if (snapshots.length < 3) { unstableUsersCache = new Set(); return; }
  const recentSnapshots = snapshots.slice(0, Math.min(snapshots.length, 10));
  const toggleCount = {};
  for (let i = 1; i < recentSnapshots.length; i++) {
    const prev = new Set(recentSnapshots[i].followerUsernames || []);
    const curr = new Set(recentSnapshots[i - 1].followerUsernames || []);
    if (prev.size === 0 || curr.size === 0) continue;
    // Users who appeared or disappeared
    for (const u of curr) { if (!prev.has(u)) toggleCount[u] = (toggleCount[u] || 0) + 1; }
    for (const u of prev) { if (!curr.has(u)) toggleCount[u] = (toggleCount[u] || 0) + 1; }
  }
  unstableUsersCache = new Set(Object.entries(toggleCount).filter(([, c]) => c >= 2).map(([u]) => u));
}

export function isUnstableUser(username) {
  return unstableUsersCache ? unstableUsersCache.has(username) : false;
}

// ── Onboarding ──

// ── Ghost Score (shared) ──

export function calcGhostScore(user) {
  let score = 0;
  if (user.profile_pic_url && user.profile_pic_url.includes(GHOST_AVATAR_PATTERN)) score += 40;
  if (user.is_private) score += 20;
  if (!user.full_name || user.full_name.trim() === '') score += 20;
  if (!user.is_verified) score += 10;
  if (user.username && /^\w+\d{4,}$/.test(user.username)) score += 10;
  return Math.min(score, 100);
}

// ── Scheduled Daily Count (persistent) ──

export function getScheduledDailyCount() {
  const savedDate = localStorage.getItem(SCHEDULED_DAILY_DATE_KEY);
  const today = new Date().toDateString();
  if (savedDate !== today) {
    localStorage.setItem(SCHEDULED_DAILY_DATE_KEY, today);
    localStorage.setItem(SCHEDULED_DAILY_COUNT_KEY, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(SCHEDULED_DAILY_COUNT_KEY), 10) || 0;
}

export function incrementScheduledDailyCount() {
  const today = new Date().toDateString();
  localStorage.setItem(SCHEDULED_DAILY_DATE_KEY, today);
  const count = getScheduledDailyCount() + 1;
  localStorage.setItem(SCHEDULED_DAILY_COUNT_KEY, String(count));
  return count;
}

// ── Backup Validation ──

const USERNAME_RE = /^[a-zA-Z0-9_.]{1,30}$/;

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

// ── Onboarding ──

export function isOnboardingDone() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function setOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}
