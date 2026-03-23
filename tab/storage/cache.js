// ── Analysis Cache (sessionStorage) ──

import { getSessionJSON, setSessionJSON } from './_base.js';

const CACHE_KEY = 'insta-analysis-cache';
const CACHE_TTL = 600000; // 10 minutes

export { CACHE_KEY };

export function getCachedAnalysis() {
  const data = getSessionJSON(CACHE_KEY);
  if (!data) return null;
  if (Date.now() - data.timestamp > CACHE_TTL) {
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
  return data;
}

export function setCachedAnalysis(following, followers, notFollowingBack, mutual, followerOnly, totalFollowing, totalFollowers) {
  setSessionJSON(CACHE_KEY, {
    following, followers, notFollowingBack, mutual, followerOnly,
    totalFollowing, totalFollowers,
    timestamp: Date.now()
  });
}

export function clearCache() {
  sessionStorage.removeItem(CACHE_KEY);
}
