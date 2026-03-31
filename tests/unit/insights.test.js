import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock snapshot data
let mockSnapshots = [];

vi.mock('../../tab/storage/snapshot.js', () => ({
  getSnapshots: () => mockSnapshots,
}));

// Import after mock setup
const { calcInsights, calcTrend, calcWeeklySummary } = await import('../../tab/modules/insights.js');

describe('calcInsights', () => {
  beforeEach(() => { mockSnapshots = []; });

  it('returns null with less than 2 snapshots', () => {
    mockSnapshots = [{ date: '2026-03-01', followers: 100, followerUsernames: ['a', 'b'] }];
    expect(calcInsights()).toBeNull();
  });

  it('calculates growth and churn', () => {
    mockSnapshots = [
      { date: '2026-03-02', followers: 105, following: 200, followerUsernames: ['a', 'b', 'c', 'd', 'e'] },
      { date: '2026-03-01', followers: 100, following: 195, followerUsernames: ['a', 'b', 'x'] },
    ];
    const result = calcInsights();
    expect(result).not.toBeNull();
    expect(result.newFollowers).toEqual(['c', 'd', 'e']);
    expect(result.lostFollowers).toEqual(['x']);
    expect(result.netChange).toBe(2); // 3 new - 1 lost
    expect(result.growthRate).toBeGreaterThan(0);
    expect(result.churnRate).toBeGreaterThan(0);
  });

  it('handles zero previous followers', () => {
    mockSnapshots = [
      { date: '2026-03-02', followers: 5, followerUsernames: ['a'] },
      { date: '2026-03-01', followers: 0, followerUsernames: [] },
    ];
    const result = calcInsights();
    expect(result.newFollowers).toEqual(['a']);
    expect(result.growthRate).toBe(100); // 1/1 * 100
  });
});

describe('calcTrend', () => {
  it('returns trend arrays in chronological order', () => {
    mockSnapshots = [
      { date: '2026-03-03', followers: 102, following: 200, notFollowingBack: 10 },
      { date: '2026-03-02', followers: 100, following: 198, notFollowingBack: 12 },
      { date: '2026-03-01', followers: 98, following: 195, notFollowingBack: 15 },
    ];
    const trend = calcTrend(10);
    expect(trend.followers).toEqual([98, 100, 102]);
    expect(trend.following).toEqual([195, 198, 200]);
    expect(trend.dates).toHaveLength(3);
  });

  it('respects limit', () => {
    mockSnapshots = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-03-${String(i + 1).padStart(2, '0')}`,
      followers: 100 + i, following: 200, notFollowingBack: 10,
    }));
    const trend = calcTrend(5);
    expect(trend.followers).toHaveLength(5);
  });
});

describe('calcWeeklySummary', () => {
  it('returns null with less than 2 snapshots', () => {
    mockSnapshots = [];
    expect(calcWeeklySummary()).toBeNull();
  });

  it('calculates weekly delta', () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    mockSnapshots = [
      { date: now.toISOString(), followers: 110, following: 200, followerUsernames: ['a', 'b', 'c'] },
      { date: weekAgo.toISOString(), followers: 100, following: 195, followerUsernames: ['a', 'x'] },
    ];
    const summary = calcWeeklySummary();
    expect(summary.followerDelta).toBe(10);
    expect(summary.followingDelta).toBe(5);
    expect(summary.newFollowers).toContain('b');
    expect(summary.newFollowers).toContain('c');
    expect(summary.lostFollowers).toContain('x');
  });
});
