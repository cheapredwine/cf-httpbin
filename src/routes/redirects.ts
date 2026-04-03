/**
 * Redirect route handlers
 */

import type { CFRequest } from '../types';
import { jsonResponse } from '../utils/headers';

export function handleRedirect(match: RegExpMatchArray, url: URL, request: CFRequest): Response {
  const value = match[1]!;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1 || String(n) !== value) {
    return jsonResponse({ error: 'Invalid count', status: 400 }, request, 400);
  }
  if (n === 1) return Response.redirect(new URL('/get', url).href, 302);
  return Response.redirect(new URL(`/redirect/${n - 1}`, url).href, 302);
}

export function handleAbsoluteRedirect(match: RegExpMatchArray, url: URL, request: CFRequest): Response {
  const value = match[1]!;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1 || String(n) !== value) {
    return jsonResponse({ error: 'Invalid count', status: 400 }, request, 400);
  }
  if (n === 1) return Response.redirect(new URL('/get', url).href, 302);
  return Response.redirect(new URL(`/absolute-redirect/${n - 1}`, url).href, 302);
}

export function handleRelativeRedirect(match: RegExpMatchArray, request: CFRequest): Response {
  const value = match[1]!;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1 || String(n) !== value) {
    return jsonResponse({ error: 'Invalid count', status: 400 }, request, 400);
  }
  if (n === 1) return new Response(null, { status: 302, headers: { location: '/get' } });
  return new Response(null, {
    status: 302,
    headers: { location: `/relative-redirect/${n - 1}` },
  });
}

export function handleRedirectTo(url: URL, request: CFRequest): Response {
  const target = url.searchParams.get('url');
  if (!target) return jsonResponse({ error: 'Missing url param', status: 400 }, request, 400);
  const statusCode = parseInt(url.searchParams.get('status_code') ?? '302', 10);
  return Response.redirect(target, statusCode);
}
