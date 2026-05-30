import { describe, expect, it } from 'vitest';
import {
  avatarBackgroundColor,
  avatarInitial,
} from '../../src/lib/avatar-color';

describe('avatarInitial', () => {
  it('uses first letter of name when available', () => {
    expect(avatarInitial('Alice', 'bob@example.com')).toBe('A');
  });

  it('falls back to email then U', () => {
    expect(avatarInitial(undefined, 'bob@example.com')).toBe('B');
    expect(avatarInitial(null, null)).toBe('U');
  });
});

describe('avatarBackgroundColor', () => {
  it('returns a stable color for the same seed', () => {
    expect(avatarBackgroundColor('user-1')).toBe(
      avatarBackgroundColor('user-1'),
    );
  });
});
