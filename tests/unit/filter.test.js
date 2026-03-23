import { describe, it, expect } from 'vitest';

// Inline filter logic for testing (matches tab/modules/filter.js)
function getFilteredUsers(users, { search = '', verified = false, ghost = false, tag = null, sort = 'default' } = {}) {
  let result = [...users];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(u =>
      u.username.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  }

  if (verified) {
    result = result.filter(u => u.is_verified);
  }

  if (ghost) {
    const GHOST_PATTERN = '44884218_345707102882519_';
    result = result.filter(u => u.profile_pic_url && u.profile_pic_url.includes(GHOST_PATTERN));
  }

  switch (sort) {
    case 'name':
      result.sort((a, b) => a.username.localeCompare(b.username));
      break;
    case 'verified':
      result.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
      break;
  }

  return result;
}

const users = [
  { id: '1', username: 'alice', full_name: 'Alice Kim', is_verified: true, profile_pic_url: 'normal.jpg' },
  { id: '2', username: 'bob99', full_name: 'Bob Lee', is_verified: false, profile_pic_url: 'normal.jpg' },
  { id: '3', username: 'charlie', full_name: '', is_verified: false, profile_pic_url: '44884218_345707102882519_ghost.jpg' },
  { id: '4', username: 'diana', full_name: 'Diana Park', is_verified: true, profile_pic_url: 'normal.jpg' },
];

describe('getFilteredUsers', () => {
  it('should return all users with no filters', () => {
    expect(getFilteredUsers(users)).toHaveLength(4);
  });

  it('should filter by search (case insensitive)', () => {
    const result = getFilteredUsers(users, { search: 'ALI' });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('alice');
  });

  it('should search by full_name', () => {
    const result = getFilteredUsers(users, { search: 'park' });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('diana');
  });

  it('should filter verified users', () => {
    const result = getFilteredUsers(users, { verified: true });
    expect(result).toHaveLength(2);
    expect(result.every(u => u.is_verified)).toBe(true);
  });

  it('should filter ghost accounts', () => {
    const result = getFilteredUsers(users, { ghost: true });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('charlie');
  });

  it('should combine search + verified filter', () => {
    const result = getFilteredUsers(users, { search: 'a', verified: true });
    expect(result).toHaveLength(2); // alice and diana both contain 'a' and are verified
  });

  it('should sort by name', () => {
    const result = getFilteredUsers(users, { sort: 'name' });
    expect(result.map(u => u.username)).toEqual(['alice', 'bob99', 'charlie', 'diana']);
  });

  it('should sort verified first', () => {
    const result = getFilteredUsers(users, { sort: 'verified' });
    expect(result[0].is_verified).toBe(true);
    expect(result[1].is_verified).toBe(true);
  });

  it('should return empty array for empty input', () => {
    expect(getFilteredUsers([])).toHaveLength(0);
  });

  it('should return empty when search matches nothing', () => {
    const result = getFilteredUsers(users, { search: 'zzzzz' });
    expect(result).toHaveLength(0);
  });
});
