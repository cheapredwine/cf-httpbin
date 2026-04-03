// cf-httpbin — httpbin.org-compatible Cloudflare Worker

import type { Env, ReflectData, IPInfo, CFMetadata } from './types';
import { STATUS_TEXTS } from './types';
import { headersToObj, getClientIP, parseCookies, jsonResponse, textResponse, shouldPrettyPrint } from './utils/headers';
import { gzip, deflate } from './utils/compression';
import { SAMPLE_JSON, SAMPLE_HTML, SAMPLE_XML, SAMPLE_UTF8, INDEX_HTML } from './static/content';
import { FAVICON_SVG, FAVICON_ICO_SVG } from './static/favicon';
import { DOCS_HTML } from './static/docs';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ── HTTP Methods ──────────────────────────────────────────────────────
      if (path === '/get' && method === 'GET')
        return jsonResponse(await buildReflect(request, url), request);

      if (path === '/post' && method === 'POST')
        return jsonResponse(await buildReflect(request, url), request);

      if (path === '/put' && method === 'PUT')
        return jsonResponse(await buildReflect(request, url), request);

      if (path === '/delete' && method === 'DELETE')
        return jsonResponse(await buildReflect(request, url), request);

      if (path === '/patch' && method === 'PATCH')
        return jsonResponse(await buildReflect(request, url), request);

      if (path === '/anything' || path.startsWith('/anything/'))
        return jsonResponse(await buildReflect(request, url), request);

      // ── Request Inspection ────────────────────────────────────────────────
      if (path === '/headers')
        return jsonResponse({ headers: headersToObj(request.headers) }, request);

      if (path === '/ip')
        return jsonResponse(buildIPInfo(request), request);

      if (path === '/user-agent')
        return jsonResponse({ 'user-agent': request.headers.get('user-agent') ?? '' }, request);

      if (path === '/cf')
        return jsonResponse(buildCfInfo(request), request);

      // ── Response Formats ──────────────────────────────────────────────────
      if (path === '/json')
        return jsonResponse(SAMPLE_JSON, request);

      if (path === '/html')
        return textResponse(SAMPLE_HTML, 200, 'text/html; charset=utf-8');

      if (path === '/xml')
        return textResponse(SAMPLE_XML, 200, 'application/xml');

      if (path === '/robots.txt')
        return textResponse('User-agent: *\nDisallow: /deny\n', 200);

      if (path === '/deny')
        return textResponse(
          '          .-\'\'\'-.     ,.--\'\'\'--.,\n' +
          '        /        \\  /            \\\n' +
          '       |  0   0   ||  NOT FOR YOU |\n' +
          '       |    __    ||              |\n' +
          '        \\  \'--\'  /  \\            /\n' +
          '         \'-....-\'    \'--......--\'\n',
          200
        );

      if (path === '/encoding/utf8')
        return textResponse(SAMPLE_UTF8, 200, 'text/html; charset=utf-8');

      // ── Static Assets ─────────────────────────────────────────────────────
      if (path === '/favicon.ico')
        return new Response(FAVICON_ICO_SVG, {
          headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
        });

      if (path === '/favicon.svg')
        return new Response(FAVICON_SVG, {
          headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
        });

      // ── Utilities ─────────────────────────────────────────────────────────
      if (path === '/uuid')
        return jsonResponse({ uuid: crypto.randomUUID() }, request);

      if (path.startsWith('/base64/')) {
        const encoded = path.slice('/base64/'.length);
        try {
          const decoded = atob(encoded);
          return jsonResponse({ encoded, decoded }, request);
        } catch {
          return textResponse('Invalid base64', 400);
        }
      }

      if (path.startsWith('/bytes/')) {
        const n = Math.min(parseInt(path.slice('/bytes/'.length), 10), 100 * 1024);
        if (isNaN(n) || n < 1) return textResponse('Invalid count', 400);
        // Cap at a reasonable size for the environment
        const size = Math.min(n, 100 * 1024);
        const bytes = new Uint8Array(size);
        crypto.getRandomValues(bytes);
        return new Response(bytes, {
          headers: { 'content-type': 'application/octet-stream' },
        });
      }

      // ── Compression ───────────────────────────────────────────────────────
      if (path === '/gzip') {
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
        });
      }

      if (path === '/deflate') {
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
        });
      }

      // ── Status Codes ──────────────────────────────────────────────────────
      if (path.startsWith('/status/')) {
        const codes = path.slice('/status/'.length).split(',');
        const code = parseInt(codes[Math.floor(Math.random() * codes.length)]!, 10);
        if (isNaN(code) || code < 100 || code > 599)
          return textResponse('Invalid status code', 400);
        return buildStatusResponse(code);
      }

      // ── Redirects ─────────────────────────────────────────────────────────
      if (path.startsWith('/redirect/')) {
        const n = parseInt(path.slice('/redirect/'.length), 10);
        if (isNaN(n) || n < 1) return textResponse('Invalid count', 400);
        if (n === 1) return Response.redirect(new URL('/get', url).href, 302);
        return Response.redirect(new URL(`/redirect/${n - 1}`, url).href, 302);
      }

      if (path.startsWith('/absolute-redirect/')) {
        const n = parseInt(path.slice('/absolute-redirect/'.length), 10);
        if (isNaN(n) || n < 1) return textResponse('Invalid count', 400);
        if (n === 1) return Response.redirect(new URL('/get', url).href, 302);
        return Response.redirect(new URL(`/absolute-redirect/${n - 1}`, url).href, 302);
      }

      if (path.startsWith('/relative-redirect/')) {
        const n = parseInt(path.slice('/relative-redirect/'.length), 10);
        if (isNaN(n) || n < 1) return textResponse('Invalid count', 400);
        if (n === 1) return new Response(null, { status: 302, headers: { location: '/get' } });
        return new Response(null, { status: 302, headers: { location: `/relative-redirect/${n - 1}` } });
      }

      if (path === '/redirect-to') {
        const target = url.searchParams.get('url');
        if (!target) return textResponse('Missing url param', 400);
        const statusCode = parseInt(url.searchParams.get('status_code') ?? '302', 10);
        return Response.redirect(target, statusCode);
      }

      // ── Delays ────────────────────────────────────────────────────────────
      if (path.startsWith('/delay/')) {
        const secs = Math.min(parseFloat(path.slice('/delay/'.length)), 10);
        if (isNaN(secs) || secs < 0) return textResponse('Invalid delay', 400);
        await sleep(secs * 1000);
        return jsonResponse(await buildReflect(request, url), request);
      }

      // ── Auth ──────────────────────────────────────────────────────────────
      if (path.startsWith('/basic-auth/')) {
        const parts = path.slice('/basic-auth/'.length).split('/');
        if (parts.length < 2) return textResponse('Invalid path', 400);
        const [expectedUser, expectedPass] = parts;
        const authHeader = request.headers.get('authorization') ?? '';
        if (!authHeader.startsWith('Basic ')) {
          return new Response('Unauthorized', {
            status: 401,
            headers: { 'www-authenticate': 'Basic realm="Fake Realm"' },
          });
        }
        const [user, pass] = atob(authHeader.slice(6)).split(':');
        if (user !== expectedUser || pass !== expectedPass) {
          return textResponse('Forbidden', 403);
        }
        return jsonResponse({ authenticated: true, user }, request);
      }

      if (path === '/bearer') {
        const authHeader = request.headers.get('authorization') ?? '';
        if (!authHeader.startsWith('Bearer ')) {
          return new Response('Unauthorized', {
            status: 401,
            headers: { 'www-authenticate': 'Bearer' },
          });
        }
        return jsonResponse({ authenticated: true, token: authHeader.slice(7) }, request);
      }

      // ── Cookies ───────────────────────────────────────────────────────────
      if (path === '/cookies') {
        const cookies = parseCookies(request.headers.get('cookie') ?? '');
        return jsonResponse({ cookies }, request);
      }

      if (path === '/cookies/set') {
        const headers = new Headers({ location: '/cookies' });
        for (const [key, value] of url.searchParams) {
          headers.append('set-cookie', `${key}=${value}; Path=/`);
        }
        return new Response(null, { status: 302, headers });
      }

      if (path === '/cookies/delete') {
        const headers = new Headers({ location: '/cookies' });
        for (const [key] of url.searchParams) {
          headers.append('set-cookie', `${key}=; Path=/; Max-Age=0`);
        }
        return new Response(null, { status: 302, headers });
      }

      // ── Streaming ─────────────────────────────────────────────────────────
      if (path.startsWith('/stream/')) {
        const n = Math.min(parseInt(path.slice('/stream/'.length), 10), 100);
        if (isNaN(n) || n < 1) return textResponse('Invalid count', 400);
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

      if (path.startsWith('/stream-bytes/')) {
        const n = Math.min(parseInt(path.slice('/stream-bytes/'.length), 10), 102400);
        if (isNaN(n) || n < 1) return textResponse('Invalid count', 400);
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

      // ── Index & Documentation ─────────────────────────────────────────────
      if (path === '/' || path === '')
        return textResponse(INDEX_HTML, 200, 'text/html; charset=utf-8');

      if (path === '/docs')
        return textResponse(DOCS_HTML, 200, 'text/html; charset=utf-8');

      return textResponse('Not Found', 404);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return textResponse(`Internal Server Error: ${message}`, 500);
    }
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function buildCfInfo(request: Request): CFMetadata {
  const cfVisitor = request.headers.get('cf-visitor');
  let scheme: string | null = null;
  if (cfVisitor) {
    try {
      scheme = JSON.parse(cfVisitor).scheme;
    } catch {
      // ignore parse errors
    }
  }

  // Access the request.cf object which contains Cloudflare-specific metadata
  const cf = (request as any).cf || {};

  return {
    // Basic request info
    ray: request.headers.get('cf-ray') ?? null,
    ip: getClientIP(request),
    scheme: scheme ?? request.headers.get('x-forwarded-proto') ?? 'https',
    
    // Geographic info (from request.cf)
    colo: cf.colo ?? null,
    country: cf.country ?? null,
    region: cf.region ?? null,
    regionCode: cf.regionCode ?? null,
    city: cf.city ?? null,
    postalCode: cf.postalCode ?? null,
    metroCode: cf.metroCode ?? null,
    timezone: cf.timezone ?? null,
    latitude: cf.latitude ?? null,
    longitude: cf.longitude ?? null,
    
    // Network info (from request.cf)
    asn: cf.asn ?? null,
    asOrganization: cf.asOrganization ?? null,
    
    // Performance metrics (from request.cf)
    clientTcpRtt: cf.clientTcpRtt ?? null,
    clientQuicRtt: cf.clientQuicRtt ?? null,
    
    // Device/client info
    device: request.headers.get('cf-device-type') ?? null,
    clientAcceptEncoding: cf.clientAcceptEncoding ?? null,
    
    // Worker context
    isWorkerSubrequest: request.headers.get('cf-worker') !== null,
  };
}

function buildIPInfo(request: Request): IPInfo {
  const origin = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';

  // Extract proxy IP from X-Forwarded-For (last entry in chain, or unknown if empty)
  let proxy = 'unknown';
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 1) {
      proxy = ips[ips.length - 1]!;
    }
  }

  return {
    origin,
    proxy,
    forwarded_for: forwardedFor || null,
  };
}

async function buildReflect(request: Request, url: URL): Promise<ReflectData> {
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
        // JSON parsing failed, but we already have the text in `data`
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
            // value is a File
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildStatusResponse(code: number): Response {
  const headers = new Headers({ 'content-type': 'text/plain' });
  // Some status codes expect specific headers
  if (code === 401) headers.set('www-authenticate', 'Basic realm="Fake Realm"');
  if (code === 301 || code === 302 || code === 303 || code === 307 || code === 308)
    headers.set('location', '/redirect/1');

  const statusText = STATUS_TEXTS[code] ?? '';
  const body = statusText ? `${code} ${statusText}` : String(code);
  return new Response(body, { status: code, headers });
}
