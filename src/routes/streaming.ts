/**
 * Streaming route handlers
 */

import type { CFRequest } from '../types';
import { jsonResponse, shouldPrettyPrint } from '../utils/headers';
import { buildReflect } from './methods';

export async function handleStream(match: RegExpMatchArray, request: CFRequest, url: URL): Promise<Response> {
  const value = match[1]!;
  const parsed = parseInt(value, 10);
  // Reject if not a valid positive integer, but allow values > 100 (they get capped)
  if (isNaN(parsed) || parsed < 1 || String(parsed) !== value) {
    return jsonResponse({ error: 'Invalid count', status: 400 }, request, 400);
  }
  const n = Math.min(parsed, 100);

  const reflect = await buildReflect(request, url);
  const prettyPrint = shouldPrettyPrint(request);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      for (let i = 0; i < n; i++) {
        const line = prettyPrint
          ? JSON.stringify({ ...reflect, id: i }, null, 2) + '\n'
          : JSON.stringify({ ...reflect, id: i }) + '\n';
        controller.enqueue(enc.encode(line));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'transfer-encoding': 'chunked',
    },
  });
}

export function handleStreamBytes(match: RegExpMatchArray, url: URL, request: CFRequest): Response {
  const value = match[1]!;
  const parsed = parseInt(value, 10);
  // Reject if not a valid positive integer, but allow values > 102400 (they get capped)
  if (isNaN(parsed) || parsed < 1 || String(parsed) !== value) {
    return jsonResponse({ error: 'Invalid count', status: 400 }, request, 400);
  }
  const n = Math.min(parsed, 102400);

  const chunkSizeParam = url.searchParams.get('chunk_size');
  const chunkSize = chunkSizeParam ? parseInt(chunkSizeParam, 10) : 10240;

  const stream = new ReadableStream({
    async start(controller) {
      let remaining = n;
      while (remaining > 0) {
        const size = Math.min(chunkSize, remaining);
        const chunk = new Uint8Array(size);
        crypto.getRandomValues(chunk);
        controller.enqueue(chunk);
        remaining -= size;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/octet-stream',
      'transfer-encoding': 'chunked',
    },
  });
}
