// ── Google Auth Module ──

const ALLOWLIST_SHEET_ID = '1pRuzceKGPEEAGY9rOD9J3ZsRcSVEmmoqQJpHVfR-Wjs';
const ALLOWLIST_RANGE = '사용자!A:B';
const AUTH_STORAGE_KEY = 'insta-auth';
const AUTH_CACHE_TTL = 24 * 60 * 60 * 1000;

export async function googleLogin() {
  const result = await chrome.identity.getAuthToken({ interactive: true });
  const token = result.token || result;
  if (!token) throw new Error('GOOGLE_API_ERROR');

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!userInfoRes.ok) throw new Error('GOOGLE_API_ERROR');
  const userInfo = await userInfoRes.json();
  const email = userInfo.email;
  if (!email) throw new Error('GOOGLE_NO_EMAIL');

  let premium = false;
  let pending = false;
  try {
    const result = await checkAllowlist(token, email);
    premium = result.authorized;
    pending = result.pending;
  } catch {
    // fail-open: Sheets API 에러 시 로그인 성공, premium=false
  }

  await chrome.storage.local.set({
    [AUTH_STORAGE_KEY]: { email, premium, timestamp: Date.now() }
  });

  return { email, premium, pending };
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

export async function googleLogout() {
  try {
    const token = await getFreshToken();
    if (token) await chrome.identity.removeCachedAuthToken({ token });
  } catch { /* ignore */ }
  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
}

// ── Malicious Users ──

const MALICIOUS_RANGE = '악성유저!A:B';
const REPORT_RANGE = '신고!A:C';

async function getFreshToken() {
  const result = await chrome.identity.getAuthToken({ interactive: false });
  const token = result.token || result;
  if (!token) throw new Error('NOT_LOGGED_IN');
  return token;
}

export async function fetchMaliciousUsers() {
  const token = await getFreshToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${ALLOWLIST_SHEET_ID}/values/${encodeURIComponent(MALICIOUS_RANGE)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.warn('[InstaUnfollow] Malicious list fetch failed:', res.status);
    return [];
  }
  const data = await res.json();
  const values = data.values || [];
  return values.map(row => ({
    username: (row[0] || '').trim().toLowerCase(),
    reason: (row[1] || '').trim()
  })).filter(r => r.username);
}

export async function reportMaliciousUser(username, reason) {
  const token = await getFreshToken();
  const authResult = await chrome.storage.local.get(AUTH_STORAGE_KEY);
  const email = authResult[AUTH_STORAGE_KEY]?.email || 'unknown';

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${ALLOWLIST_SHEET_ID}/values/${encodeURIComponent(REPORT_RANGE)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [[email, username, reason]]
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[InstaUnfollow] Report write failed:', res.status, body);
    throw new Error('SHEET_WRITE_ERROR');
  }
  return true;
}

export async function getAuthStatus() {
  const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
  const auth = result[AUTH_STORAGE_KEY];
  if (!auth || !auth.email) return { loggedIn: false };

  if (Date.now() - auth.timestamp > AUTH_CACHE_TTL) {
    await chrome.storage.local.remove(AUTH_STORAGE_KEY);
    return { loggedIn: false };
  }

  return { loggedIn: true, premium: !!auth.premium, email: auth.email };
}
