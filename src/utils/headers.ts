/**
 * Header utility functions
 */

import type { CookieMap } from '../types';

/**
 * Convert Headers object to plain object
 */
export function headersToObj(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of headers) {
    obj[k] = v;
  }
  return obj;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    'unknown'
  );
}

/**
 * Parse Cookie header into object
 */
export function parseCookies(cookieHeader: string): CookieMap {
  const cookies: CookieMap = {};
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) cookies[k.trim()] = v.join('=').trim();
  }
  return cookies;
}

/**
 * Determine if JSON should be pretty-printed based on request
 * Checks for ?pretty=1/0 query param or Accept: text/html header
 */
export function shouldPrettyPrint(request: Request): boolean {
  const url = new URL(request.url);
  const prettyParam = url.searchParams.get('pretty');
  const acceptsHtml = request.headers.get('accept')?.includes('text/html') ?? false;

  // Explicit override via query param, or auto-detect browser
  return prettyParam === '1' || (prettyParam !== '0' && acceptsHtml);
}

/**
 * Create a JSON response with proper headers
 * Automatically pretty-prints JSON for browsers (detected via Accept header)
 * Can be overridden with ?pretty=1 (force on) or ?pretty=0 (force off)
 */
export function jsonResponse(
  data: unknown,
  request: Request,
  status = 200
): Response {
  const body = shouldPrettyPrint(request)
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  return new Response(body, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Create a text response with proper headers
 */
export function textResponse(
  text: string,
  status = 200,
  contentType = 'text/plain'
): Response {
  return new Response(text, {
    status,
    headers: { 'content-type': contentType },
  });
}
