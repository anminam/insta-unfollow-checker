// ── Filter Module ──
// Pure function: receives all state as parameters

import { GHOST_AVATAR_PATTERN } from './storage.js';

export function getFilteredUsers({ analysisData, currentTab, searchQuery, filterVerified, filterGhost, filterTag, sortValue, whitelistSet, firstSeen, memos }) {
  if (!analysisData) return [];

  let users;
  switch (currentTab) {
    case 'following': users = [...analysisData.following]; break;
    case 'followers': users = [...analysisData.followers]; break;
    case 'mutual': users = [...analysisData.mutual]; break;
    case 'not-following': users = [...analysisData.notFollowingBack]; break;
    case 'follower-only': users = [...analysisData.followerOnly]; break;
    case 'whitelist': {
      const wl = whitelistSet || new Set();
      const allUsers = [...analysisData.following, ...analysisData.followers];
      const seen = new Set();
      users = allUsers.filter(u => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        return wl.has(u.id);
      });
      break;
    }
    default: users = [];
  }

  // Search filter
  const query = (searchQuery || '').trim().toLowerCase();
  if (query) {
    users = users.filter(u =>
      u.username.toLowerCase().includes(query) ||
      (u.full_name && u.full_name.toLowerCase().includes(query))
    );
  }

  // Verified filter
  if (filterVerified) {
    users = users.filter(u => u.is_verified);
  }

  // Ghost filter
  if (filterGhost) {
    users = users.filter(u => u.profile_pic_url && u.profile_pic_url.includes(GHOST_AVATAR_PATTERN));
  }

  // Tag filter
  if (filterTag && memos) {
    users = users.filter(u => {
      const memo = memos[u.id];
      return memo && memo.tags && memo.tags.includes(filterTag);
    });
  }

  // Sort
  if (sortValue === 'name') {
    users.sort((a, b) => a.username.localeCompare(b.username));
  } else if (sortValue === 'verified') {
    users.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
  } else if (sortValue === 'oldest') {
    users.reverse();
  } else if (sortValue === 'first-seen' && firstSeen) {
    users.sort((a, b) => {
      const da = firstSeen[a.id] || '';
      const db = firstSeen[b.id] || '';
      return da.localeCompare(db);
    });
  } else if (sortValue === 'popular') {
    users.sort((a, b) => {
      const scoreA = (a.is_verified ? 2 : 0) + (a.is_private ? 0 : 1);
      const scoreB = (b.is_verified ? 2 : 0) + (b.is_private ? 0 : 1);
      return scoreB - scoreA;
    });
  } else if (sortValue === 'ghost-score') {
    users.sort((a, b) => {
      const gs = (u) => {
        let s = 0;
        if (u.profile_pic_url && u.profile_pic_url.includes(GHOST_AVATAR_PATTERN)) s += 40;
        if (u.is_private) s += 20;
        if (!u.full_name || u.full_name.trim() === '') s += 20;
        if (!u.is_verified) s += 10;
        if (u.username && /^\w+\d{4,}$/.test(u.username)) s += 10;
        return Math.min(s, 100);
      };
      return gs(b) - gs(a);
    });
  }

  return users;
}
