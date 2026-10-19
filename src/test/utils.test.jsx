import { describe, it, expect } from 'vitest';
import { formatCount, isValidUUID, timeAgo, formatDate } from '../utils';

describe('Utility Functions Suite', () => {
  it('1. isValidUUID correctly validates UUID v4 strings and rejects numeric IDs', () => {
    expect(isValidUUID('c3b7a5a8-4395-4672-8822-4946631ad18e')).toBe(true);
    expect(isValidUUID('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d')).toBe(true);

    // Rejects non-UUIDs / numeric IDs
    expect(isValidUUID('1')).toBe(false);
    expect(isValidUUID('12345')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID(null)).toBe(false);
  });

  it('2. formatCount formats numbers with K, M, and plain representations', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(42)).toBe('42');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1000)).toBe('1K');
    expect(formatCount(1500)).toBe('1.5K');
    expect(formatCount(1000000)).toBe('1M');
    expect(formatCount(2500000)).toBe('2.5M');
  });

  it('3. timeAgo produces expected relative time tokens', () => {
    const now = new Date();
    expect(timeAgo(now.toISOString())).toBe('just now');

    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(timeAgo(fiveMinsAgo.toISOString())).toBe('5m');

    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
    expect(timeAgo(threeHoursAgo.toISOString())).toBe('3h');

    const fourDaysAgo = new Date(now.getTime() - 4 * 86400 * 1000);
    expect(timeAgo(fourDaysAgo.toISOString())).toBe('4d');
  });

  it('4. formatDate returns readable string', () => {
    const d = new Date('2026-05-15T12:00:00Z');
    expect(formatDate(d.toISOString())).toMatch(/2026/);
    expect(formatDate('')).toBe('');
  });
});
