const IG_APP_ID = '936619743392459';
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;
const AUTO_ANALYSIS_ALARM = 'insta-auto-analysis';

// ── Google Auth Config ──
const ALLOWLIST_SHEET_ID = '1pRuzceKGPEEAGY9rOD9J3ZsRcSVEmmoqQJpHVfR-Wjs';
const ALLOWLIST_RANGE = '사용자!A:B';
const AUTH_STORAGE_KEY = 'insta-auth';
const AUTH_CACHE_TTL = 24 * 60 * 60 * 1000;

// ── Rate Limit Utilities ──

function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, maxRetries = MAX_RETRIES) {
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

async function getCsrfToken() {
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

async function getCurrentUserId() {
  const cookie = await chrome.cookies.get({
    url: 'https://www.instagram.com',
    name: 'ds_user_id'
  });
  if (!cookie) {
    throw new Error('NOT_LOGGED_IN');
  }
  return cookie.value;
}

async function fetchAllFollowing(userId, csrfToken, sendProgress) {
  const following = [];
  let hasNext = true;
  let endCursor = '';
  let page = 0;

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
      is_verified: edge.node.is_verified
    }));

    following.push(...users);
    hasNext = edgeFollow.page_info.has_next_page;
    endCursor = edgeFollow.page_info.end_cursor;
    page++;

    sendProgress('following', following.length, edgeFollow.count);
    if (hasNext) await randomDelay(1000, 2000);
  }

  return following;
}

async function fetchAllFollowers(userId, csrfToken, sendProgress) {
  const followers = [];
  let hasNext = true;
  let endCursor = '';
  let page = 0;

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
      is_verified: edge.node.is_verified
    }));

    followers.push(...users);
    hasNext = edgeFollowedBy.page_info.has_next_page;
    endCursor = edgeFollowedBy.page_info.end_cursor;
    page++;

    sendProgress('followers', followers.length, edgeFollowedBy.count);
    if (hasNext) await randomDelay(1000, 2000);
  }

  return followers;
}

function findNotFollowingBack(following, followers) {
  const followerIds = new Set(followers.map(u => u.id));
  return following.filter(u => !followerIds.has(u.id));
}

async function followUser(userId, csrfToken) {
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

async function unfollowUser(userId, csrfToken) {
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

// ── Google Auth ──

function getOAuthURL() {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2.client_id;
  const scopes = manifest.oauth2.scopes.join(' ');
  const redirectUrl = chrome.identity.getRedirectURL();
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=token&scope=${encodeURIComponent(scopes)}`;
}

async function googleLogin() {
  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: getOAuthURL(),
    interactive: true
  });

  const hashParams = new URL(responseUrl.replace('#', '?')).searchParams;
  const token = hashParams.get('access_token');
  if (!token) throw new Error('GOOGLE_API_ERROR');

  // Get user email
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!userInfoRes.ok) throw new Error('GOOGLE_API_ERROR');
  const userInfo = await userInfoRes.json();
  const email = userInfo.email;
  if (!email) throw new Error('GOOGLE_NO_EMAIL');

  // Check allowlist, register if new
  const { authorized, pending } = await checkAllowlist(token, email);

  // Save token + auth state
  await chrome.storage.local.set({
    [AUTH_STORAGE_KEY]: { email, authorized, token, timestamp: Date.now() }
  });

  return { email, authorized, pending };
}

async function checkAllowlist(token, email) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${ALLOWLIST_SHEET_ID}/values/${encodeURIComponent(ALLOWLIST_RANGE)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[InstaUnfollow] Sheet read failed:', res.status, body);
    throw new Error('SHEET_ACCESS_ERROR');
  }
  const data = await res.json();
  const values = data.values || [];

  const emailLower = email.toLowerCase();
  const row = values.find(r => (r[0] || '').trim().toLowerCase() === emailLower);

  if (!row) {
    await registerUser(token, email);
    return { authorized: false, pending: true };
  }

  const approved = (row[1] || '').trim().length > 0;
  return { authorized: approved, pending: !approved };
}

async function registerUser(token, email) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${ALLOWLIST_SHEET_ID}/values/${encodeURIComponent('사용자!A:B')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [[email]]
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[InstaUnfollow] Sheet write failed:', res.status, body);
    throw new Error('SHEET_WRITE_ERROR');
  }
}

async function googleLogout() {
  try {
    const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
    const auth = result[AUTH_STORAGE_KEY];
    if (auth?.token) {
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${auth.token}`);
    }
  } catch { /* ignore */ }
  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
}

async function getAuthStatus() {
  const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
  const auth = result[AUTH_STORAGE_KEY];
  if (!auth || !auth.authorized) return { authorized: false };

  if (Date.now() - auth.timestamp > AUTH_CACHE_TTL) {
    // Token expired, need re-login
    await chrome.storage.local.remove(AUTH_STORAGE_KEY);
    return { authorized: false };
  }

  return { authorized: true, email: auth.email };
}

// ── Auto Analysis (Alarm) ──

async function runAutoAnalysis() {
  try {
    const csrfToken = await getCsrfToken();
    const userId = await getCurrentUserId();
    const noop = () => {};

    const following = await fetchAllFollowing(userId, csrfToken, noop);
    const followers = await fetchAllFollowers(userId, csrfToken, noop);
    const notFollowingBack = findNotFollowingBack(following, followers);

    // Save snapshot to storage
    const { 'insta-analysis-snapshots': snapshots = [] } = await chrome.storage.local.get('insta-analysis-snapshots');
    const followerUsernames = followers.map(u => u.username);
    const followingUsernames = following.map(u => u.username);

    snapshots.unshift({
      date: new Date().toISOString(),
      following: following.length,
      followers: followers.length,
      notFollowingBack: notFollowingBack.length,
      followerUsernames,
      followingUsernames,
      auto: true
    });
    if (snapshots.length > 20) snapshots.length = 20;
    await chrome.storage.local.set({ 'insta-analysis-snapshots': snapshots });

    // Compute badge: compare with previous snapshot
    if (snapshots.length >= 2) {
      const prev = snapshots[1];
      const diff = followers.length - (prev.followers || 0);
      if (diff !== 0) {
        const text = diff > 0 ? `+${diff}` : `${diff}`;
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color: diff > 0 ? '#00c853' : '#ed4956' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    }

    console.log('[InstaUnfollow] Auto analysis complete:', {
      following: following.length,
      followers: followers.length,
      notFollowingBack: notFollowingBack.length
    });
  } catch (error) {
    console.error('[InstaUnfollow] Auto analysis failed:', error);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === AUTO_ANALYSIS_ALARM) {
    runAutoAnalysis();
  }
});

// ── Message Handler ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // async response
});

async function handleMessage(message, sender) {
  try {
    switch (message.action) {
      case 'ANALYZE': {
        const csrfToken = await getCsrfToken();
        const userId = await getCurrentUserId();

        const sendProgress = (phase, current, total) => {
          chrome.runtime.sendMessage({
            action: 'PROGRESS',
            data: { phase, current, total }
          }).catch(() => {});
        };

        const following = await fetchAllFollowing(userId, csrfToken, sendProgress);
        const followers = await fetchAllFollowers(userId, csrfToken, sendProgress);
        const notFollowingBack = findNotFollowingBack(following, followers);

        return {
          success: true,
          data: {
            following,
            followers,
            notFollowingBack,
            totalFollowing: following.length,
            totalFollowers: followers.length
          }
        };
      }

      case 'UNFOLLOW_USER': {
        const csrfToken = await getCsrfToken();
        const result = await unfollowUser(message.data.userId, csrfToken);
        return { success: result };
      }

      case 'FOLLOW_USER': {
        const csrfToken = await getCsrfToken();
        const result = await followUser(message.data.userId, csrfToken);
        return { success: result };
      }

      case 'SET_AUTO_ANALYSIS': {
        if (message.data.enabled) {
          const period = message.data.periodMinutes || 1440; // default 24h
          await chrome.alarms.create(AUTO_ANALYSIS_ALARM, { periodInMinutes: period });
        } else {
          await chrome.alarms.clear(AUTO_ANALYSIS_ALARM);
        }
        chrome.action.setBadgeText({ text: '' });
        return { success: true };
      }

      case 'GET_AUTO_ANALYSIS_STATUS': {
        const alarm = await chrome.alarms.get(AUTO_ANALYSIS_ALARM);
        return { success: true, data: { enabled: !!alarm, scheduledTime: alarm?.scheduledTime } };
      }

      case 'CLEAR_BADGE': {
        chrome.action.setBadgeText({ text: '' });
        return { success: true };
      }

      case 'GOOGLE_LOGIN': {
        const result = await googleLogin();
        return { success: true, data: result };
      }

      case 'GOOGLE_LOGOUT': {
        await googleLogout();
        return { success: true };
      }

      case 'GET_AUTH_STATUS': {
        const status = await getAuthStatus();
        return { success: true, data: status };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    console.error('[InstaUnfollow]', error);
    return { success: false, error: error.message };
  }
}
