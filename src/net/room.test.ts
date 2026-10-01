import { describe, expect, it } from 'vitest';
import { normalizeCode, randomCode } from './room';

describe('room codes', () => {
  it('normalises typed codes', () => {
    expect(normalizeCode('ab-cde')).toBe('ABCDE');
    expect(normalizeCode('ab0c1d')).toBe('ABCD');
  });

  it('drops characters that look like other letters', () => {
    expect(normalizeCode('IO01XX')).toBe('XX');
  });

  it('caps the length', () => {
    expect(normalizeCode('ABCDEFGH')).toHaveLength(6);
  });

  it('generates unique readable codes', () => {
    const codes = new Set(Array.from({ length: 40 }, () => randomCode()));
    expect(codes.size).toBe(40);
    for (const code of codes) {
      expect(code).toHaveLength(5);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
    }
  });
});
