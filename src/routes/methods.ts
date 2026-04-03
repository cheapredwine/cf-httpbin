/**
 * HTTP method route handlers
 */

import type { CFRequest, ReflectData } from '../types';
import { jsonResponse, headersToObj, getClientIP } from '../utils/headers';

export async function buildReflect(request: CFRequest, url: URL): Promise<ReflectData> {
  const contentType = request.headers.get('content-type') ?? '';
  let data = '';
  let json: unknown = null;
  let form: Record<string, string> | null = null;
  let files: Record<string, { filename: string; size: number; type: string }> | null = null;

  if (request.body) {
    if (contentType.includes('application/json')) {
      const text = await request.text();
      data = text;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      data = text;
      form = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        form = {};
        files = {};
        for (const [key, value] of formData) {
          if (typeof value === 'string') {
            form[key] = value;
          } else {
            const file = value as File;
            files[key] = { filename: file.name, size: file.size, type: file.type };
          }
        }
      } catch {
        // ignore parse errors
      }
    } else {
      data = await request.text().catch(() => '');
    }
  }

  return {
    args: Object.fromEntries(url.searchParams),
    data,
    files: files ?? {},
    form: form ?? {},
    headers: headersToObj(request.headers),
    json,
    method: request.method,
    origin: getClientIP(request),
    url: request.url,
  };
}

export async function handleGet(request: CFRequest, url: URL): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

export async function handlePost(request: CFRequest, url: URL): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

export async function handlePut(request: CFRequest, url: URL): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

export async function handleDelete(request: CFRequest, url: URL): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

export async function handlePatch(request: CFRequest, url: URL): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

export async function handleAnything(request: CFRequest, url: URL): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}
