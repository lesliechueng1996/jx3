const AVATAR_PALETTE = [
  '#b91c1c',
  '#c2410c',
  '#b45309',
  '#15803d',
  '#0f766e',
  '#0369a1',
  '#1d4ed8',
  '#6d28d9',
  '#a21caf',
  '#be185d',
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function avatarBackgroundColor(seed: string): string {
  const index = hashString(seed) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index] ?? AVATAR_PALETTE[0];
}

export function avatarInitial(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const fromName = name?.trim().charAt(0);
  if (fromName) {
    return fromName.toUpperCase();
  }
  const fromEmail = email?.trim().charAt(0);
  if (fromEmail) {
    return fromEmail.toUpperCase();
  }
  return 'U';
}
