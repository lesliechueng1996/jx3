import { getRequestHeaders } from '@tanstack/react-start/server';

export async function appendServerCookies(headers: Headers): Promise<void> {
  const cookie = getRequestHeaders().get('cookie');

  if (cookie) {
    headers.set('cookie', cookie);
  }
}
