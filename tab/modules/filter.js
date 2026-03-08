// ── Filter Module ──
// Pure function: receives all state as parameters

export function getFilteredUsers({ analysisData, currentTab, searchQuery, filterVerified, sortValue }) {
  if (!analysisData) return [];

  let users;
  switch (currentTab) {
    case 'following': users = [...analysisData.following]; break;
    case 'followers': users = [...analysisData.followers]; break;
    case 'mutual': users = [...analysisData.mutual]; break;
    case 'not-following': users = [...analysisData.notFollowingBack]; break;
    case 'follower-only': users = [...analysisData.followerOnly]; break;
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

  // Sort
  if (sortValue === 'name') {
    users.sort((a, b) => a.username.localeCompare(b.username));
  } else if (sortValue === 'verified') {
    users.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
  } else if (sortValue === 'oldest') {
    users.reverse();
  }

  return users;
}
