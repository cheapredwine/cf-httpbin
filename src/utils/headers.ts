/**
 * @fileoverview Header utility functions
 *
 * These functions help work with HTTP headers in a type-safe way.
 * They handle common operations like parsing, converting, and creating responses.
 */

import type { CookieMap } from '../types';

/**
 * Convert a Headers object to a plain JavaScript object
 *
 * The built-in Headers object is iterable but not a plain object,
 * which makes it harder to work with. This converts it to a simple
 * Record (object with string keys and values).
 *
 * @example
 * const headers = new Headers({ 'content-type': 'application/json' });
 * headersToObj(headers);
 * // Returns: { 'content-type': 'application/json' }
 *
 * @param headers - The Headers object to convert
 * @returns Plain object with header names as keys
 */
export function headersToObj(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};

  // Headers is iterable - each entry is [name, value]
  for (const [name, value] of headers) {
    obj[name] = value;
  }

  return obj;
}

/**
 * Get the client's real IP address from request headers
 *
 * When requests go through Cloudflare (or other proxies), the connection
 * appears to come from the proxy, not the real client. These headers
 * tell us the original client IP.
 *
 * Priority order:
 * 1. CF-Connecting-IP - Cloudflare's header (most reliable)
 * 2. X-Forwarded-For - Standard proxy header (can be spoofed)
 * 3. 'unknown' - Fallback if no header present
 *
 * @param request - The incoming request
 * @returns The client's IP address as a string
 */
export function getClientIP(request: Request): string {
  // ?? is the "nullish coalescing" operator
  // It means: use the left value if it's not null/undefined, otherwise use the right
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    'unknown'
  );
}

/**
 * Parse a Cookie header string into an object
 *
 * Cookie format: "name=value; other=thing; third=item"
 *
 * Note: Cookie values can contain = signs, so we only split on the first =
 * Example: "data=foo=bar" becomes { data: "foo=bar" }
 *
 * @example
 * parseCookies('session=abc123; user=john');
 * // Returns: { session: "abc123", user: "john" }
 *
 * @param cookieHeader - The raw Cookie header value
 * @returns Object mapping cookie names to values
 */
export function parseCookies(cookieHeader: string): CookieMap {
  const cookies: CookieMap = {};

  // Split by semicolon to get individual cookies
  for (const part of cookieHeader.split(';')) {
    // Split on first = only (values can contain =)
    const [name, ...valueParts] = part.trim().split('=');

    if (name) {
      // Join remaining parts (in case value had = signs)
      const value = valueParts.join('=').trim();
      cookies[name.trim()] = value;
    }
  }

  return cookies;
}

/**
 * Determine if JSON should be pretty-printed (formatted with indentation)
 *
 * We pretty-print JSON when:
 * 1. The client explicitly requests it with ?pretty=1 query parameter
 * 2. The client appears to be a browser (Accept: text/html header)
 *
 * We DON'T pretty-print when:
 * - The client explicitly disables it with ?pretty=0
 * - The client appears to be a programmatic API client
 *
 * Pretty printing adds whitespace which makes it readable for humans
 * but wastes bytes for machines.
 *
 * @param request - The incoming request
 * @returns True if JSON should be pretty-printed
 */
export function shouldPrettyPrint(request: Request): boolean {
  const url = new URL(request.url);
  const prettyParam = url.searchParams.get('pretty');

  // Check if client accepts HTML (usually indicates a browser)
  // The ?. is "optional chaining" - safely access nested properties
  // The ?? false provides a default if the result is undefined
  const acceptsHtml = request.headers.get('accept')?.includes('text/html') ?? false;

  // Explicit ?pretty=1 forces pretty printing on
  if (prettyParam === '1') {
    return true;
  }

  // Explicit ?pretty=0 forces pretty printing off
  if (prettyParam === '0') {
    return false;
  }

  // Auto-detect: pretty print for browsers (HTML accept header)
  return acceptsHtml;
}

/**
 * Create a JSON response with proper headers
 *
 * This is a helper function that:
 * 1. Automatically pretty-prints for browsers
 * 2. Sets the correct Content-Type header
 * 3. Handles optional status codes
 *
 * @example
 * // Simple success response
 * jsonResponse({ message: "Hello" }, request);
 *
 * // Error response with custom status
 * jsonResponse({ error: "Not found" }, request, 404);
 *
 * @param data - The data to serialize to JSON
 * @param request - The incoming request (used to detect if pretty printing needed)
 * @param status - HTTP status code (default: 200)
 * @returns A Response object with JSON body
 */
export function jsonResponse(
  data: unknown,
  request: Request,
  status = 200
): Response {
  // Serialize to JSON, with or without formatting
  const body = shouldPrettyPrint(request)
    ? JSON.stringify(data, null, 2) // 2-space indentation
    : JSON.stringify(data);         // Compact, no whitespace

  return new Response(body, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Create a text response with proper headers
 *
 * A simpler alternative to jsonResponse for plain text content.
 *
 * @example
 * textResponse("Hello, World!");  // 200 OK
 * textResponse("Not found", 404); // 404 Not Found
 * textResponse("<h1>Hi</h1>", 200, "text/html"); // HTML content
 *
 * @param text - The response body text
 * @param status - HTTP status code (default: 200)
 * @param contentType - MIME type (default: text/plain)
 * @returns A Response object with text body
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
