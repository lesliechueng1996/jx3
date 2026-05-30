const PUBLIC_PREFIXES = ['/login', '/api/auth'] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function safeRedirectPath(redirect: string | undefined): string {
  if (!redirect) {
    return '/';
  }
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }
  return redirect;
}
