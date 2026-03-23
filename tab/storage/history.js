// ── Unfollow History Storage ──

import { getJSON, setJSON } from './_base.js';

const STORAGE_KEY = 'insta-unfollow-history';

export function getUnfollowHistory() {
  return getJSON(STORAGE_KEY, {});
}

export function saveUnfollowHistory(history) {
  setJSON(STORAGE_KEY, history);
}

export function recordUnfollow(userId, username) {
  const history = getUnfollowHistory();
  history[userId] = { username, date: new Date().toISOString() };
  saveUnfollowHistory(history);
}

export function removeUnfollowRecord(userId) {
  const history = getUnfollowHistory();
  delete history[userId];
  saveUnfollowHistory(history);
}

export function wasUnfollowed(userId) {
  const history = getUnfollowHistory();
  return !!history[userId];
}
