/**
 * Cookie route handlers
 */

import type { CFRequest } from '../types';
import { jsonResponse, parseCookies } from '../utils/headers';

export function handleCookies(request: CFRequest): Response {
  const cookies = parseCookies(request.headers.get('cookie') ?? '');
  return jsonResponse({ cookies }, request);
}

export function handleSetCookies(url: URL): Response {
  const headers = new Headers({ location: '/cookies' });
  for (const [key, value] of url.searchParams) {
    headers.append('set-cookie', `${key}=${value}; Path=/`);
  }
  return new Response(null, { status: 302, headers });
}

export function handleDeleteCookies(url: URL): Response {
  const headers = new Headers({ location: '/cookies' });
  for (const [key] of url.searchParams) {
    headers.append('set-cookie', `${key}=; Path=/; Max-Age=0`);
  }
  return new Response(null, { status: 302, headers });
}
