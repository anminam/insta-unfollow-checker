// ── Analysis Snapshot Storage ──

import { getJSON, setJSON } from './_base.js';

const SNAPSHOT_KEY = 'insta-analysis-snapshots';
const MAX_SNAPSHOTS = 20;

export { MAX_SNAPSHOTS };

export function getSnapshots() {
  return getJSON(SNAPSHOT_KEY, []);
}

export function saveSnapshot(following, followers, notFollowingBack, followerUsernames, followingUsernames, followerIdMap, followingIdMap) {
  const snapshots = getSnapshots();
  snapshots.unshift({
    date: new Date().toISOString(),
    following,
    followers,
    notFollowingBack,
    followerUsernames: followerUsernames || [],
    followingUsernames: followingUsernames || [],
    followerIdMap: followerIdMap || null,
    followingIdMap: followingIdMap || null
  });
  if (snapshots.length > MAX_SNAPSHOTS) snapshots.length = MAX_SNAPSHOTS;
  setJSON(SNAPSHOT_KEY, snapshots);
}

export function deleteSnapshot(index) {
  const snapshots = getSnapshots();
  snapshots.splice(index, 1);
  setJSON(SNAPSHOT_KEY, snapshots);
}

// ── Unstable Followers (computed from snapshots) ──

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
    for (const u of curr) { if (!prev.has(u)) toggleCount[u] = (toggleCount[u] || 0) + 1; }
    for (const u of prev) { if (!curr.has(u)) toggleCount[u] = (toggleCount[u] || 0) + 1; }
  }
  unstableUsersCache = new Set(Object.entries(toggleCount).filter(([, c]) => c >= 2).map(([u]) => u));
}

export function isUnstableUser(username) {
  return unstableUsersCache ? unstableUsersCache.has(username) : false;
}
