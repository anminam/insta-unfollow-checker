// ── Follower Insights (growth/churn analysis from snapshots) ──

import { getSnapshots } from '../storage/snapshot.js';

/**
 * Calculate follower growth and churn metrics from snapshot history.
 * @returns {{ growthRate: number, churnRate: number, netChange: number,
 *             newFollowers: string[], lostFollowers: string[],
 *             avgDailyGrowth: number, periodDays: number } | null}
 */
export function calcInsights() {
  const snapshots = getSnapshots();
  if (snapshots.length < 2) return null;

  const latest = snapshots[0];
  const previous = snapshots[1];

  const currFollowers = new Set(latest.followerUsernames || []);
  const prevFollowers = new Set(previous.followerUsernames || []);

  const newFollowers = [...currFollowers].filter(u => !prevFollowers.has(u));
  const lostFollowers = [...prevFollowers].filter(u => !currFollowers.has(u));

  const prevCount = prevFollowers.size || 1;
  const growthRate = (newFollowers.length / prevCount) * 100;
  const churnRate = (lostFollowers.length / prevCount) * 100;
  const netChange = newFollowers.length - lostFollowers.length;

  // Average daily growth across all snapshots
  const periodDays = calcPeriodDays(snapshots);
  const totalChange = (latest.followers || 0) - (snapshots[snapshots.length - 1].followers || 0);
  const avgDailyGrowth = periodDays > 0 ? totalChange / periodDays : 0;

  return { growthRate, churnRate, netChange, newFollowers, lostFollowers, avgDailyGrowth, periodDays };
}

/**
 * Calculate trend data for charting (last N snapshots).
 * @param {number} limit
 * @returns {{ dates: string[], followers: number[], following: number[], notFollowing: number[] }}
 */
export function calcTrend(limit = 10) {
  const snapshots = getSnapshots().slice(0, limit).reverse();
  return {
    dates: snapshots.map(s => s.date),
    followers: snapshots.map(s => s.followers || 0),
    following: snapshots.map(s => s.following || 0),
    notFollowing: snapshots.map(s => s.notFollowingBack || 0),
  };
}

/**
 * Get weekly summary (last 7 days of snapshots).
 * @returns {{ followerDelta: number, followingDelta: number,
 *             newFollowers: string[], lostFollowers: string[] } | null}
 */
export function calcWeeklySummary() {
  const snapshots = getSnapshots();
  if (snapshots.length < 2) return null;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recent = snapshots[0];
  const weekOld = snapshots.find(s => new Date(s.date).getTime() <= weekAgo) || snapshots[snapshots.length - 1];

  const currFollowers = new Set(recent.followerUsernames || []);
  const oldFollowers = new Set(weekOld.followerUsernames || []);

  return {
    followerDelta: (recent.followers || 0) - (weekOld.followers || 0),
    followingDelta: (recent.following || 0) - (weekOld.following || 0),
    newFollowers: [...currFollowers].filter(u => !oldFollowers.has(u)),
    lostFollowers: [...oldFollowers].filter(u => !currFollowers.has(u)),
  };
}

function calcPeriodDays(snapshots) {
  if (snapshots.length < 2) return 0;
  const first = new Date(snapshots[snapshots.length - 1].date).getTime();
  const last = new Date(snapshots[0].date).getTime();
  return Math.max(1, Math.round((last - first) / (24 * 60 * 60 * 1000)));
}
