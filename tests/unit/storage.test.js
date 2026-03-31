import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] ?? null,
  setItem: (key, value) => { storage[key] = String(value); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
};
globalThis.localStorage = mockLocalStorage;

// Inline _base.js utilities
function getJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

describe('Storage _base utilities', () => {
  beforeEach(() => mockLocalStorage.clear());

  it('getJSON returns fallback when key not set', () => {
    expect(getJSON('missing', [])).toEqual([]);
  });

  it('getJSON returns fallback for invalid JSON', () => {
    localStorage.setItem('bad', '{broken');
    expect(getJSON('bad', 'default')).toBe('default');
  });

  it('setJSON/getJSON roundtrip', () => {
    setJSON('test', { a: 1, b: [2, 3] });
    expect(getJSON('test')).toEqual({ a: 1, b: [2, 3] });
  });

  it('setJSON overwrites existing value', () => {
    setJSON('key', 'first');
    setJSON('key', 'second');
    expect(getJSON('key')).toBe('second');
  });
});

describe('Whitelist logic', () => {
  const WL_KEY = 'insta-whitelist';
  beforeEach(() => mockLocalStorage.clear());

  function getWhitelist() {
    return new Set(getJSON(WL_KEY, []));
  }
  function saveWhitelist(set) {
    setJSON(WL_KEY, [...set]);
  }
  function toggleWhitelist(userId) {
    const wl = getWhitelist();
    if (wl.has(userId)) wl.delete(userId);
    else wl.add(userId);
    saveWhitelist(wl);
    return wl.has(userId);
  }

  it('starts empty', () => {
    expect(getWhitelist().size).toBe(0);
  });

  it('toggle adds user', () => {
    expect(toggleWhitelist('u1')).toBe(true);
    expect(getWhitelist().has('u1')).toBe(true);
  });

  it('toggle removes user on second call', () => {
    toggleWhitelist('u1');
    expect(toggleWhitelist('u1')).toBe(false);
    expect(getWhitelist().has('u1')).toBe(false);
  });

  it('preserves multiple users', () => {
    toggleWhitelist('u1');
    toggleWhitelist('u2');
    toggleWhitelist('u3');
    const wl = getWhitelist();
    expect(wl.size).toBe(3);
    expect(wl.has('u2')).toBe(true);
  });
});

describe('Memo logic', () => {
  const MEMO_KEY = 'insta-user-memos';
  beforeEach(() => mockLocalStorage.clear());

  function getMemos() { return getJSON(MEMO_KEY, {}); }
  function setUserMemo(userId, text, tags) {
    const memos = getMemos();
    if (!text && (!tags || tags.length === 0)) {
      delete memos[userId];
    } else {
      memos[userId] = { text: text || '', tags: tags || [] };
    }
    setJSON(MEMO_KEY, memos);
  }

  it('starts empty', () => {
    expect(getMemos()).toEqual({});
  });

  it('sets and gets a memo', () => {
    setUserMemo('u1', 'friend', ['friend']);
    expect(getMemos()['u1']).toEqual({ text: 'friend', tags: ['friend'] });
  });

  it('deletes memo when text and tags empty', () => {
    setUserMemo('u1', 'test', []);
    setUserMemo('u1', '', []);
    expect(getMemos()['u1']).toBeUndefined();
  });

  it('preserves other memos on update', () => {
    setUserMemo('u1', 'a', []);
    setUserMemo('u2', 'b', ['celeb']);
    setUserMemo('u1', 'updated', ['friend']);
    const memos = getMemos();
    expect(memos['u1'].text).toBe('updated');
    expect(memos['u2'].text).toBe('b');
  });
});

describe('History logic', () => {
  const HISTORY_KEY = 'insta-unfollow-history';
  beforeEach(() => mockLocalStorage.clear());

  function getHistory() { return getJSON(HISTORY_KEY, {}); }
  function recordUnfollow(userId, username) {
    const h = getHistory();
    h[userId] = { username, date: new Date().toISOString() };
    setJSON(HISTORY_KEY, h);
  }
  function removeRecord(userId) {
    const h = getHistory();
    delete h[userId];
    setJSON(HISTORY_KEY, h);
  }

  it('records unfollow', () => {
    recordUnfollow('u1', 'alice');
    const h = getHistory();
    expect(h['u1'].username).toBe('alice');
    expect(h['u1'].date).toBeDefined();
  });

  it('removes record', () => {
    recordUnfollow('u1', 'alice');
    removeRecord('u1');
    expect(getHistory()['u1']).toBeUndefined();
  });
});
