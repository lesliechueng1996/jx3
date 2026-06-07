import { describe, expect, it } from 'vitest';
import {
  avatarBackgroundColor,
  avatarInitial,
} from '../../../src/lib/utils/avatar-color';

describe('avatarBackgroundColor', () => {
  it('returns a stable color for the same seed', () => {
    expect(avatarBackgroundColor('user-1')).toBe(
      avatarBackgroundColor('user-1'),
    );
  });
});

describe('avatarInitial', () => {
  it('prefers the first letter of the name', () => {
    expect(avatarInitial('Alice', 'alice@example.com')).toBe('A');
  });

  it('falls back to email when name is missing', () => {
    expect(avatarInitial(null, 'bob@example.com')).toBe('B');
  });

  it('returns U when both name and email are missing', () => {
    expect(avatarInitial(null, null)).toBe('U');
  });
});
