/**
 * Status code route handlers
 */

import type { CFRequest } from '../types';
import { STATUS_TEXTS } from '../types';
import { textResponse, jsonResponse } from '../utils/headers';

export function handleStatus(match: RegExpMatchArray, request: CFRequest): Response {
  const codes = match[1]!.split(',');
  const code = parseInt(codes[Math.floor(Math.random() * codes.length)]!, 10);

  if (isNaN(code) || code < 100 || code > 599) {
    return jsonResponse({ error: 'Invalid status code', status: 400 }, request, 400);
  }

  const headers = new Headers({ 'content-type': 'text/plain' });

  // Some status codes expect specific headers
  if (code === 401) headers.set('www-authenticate', 'Basic realm="Fake Realm"');
  if (code === 301 || code === 302 || code === 303 || code === 307 || code === 308) {
    headers.set('location', '/redirect/1');
  }

  const statusText = STATUS_TEXTS[code] ?? '';
  const body = statusText ? `${code} ${statusText}` : String(code);

  return new Response(body, { status: code, headers });
}
