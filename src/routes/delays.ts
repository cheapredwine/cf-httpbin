/**
 * Delay route handlers
 */

import type { CFRequest } from '../types';
import { jsonResponse } from '../utils/headers';
import { buildReflect } from './methods';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function handleDelay(match: RegExpMatchArray, request: CFRequest, url: URL): Promise<Response> {
  const value = match[1]!;
  const secs = Math.min(parseFloat(value), 10);
  // Check if it's a valid number - parseFloat is lenient, so we need additional validation
  if (isNaN(secs) || secs < 0 || value === '' || !/^\d+(\.\d+)?$/.test(value)) {
    return jsonResponse({ error: 'Invalid delay', status: 400 }, request, 400);
  }

  await sleep(secs * 1000);
  return jsonResponse(await buildReflect(request, url), request);
}
