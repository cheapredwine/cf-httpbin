/**
 * Compression route handlers
 */

import type { CFRequest } from '../types';
import { jsonResponse, shouldPrettyPrint } from '../utils/headers';
import { buildReflect } from './methods';
import { gzip, deflate } from '../utils/compression';

export async function handleGzip(request: CFRequest, url: URL): Promise<Response> {
  const reflect = await buildReflect(request, url);
  const data = shouldPrettyPrint(request)
    ? JSON.stringify(reflect, null, 2)
    : JSON.stringify(reflect);

  const compressed = await gzip(data);
  return new Response(compressed, {
    headers: {
      'content-type': 'application/json',
      'content-encoding': 'gzip',
    },
    encodeBody: 'manual',
  } as ResponseInit);
}

export async function handleDeflate(request: CFRequest, url: URL): Promise<Response> {
  const reflect = await buildReflect(request, url);
  const data = shouldPrettyPrint(request)
    ? JSON.stringify(reflect, null, 2)
    : JSON.stringify(reflect);

  const compressed = await deflate(data);
  return new Response(compressed, {
    headers: {
      'content-type': 'application/json',
      'content-encoding': 'deflate',
    },
    encodeBody: 'manual',
  } as ResponseInit);
}
