// ── Memo & Tag Storage ──

import { getJSON, setJSON } from './_base.js';

const MEMO_KEY = 'insta-user-memos';

export const VALID_TAGS = ['friend', 'celeb', 'brand', 'work'];

export function getMemos() {
  return getJSON(MEMO_KEY, {});
}

export function saveMemos(memos) {
  setJSON(MEMO_KEY, memos);
}

export function getUserMemo(userId) {
  const memos = getMemos();
  return memos[userId] || null;
}

export function setUserMemo(userId, text, tags) {
  const memos = getMemos();
  if (!text && (!tags || tags.length === 0)) {
    delete memos[userId];
  } else {
    memos[userId] = { text: text || '', tags: tags || [] };
  }
  saveMemos(memos);
}
