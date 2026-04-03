/**
 * Utility route handlers
 */

import type { CFRequest } from '../types';
import { jsonResponse } from '../utils/headers';

export function handleUUID(request: CFRequest): Response {
  return jsonResponse({ uuid: crypto.randomUUID() }, request);
}

export function handleBase64(match: RegExpMatchArray, request: CFRequest): Response {
  const encoded = match[1]!;
  try {
    const decoded = atob(encoded);
    return jsonResponse({ encoded, decoded }, request);
  } catch {
    return jsonResponse({ error: 'Invalid base64', status: 400 }, request, 400);
  }
}

export function handleBytes(match: RegExpMatchArray, request: CFRequest): Response {
  const value = match[1]!;
  const parsed = parseInt(value, 10);
  // Reject if not a valid positive integer, but allow values > 100KB (they get capped)
  if (isNaN(parsed) || parsed < 1 || String(parsed) !== value) {
    return jsonResponse({ error: 'Invalid count', status: 400 }, request, 400);
  }

  const size = Math.min(parsed, 100 * 1024);
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);

  return new Response(bytes, {
    headers: { 'content-type': 'application/octet-stream' },
  });
}
