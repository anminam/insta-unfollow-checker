// ── Google Auth Module ──

const ALLOWLIST_SHEET_ID = '1pRuzceKGPEEAGY9rOD9J3ZsRcSVEmmoqQJpHVfR-Wjs';
const ALLOWLIST_RANGE = '사용자!A:B';
const AUTH_STORAGE_KEY = 'insta-auth';
const AUTH_CACHE_TTL = 24 * 60 * 60 * 1000;

function getOAuthURL() {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2.client_id;
  const scopes = manifest.oauth2.scopes.join(' ');
  const redirectUrl = chrome.identity.getRedirectURL();
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=token&scope=${encodeURIComponent(scopes)}`;
}

export async function googleLogin() {
  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: getOAuthURL(),
    interactive: true
  });

  const hashParams = new URL(responseUrl.replace('#', '?')).searchParams;
  const token = hashParams.get('access_token');
  if (!token) throw new Error('GOOGLE_API_ERROR');

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!userInfoRes.ok) throw new Error('GOOGLE_API_ERROR');
  const userInfo = await userInfoRes.json();
  const email = userInfo.email;
  if (!email) throw new Error('GOOGLE_NO_EMAIL');

  const { authorized, pending } = await checkAllowlist(token, email);

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

export async function googleLogout() {
  try {
    const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
    const auth = result[AUTH_STORAGE_KEY];
    if (auth?.token) {
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${auth.token}`);
    }
  } catch { /* ignore */ }
  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
}

export async function getAuthStatus() {
  const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
  const auth = result[AUTH_STORAGE_KEY];
  if (!auth || !auth.authorized) return { authorized: false };

  if (Date.now() - auth.timestamp > AUTH_CACHE_TTL) {
    await chrome.storage.local.remove(AUTH_STORAGE_KEY);
    return { authorized: false };
  }

  return { authorized: true, email: auth.email };
}
