/**
 * Authentication route handlers
 */

import type { CFRequest } from '../types';
import { jsonResponse } from '../utils/headers';

export function handleBasicAuth(match: RegExpMatchArray, request: CFRequest): Response {
  const pathPart = match[1]!;
  const parts = pathPart.split('/');
  if (parts.length < 2) {
    return jsonResponse({ error: 'Invalid path', status: 400 }, request, 400);
  }

  const expectedUser = parts[0]!;
  const expectedPass = parts[1]!;

  const authHeader = request.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Basic ')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'www-authenticate': 'Basic realm="Fake Realm"' },
    });
  }

  const [user, pass] = atob(authHeader.slice(6)).split(':');
  if (user !== expectedUser || pass !== expectedPass) {
    return jsonResponse({ error: 'Forbidden', status: 403 }, request, 403);
  }

  return jsonResponse({ authenticated: true, user }, request);
}

export function handleBearer(request: CFRequest): Response {
  const authHeader = request.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'www-authenticate': 'Bearer' },
    });
  }
  return jsonResponse({ authenticated: true, token: authHeader.slice(7) }, request);
}
