// ── Whitelist Storage ──

import { getJSON, setJSON } from './_base.js';

const WHITELIST_KEY = 'insta-whitelist';
const AUTO_WHITELIST_KEY = 'insta-auto-whitelist';

export function getWhitelist() {
  return new Set(getJSON(WHITELIST_KEY, []));
}

export function saveWhitelist(set) {
  setJSON(WHITELIST_KEY, [...set]);
}

export function isWhitelisted(userId) {
  return getWhitelist().has(userId);
}

export function toggleWhitelist(userId) {
  const wl = getWhitelist();
  if (wl.has(userId)) {
    wl.delete(userId);
  } else {
    wl.add(userId);
  }
  saveWhitelist(wl);
  return wl.has(userId);
}

export function getAutoWhitelist() {
  return localStorage.getItem(AUTO_WHITELIST_KEY) === 'true';
}

export function saveAutoWhitelist(enabled) {
  localStorage.setItem(AUTO_WHITELIST_KEY, String(enabled));
}
