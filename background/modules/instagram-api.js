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
    let response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      console.warn(`[InstaUnfollow] Network error (retry ${i + 1}/${maxRetries}):`, err.message);
      if (i < maxRetries - 1) {
        // Exponential backoff: 3s → 6s → 12s (with jitter)
        const backoff = Math.min(3000 * Math.pow(2, i), 30000);
        const jitter = Math.random() * 2000;
        await new Promise(r => setTimeout(r, backoff + jitter));
        continue;
      }
      throw new Error('NETWORK_ERROR');
    }
    if (response.status === 429) {
      // Exponential backoff: 60s → 120s → 240s (max 300s, with jitter)
      const backoff = Math.min(60000 * Math.pow(2, i), 300000);
      const jitter = Math.random() * 10000;
      console.warn(`[InstaUnfollow] Rate limited, backoff ${Math.round((backoff + jitter) / 1000)}s (retry ${i + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, backoff + jitter));
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

async function fetchAllPaginated(userId, csrfToken, sendProgress, queryHash, edgeKey, progressLabel) {
  const result = [];
  let hasNext = true;
  let endCursor = '';

  while (hasNext) {
    const variables = JSON.stringify({
      id: userId,
      first: BATCH_SIZE,
      after: endCursor
    });
    const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(variables)}`;

    const response = await fetchWithRetry(url, {
      headers: getHeaders(csrfToken),
      credentials: 'include'
    });
    const data = await response.json();
    const edge = data?.data?.user?.[edgeKey];

    if (!edge) {
      throw new Error('API_CHANGED');
    }

    const users = edge.edges.map(e => ({
      id: e.node.id,
      username: e.node.username,
      full_name: e.node.full_name,
      profile_pic_url: e.node.profile_pic_url,
      is_verified: e.node.is_verified,
      is_private: e.node.is_private
    }));

    result.push(...users);
    hasNext = edge.page_info.has_next_page;
    endCursor = edge.page_info.end_cursor;

    sendProgress(progressLabel, result.length, edge.count);
    if (hasNext) await randomDelay(1000, 2000);
  }

  return result;
}

export function fetchAllFollowing(userId, csrfToken, sendProgress) {
  return fetchAllPaginated(userId, csrfToken, sendProgress, 'd04b0a864b4b54837c0d870b0e77e076', 'edge_follow', 'following');
}

export function fetchAllFollowers(userId, csrfToken, sendProgress) {
  return fetchAllPaginated(userId, csrfToken, sendProgress, 'c76146de99bb02f6415203be841dd25a', 'edge_followed_by', 'followers');
}

export function findNotFollowingBack(following, followers) {
  const followerIds = new Set(followers.map(u => u.id));
  return following.filter(u => !followerIds.has(u.id));
}

async function friendshipAction(userId, csrfToken, endpoints, failError) {
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
  throw new Error(failError);
}

export function followUser(userId, csrfToken) {
  return friendshipAction(userId, csrfToken, [
    `https://www.instagram.com/api/v1/friendships/create/${userId}/`,
    `https://www.instagram.com/web/friendships/${userId}/follow/`
  ], 'FOLLOW_FAILED');
}

export function unfollowUser(userId, csrfToken) {
  return friendshipAction(userId, csrfToken, [
    `https://www.instagram.com/api/v1/friendships/destroy/${userId}/`,
    `https://www.instagram.com/web/friendships/${userId}/unfollow/`
  ], 'UNFOLLOW_FAILED');
}
