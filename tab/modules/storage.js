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

export const FIRST_SEEN_KEY = 'insta-first-seen';

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

// ── Onboarding ──

export function isOnboardingDone() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function setOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}
