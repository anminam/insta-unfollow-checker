// ── Smart Unfollow Recommendations ──
// Scores users by unfollow priority based on ghost/inactive signals.

import { GHOST_AVATAR_PATTERN, calcGhostScore } from '../storage/tier.js';
import { getFirstSeen } from '../storage/preferences.js';
import { getMemos } from '../storage/memo.js';
import { getWhitelist } from '../storage/whitelist.js';
import { isUnstableUser } from '../storage/snapshot.js';

/**
 * @typedef {Object} RecommendedUser
 * @property {Object} user - Instagram user object
 * @property {number} score - Priority score (higher = more recommended to unfollow)
 * @property {string[]} reasons - Human-readable reasons
 */

/**
 * Calculate unfollow priority score for a user.
 * @param {Object} user
 * @param {Object} ctx - { firstSeen, memos, whitelistSet }
 * @returns {{ score: number, reasons: string[] }}
 */
function calcPriority(user, ctx) {
  let score = 0;
  const reasons = [];

  // Ghost account (default avatar)
  const ghostScore = calcGhostScore(user);
  if (ghostScore > 0) {
    score += ghostScore * 20;
    reasons.push('ghost');
  }

  // No profile pic or default pattern
  if (user.profile_pic_url && user.profile_pic_url.includes(GHOST_AVATAR_PATTERN)) {
    score += 15;
    if (!reasons.includes('ghost')) reasons.push('default-avatar');
  }

  // Private account (can't see their content)
  if (user.is_private) {
    score += 5;
    reasons.push('private');
  }

  // Old following (bottom 70% by position = followed long ago)
  if (ctx.firstSeen) {
    const seenDate = ctx.firstSeen[user.id];
    if (seenDate) {
      const daysAgo = (Date.now() - new Date(seenDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo > 180) {
        score += Math.min(Math.floor(daysAgo / 30), 20);
        reasons.push('old-following');
      }
    }
  }

  // No memo/tag (user hasn't categorized = probably not important)
  if (ctx.memos) {
    const memo = ctx.memos[user.id];
    if (!memo || (!memo.text && (!memo.tags || memo.tags.length === 0))) {
      score += 3;
      reasons.push('no-memo');
    }
  }

  // Unstable follower (follows/unfollows repeatedly)
  if (isUnstableUser(user.username)) {
    score += 10;
    reasons.push('unstable');
  }

  // Not verified (lower value account)
  if (!user.is_verified) {
    score += 1;
  }

  return { score, reasons };
}

/**
 * Get smart unfollow recommendations sorted by priority.
 * @param {Object[]} notFollowingBack - users who don't follow back
 * @param {number} limit - max recommendations to return
 * @returns {RecommendedUser[]}
 */
export function getRecommendations(notFollowingBack, limit = 20) {
  const whitelistSet = getWhitelist();
  const firstSeen = getFirstSeen();
  const memos = getMemos();
  const ctx = { firstSeen, memos, whitelistSet };

  const scored = notFollowingBack
    .filter(u => !whitelistSet.has(u.id))
    .map(user => {
      const { score, reasons } = calcPriority(user, ctx);
      return { user, score, reasons };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * Get reason labels for i18n display.
 * @param {string} reason
 * @returns {string} i18n key
 */
export function getReasonKey(reason) {
  const map = {
    'ghost': 'smartGhost',
    'default-avatar': 'smartDefaultAvatar',
    'private': 'smartPrivate',
    'old-following': 'smartOldFollowing',
    'no-memo': 'smartNoMemo',
    'unstable': 'smartUnstable',
  };
  return map[reason] || reason;
}
