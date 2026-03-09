// ── Instagram API Module ──

const IG_APP_ID = '936619743392459';
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

// ── Rate Limit Utilities ──

export function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(url, options, maxRetries = MAX_RETRIES) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      console.warn(`[InstaUnfollow] Rate limited, waiting 60-90s (retry ${i + 1}/${maxRetries})`);
      await randomDelay(60000, 90000);
      continue;
    }
    if (response.status === 401) {
      throw new Error('NOT_LOGGED_IN');
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('NOT_LOGGED_IN');
    }
    return response;
  }
  throw new Error('RATE_LIMITED');
}

// ── Cookie Utilities ──

export async function getCsrfToken() {
  const cookie = await chrome.cookies.get({
    url: 'https://www.instagram.com',
    name: 'csrftoken'
  });
  if (!cookie) {
    throw new Error('NOT_LOGGED_IN');
  }
  return cookie.value;
}

function getHeaders(csrfToken) {
  return {
    'x-ig-app-id': IG_APP_ID,
    'x-csrftoken': csrfToken,
    'x-requested-with': 'XMLHttpRequest'
  };
}

// ── Instagram API ──

export async function getCurrentUserId() {
  const cookie = await chrome.cookies.get({
    url: 'https://www.instagram.com',
    name: 'ds_user_id'
  });
  if (!cookie) {
    throw new Error('NOT_LOGGED_IN');
  }
  return cookie.value;
}

export async function fetchAllFollowing(userId, csrfToken, sendProgress) {
  const following = [];
  let hasNext = true;
  let endCursor = '';

  while (hasNext) {
    const variables = JSON.stringify({
      id: userId,
      first: BATCH_SIZE,
      after: endCursor
    });
    const url = `https://www.instagram.com/graphql/query/?query_hash=d04b0a864b4b54837c0d870b0e77e076&variables=${encodeURIComponent(variables)}`;

    const response = await fetchWithRetry(url, {
      headers: getHeaders(csrfToken),
      credentials: 'include'
    });
    const data = await response.json();
    const edgeFollow = data?.data?.user?.edge_follow;

    if (!edgeFollow) {
      throw new Error('API_CHANGED');
    }

    const users = edgeFollow.edges.map(edge => ({
      id: edge.node.id,
      username: edge.node.username,
      full_name: edge.node.full_name,
      profile_pic_url: edge.node.profile_pic_url,
      is_verified: edge.node.is_verified,
      is_private: edge.node.is_private
    }));

    following.push(...users);
    hasNext = edgeFollow.page_info.has_next_page;
    endCursor = edgeFollow.page_info.end_cursor;

    sendProgress('following', following.length, edgeFollow.count);
    if (hasNext) await randomDelay(1000, 2000);
  }

  return following;
}

export async function fetchAllFollowers(userId, csrfToken, sendProgress) {
  const followers = [];
  let hasNext = true;
  let endCursor = '';

  while (hasNext) {
    const variables = JSON.stringify({
      id: userId,
      first: BATCH_SIZE,
      after: endCursor
    });
    const url = `https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=${encodeURIComponent(variables)}`;

    const response = await fetchWithRetry(url, {
      headers: getHeaders(csrfToken),
      credentials: 'include'
    });
    const data = await response.json();
    const edgeFollowedBy = data?.data?.user?.edge_followed_by;

    if (!edgeFollowedBy) {
      throw new Error('API_CHANGED');
    }

    const users = edgeFollowedBy.edges.map(edge => ({
      id: edge.node.id,
      username: edge.node.username,
      full_name: edge.node.full_name,
      profile_pic_url: edge.node.profile_pic_url,
      is_verified: edge.node.is_verified,
      is_private: edge.node.is_private
    }));

    followers.push(...users);
    hasNext = edgeFollowedBy.page_info.has_next_page;
    endCursor = edgeFollowedBy.page_info.end_cursor;

    sendProgress('followers', followers.length, edgeFollowedBy.count);
    if (hasNext) await randomDelay(1000, 2000);
  }

  return followers;
}

export function findNotFollowingBack(following, followers) {
  const followerIds = new Set(followers.map(u => u.id));
  return following.filter(u => !followerIds.has(u.id));
}

export async function followUser(userId, csrfToken) {
  const endpoints = [
    `https://www.instagram.com/api/v1/friendships/create/${userId}/`,
    `https://www.instagram.com/web/friendships/${userId}/follow/`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          ...getHeaders(csrfToken),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: 'include'
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) continue;
      const data = await response.json();
      if (data.status === 'ok' || data.friendship_status) return true;
    } catch (error) {
      if (error.message === 'RATE_LIMITED' || error.message === 'NOT_LOGGED_IN') throw error;
      continue;
    }
  }
  throw new Error('FOLLOW_FAILED');
}

export async function unfollowUser(userId, csrfToken) {
  const endpoints = [
    `https://www.instagram.com/api/v1/friendships/destroy/${userId}/`,
    `https://www.instagram.com/web/friendships/${userId}/unfollow/`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          ...getHeaders(csrfToken),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        credentials: 'include'
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        continue;
      }
      const data = await response.json();
      if (data.status === 'ok' || data.friendship_status) return true;
    } catch (error) {
      if (error.message === 'RATE_LIMITED' || error.message === 'NOT_LOGGED_IN') throw error;
      continue;
    }
  }
  throw new Error('UNFOLLOW_FAILED');
}
