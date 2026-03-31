import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
let mockWhitelist = new Set();
let mockFirstSeen = {};
let mockMemos = {};

vi.mock('../../tab/storage/tier.js', () => ({
  GHOST_AVATAR_PATTERN: '44884218_345707102882519_',
  calcGhostScore: (user) => {
    if (user.profile_pic_url && user.profile_pic_url.includes('44884218_345707102882519_')) return 3;
    return 0;
  },
}));

vi.mock('../../tab/storage/preferences.js', () => ({
  getFirstSeen: () => mockFirstSeen,
}));

vi.mock('../../tab/storage/memo.js', () => ({
  getMemos: () => mockMemos,
}));

vi.mock('../../tab/storage/whitelist.js', () => ({
  getWhitelist: () => mockWhitelist,
}));

vi.mock('../../tab/storage/snapshot.js', () => ({
  isUnstableUser: (username) => username === 'flipflop',
}));

const { getRecommendations, getReasonKey } = await import('../../tab/modules/smart-unfollow.js');

const makeUser = (id, username, overrides = {}) => ({
  id, username, full_name: '', is_verified: false, is_private: false,
  profile_pic_url: 'normal.jpg', ...overrides,
});

describe('getRecommendations', () => {
  beforeEach(() => {
    mockWhitelist = new Set();
    mockFirstSeen = {};
    mockMemos = {};
  });

  it('returns empty for empty input', () => {
    expect(getRecommendations([])).toEqual([]);
  });

  it('excludes whitelisted users', () => {
    mockWhitelist = new Set(['u1']);
    const users = [makeUser('u1', 'protected'), makeUser('u2', 'other')];
    const recs = getRecommendations(users);
    expect(recs.find(r => r.user.id === 'u1')).toBeUndefined();
  });

  it('scores ghost accounts higher', () => {
    const users = [
      makeUser('u1', 'ghost', { profile_pic_url: '44884218_345707102882519_ghost.jpg' }),
      makeUser('u2', 'normal'),
    ];
    const recs = getRecommendations(users);
    expect(recs[0].user.username).toBe('ghost');
    expect(recs[0].reasons).toContain('ghost');
  });

  it('scores old followings higher', () => {
    const oldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    mockFirstSeen = { u1: oldDate, u2: new Date().toISOString() };
    const users = [makeUser('u1', 'old-follow'), makeUser('u2', 'new-follow')];
    const recs = getRecommendations(users);
    const old = recs.find(r => r.user.username === 'old-follow');
    expect(old).toBeDefined();
    expect(old.reasons).toContain('old-following');
  });

  it('scores unstable users higher', () => {
    const users = [makeUser('u1', 'flipflop'), makeUser('u2', 'stable')];
    const recs = getRecommendations(users);
    const flipflop = recs.find(r => r.user.username === 'flipflop');
    expect(flipflop).toBeDefined();
    expect(flipflop.reasons).toContain('unstable');
  });

  it('respects limit parameter', () => {
    const users = Array.from({ length: 50 }, (_, i) =>
      makeUser(`u${i}`, `user${i}`, { profile_pic_url: '44884218_345707102882519_ghost.jpg' })
    );
    const recs = getRecommendations(users, 5);
    expect(recs).toHaveLength(5);
  });

  it('scores private accounts', () => {
    const users = [makeUser('u1', 'locked', { is_private: true })];
    const recs = getRecommendations(users);
    expect(recs[0].reasons).toContain('private');
  });
});

describe('getReasonKey', () => {
  it('maps known reasons to i18n keys', () => {
    expect(getReasonKey('ghost')).toBe('smartGhost');
    expect(getReasonKey('old-following')).toBe('smartOldFollowing');
    expect(getReasonKey('unstable')).toBe('smartUnstable');
  });

  it('returns original for unknown reason', () => {
    expect(getReasonKey('custom')).toBe('custom');
  });
});
