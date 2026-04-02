// cf-httpbin — httpbin.org-compatible Cloudflare Worker

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ── HTTP Methods ──────────────────────────────────────────────────────
      if (path === '/get' && method === 'GET')
        return jsonResp(await buildReflect(request, url));

      if (path === '/post' && method === 'POST')
        return jsonResp(await buildReflect(request, url));

      if (path === '/put' && method === 'PUT')
        return jsonResp(await buildReflect(request, url));

      if (path === '/delete' && method === 'DELETE')
        return jsonResp(await buildReflect(request, url));

      if (path === '/patch' && method === 'PATCH')
        return jsonResp(await buildReflect(request, url));

      if (path === '/anything' || path.startsWith('/anything/'))
        return jsonResp(await buildReflect(request, url));

      // ── Request Inspection ────────────────────────────────────────────────
      if (path === '/headers')
        return jsonResp({ headers: headersToObj(request.headers) });

      if (path === '/ip')
        return jsonResp(buildIPInfo(request));

      if (path === '/user-agent')
        return jsonResp({ 'user-agent': request.headers.get('user-agent') ?? '' });

      if (path === '/cf')
        return jsonResp(buildCfInfo(request));

      // ── Response Formats ──────────────────────────────────────────────────
      if (path === '/json')
        return jsonResp(SAMPLE_JSON);

      if (path === '/html')
        return new Response(SAMPLE_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });

      if (path === '/xml')
        return new Response(SAMPLE_XML, { headers: { 'content-type': 'application/xml' } });

      if (path === '/robots.txt')
        return new Response('User-agent: *\nDisallow: /deny\n', { headers: { 'content-type': 'text/plain' } });

      if (path === '/deny')
        return new Response(
          '          .-\'\'\'-.     ,.--\'\'\'--.,\n' +
          '        /        \\  /            \\\n' +
          '       |  0   0   ||  NOT FOR YOU |\n' +
          '       |    __    ||              |\n' +
          '        \\  \'--\'  /  \\            /\n' +
          '         \'-....-\'    \'--......--\'\n',
          { headers: { 'content-type': 'text/plain' } }
        );

      if (path === '/encoding/utf8')
        return new Response(SAMPLE_UTF8, { headers: { 'content-type': 'text/html; charset=utf-8' } });

      // ── Status Codes ──────────────────────────────────────────────────────
      if (path.startsWith('/status/')) {
        const codes = path.slice('/status/'.length).split(',');
        const code = parseInt(codes[Math.floor(Math.random() * codes.length)], 10);
        if (isNaN(code) || code < 100 || code > 599)
          return new Response('Invalid status code', { status: 400 });
        return buildStatusResponse(code);
      }

      // ── Redirects ─────────────────────────────────────────────────────────
      if (path.startsWith('/redirect/')) {
        const n = parseInt(path.slice('/redirect/'.length), 10);
        if (isNaN(n) || n < 1) return new Response('Invalid count', { status: 400 });
        if (n === 1) return Response.redirect(new URL('/get', url).href, 302);
        return Response.redirect(new URL(`/redirect/${n - 1}`, url).href, 302);
      }

      if (path.startsWith('/absolute-redirect/')) {
        const n = parseInt(path.slice('/absolute-redirect/'.length), 10);
        if (isNaN(n) || n < 1) return new Response('Invalid count', { status: 400 });
        if (n === 1) return Response.redirect(new URL('/get', url).href, 302);
        return Response.redirect(new URL(`/absolute-redirect/${n - 1}`, url).href, 302);
      }

      if (path.startsWith('/relative-redirect/')) {
        const n = parseInt(path.slice('/relative-redirect/'.length), 10);
        if (isNaN(n) || n < 1) return new Response('Invalid count', { status: 400 });
        if (n === 1) return new Response(null, { status: 302, headers: { location: '/get' } });
        return new Response(null, { status: 302, headers: { location: `/relative-redirect/${n - 1}` } });
      }

      if (path === '/redirect-to') {
        const target = url.searchParams.get('url');
        if (!target) return new Response('Missing url param', { status: 400 });
        const statusCode = parseInt(url.searchParams.get('status_code') ?? '302', 10);
        return Response.redirect(target, statusCode);
      }

      // ── Delays ────────────────────────────────────────────────────────────
      if (path.startsWith('/delay/')) {
        const secs = Math.min(parseFloat(path.slice('/delay/'.length)), 10);
        if (isNaN(secs) || secs < 0) return new Response('Invalid delay', { status: 400 });
        await sleep(secs * 1000);
        return jsonResp(await buildReflect(request, url));
      }

      // ── Auth ──────────────────────────────────────────────────────────────
      if (path.startsWith('/basic-auth/')) {
        const parts = path.slice('/basic-auth/'.length).split('/');
        if (parts.length < 2) return new Response('Invalid path', { status: 400 });
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
          return new Response('Forbidden', { status: 403 });
        }
        return jsonResp({ authenticated: true, user });
      }

      if (path === '/bearer') {
        const authHeader = request.headers.get('authorization') ?? '';
        if (!authHeader.startsWith('Bearer ')) {
          return new Response('Unauthorized', {
            status: 401,
            headers: { 'www-authenticate': 'Bearer' },
          });
        }
        return jsonResp({ authenticated: true, token: authHeader.slice(7) });
      }

      // ── Cookies ───────────────────────────────────────────────────────────
      if (path === '/cookies') {
        const cookies = parseCookies(request.headers.get('cookie') ?? '');
        return jsonResp({ cookies });
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
        if (isNaN(n) || n < 1) return new Response('Invalid count', { status: 400 });
        const reflect = await buildReflect(request, url);
        const stream = new ReadableStream({
          async start(controller) {
            const enc = new TextEncoder();
            for (let i = 0; i < n; i++) {
              const line = JSON.stringify({ ...reflect, id: i }) + '\n';
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
        if (isNaN(n) || n < 1) return new Response('Invalid count', { status: 400 });
        const chunkSize = url.searchParams.get('chunk_size')
          ? parseInt(url.searchParams.get('chunk_size'), 10)
          : 10240;
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

      // ── Index ─────────────────────────────────────────────────────────────
      if (path === '/' || path === '')
        return new Response(INDEX_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });

      return new Response('Not Found', { status: 404 });

    } catch (err) {
      return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
    }
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function headersToObj(headers) {
  const obj = {};
  for (const [k, v] of headers) obj[k] = v;
  return obj;
}

function clientIP(request) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    'unknown'
  );
}

function buildCfInfo(request) {
  const cfVisitor = request.headers.get('cf-visitor');
  let scheme = null;
  if (cfVisitor) {
    try {
      scheme = JSON.parse(cfVisitor).scheme;
    } catch {
      // ignore parse errors
    }
  }

  return {
    ray: request.headers.get('cf-ray') ?? null,
    country: request.headers.get('cf-ipcountry') ?? null,
    ip: clientIP(request),
    scheme: scheme ?? request.headers.get('x-forwarded-proto') ?? 'https',
    device: request.headers.get('cf-device-type') ?? null,
    isWorkerSubrequest: request.headers.get('cf-worker') !== null,
    colo: request.headers.get('cf-ray')?.split('-')[1] ?? null,
  };
}

function buildIPInfo(request) {
  const origin = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';

  // Extract proxy IP from X-Forwarded-For (last entry in chain, or unknown if empty)
  let proxy = 'unknown';
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 1) {
      proxy = ips[ips.length - 1];
    }
  }

  return {
    origin,
    proxy,
    forwarded_for: forwardedFor || null,
  };
}

async function buildReflect(request, url) {
  const contentType = request.headers.get('content-type') ?? '';
  let data = '';
  let json = null;
  let form = null;
  let files = null;

  if (request.body) {
    if (contentType.includes('application/json')) {
      try {
        const text = await request.text();
        json = JSON.parse(text);
        data = text;
      } catch {
        data = await request.text().catch(() => '');
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
            files[key] = { filename: value.name, size: value.size, type: value.type };
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
    origin: clientIP(request),
    url: request.url,
  };
}

function jsonResp(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCookies(cookieHeader) {
  const cookies = {};
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) cookies[k.trim()] = v.join('=').trim();
  }
  return cookies;
}

function buildStatusResponse(code) {
  const statusTexts = {
    100: 'Continue', 101: 'Switching Protocols', 200: 'OK', 201: 'Created',
    202: 'Accepted', 204: 'No Content', 206: 'Partial Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 402: 'Payment Required',
    403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed',
    406: 'Not Acceptable', 408: 'Request Timeout', 409: 'Conflict',
    410: 'Gone', 418: "I'm a Teapot", 429: 'Too Many Requests',
    500: 'Internal Server Error', 501: 'Not Implemented',
    502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout',
  };

  const headers = new Headers({ 'content-type': 'text/plain' });
  // Some status codes expect specific headers
  if (code === 401) headers.set('www-authenticate', 'Basic realm="Fake Realm"');
  if (code === 301 || code === 302 || code === 303 || code === 307 || code === 308)
    headers.set('location', '/redirect/1');

  return new Response(statusTexts[code] ?? '', { status: code, headers });
}

// ── Static Content ─────────────────────────────────────────────────────────

const SAMPLE_JSON = {
  slideshow: {
    author: 'Yours Truly',
    date: 'date of publication',
    slides: [
      { title: 'Wake up to WonderWidgets!', type: 'all' },
      { items: ['Why <em>WonderWidgets</em> are great', 'Who <em>buys</em> WonderWidgets'], title: 'Overview', type: 'all' },
    ],
    title: 'Sample Slide Show',
  },
};

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
  <head><title>httpbin on Cloudflare Workers</title></head>
  <body>
    <h1>Herman Melville - Moby-Dick</h1>
    <p>Availing himself of the mild, summer-cool weather that now reigned in these latitudes,
    and in preparation for the peculiarly active pursuits shortly to be anticipated, Perth, the
    begrimed, blistered old blacksmith, had not removed his portable forge to the hold again,
    after concluding his contributory work for Ahab's leg, but still retained it on deck.</p>
  </body>
</html>`;

const SAMPLE_XML = `<?xml version='1.0' encoding='us-ascii'?>
<slideshow title="Sample Slide Show" date="Date of publication" author="Yours Truly">
  <slide type="all">
    <title>Wake up to WonderWidgets!</title>
  </slide>
  <slide type="all">
    <title>Overview</title>
    <item>Why <em>WonderWidgets</em> are great</item>
    <item>Who <em>buys</em> WonderWidgets</item>
  </slide>
</slideshow>`;

const SAMPLE_UTF8 = `<!DOCTYPE html>
<html><head><title>UTF-8 encoded sample plain-text file</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
</head><body>
<h1>UTF-8 encoded sample plain-text file</h1>
<p>Ā ā Ă ă Ą ą Ć ć Ĉ ĉ — Unicode Latin Extended-A</p>
<p>∮ E⋅da = Q, n → ∞, ∑ f(i) = ∏ g(i) — Math symbols</p>
<p>日本語 中文 한국어 — CJK characters</p>
<p>Ελληνικά — Greek</p>
<p>Привет — Cyrillic</p>
</body></html>`;

const INDEX_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>cf-httpbin</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #f6821f; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6821f; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    a { color: #f6821f; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>cf-httpbin</h1>
  <p>An <a href="https://httpbin.org">httpbin</a>-compatible HTTP testing service running on <a href="https://workers.cloudflare.com">Cloudflare Workers</a>.</p>

  <h2>HTTP Methods</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/get">/get</a></td><td>Returns GET request data</td></tr>
    <tr><td>/post</td><td>Returns POST request data</td></tr>
    <tr><td>/put</td><td>Returns PUT request data</td></tr>
    <tr><td>/delete</td><td>Returns DELETE request data</td></tr>
    <tr><td>/patch</td><td>Returns PATCH request data</td></tr>
    <tr><td>/anything</td><td>Returns any request data</td></tr>
  </table>

  <h2>Request Inspection</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/headers">/headers</a></td><td>Returns request headers</td></tr>
    <tr><td><a href="/ip">/ip</a></td><td>Returns requester's IP</td></tr>
    <tr><td><a href="/user-agent">/user-agent</a></td><td>Returns user-agent</td></tr>
    <tr><td><a href="/cf">/cf</a></td><td>Returns Cloudflare metadata (Ray ID, country, colo)</td></tr>
  </table>

  <h2>Response Formats</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/json">/json</a></td><td>Returns JSON response</td></tr>
    <tr><td><a href="/html">/html</a></td><td>Returns HTML response</td></tr>
    <tr><td><a href="/xml">/xml</a></td><td>Returns XML response</td></tr>
    <tr><td><a href="/robots.txt">/robots.txt</a></td><td>Returns robots.txt</td></tr>
    <tr><td><a href="/encoding/utf8">/encoding/utf8</a></td><td>Returns UTF-8 encoded page</td></tr>
  </table>

  <h2>Status Codes</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/status/200">/status/:code</a></td><td>Returns given status code. Comma-separate for random selection.</td></tr>
  </table>

  <h2>Redirects</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/redirect/3">/redirect/:n</a></td><td>302 redirects n times</td></tr>
    <tr><td><a href="/absolute-redirect/3">/absolute-redirect/:n</a></td><td>Absolute 302 redirects n times</td></tr>
    <tr><td><a href="/relative-redirect/3">/relative-redirect/:n</a></td><td>Relative 302 redirects n times</td></tr>
    <tr><td><a href="/redirect-to?url=https://cloudflare.com">/redirect-to?url=&url&status_code=</a></td><td>Redirects to given URL</td></tr>
  </table>

  <h2>Delays</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/delay/2">/delay/:seconds</a></td><td>Delays response (max 10s)</td></tr>
  </table>

  <h2>Auth</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td>/basic-auth/:user/:pass</td><td>HTTP Basic Auth challenge</td></tr>
    <tr><td>/bearer</td><td>Bearer token auth challenge</td></tr>
  </table>

  <h2>Cookies</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/cookies">/cookies</a></td><td>Returns current cookies</td></tr>
    <tr><td><a href="/cookies/set?foo=bar">/cookies/set?name=value</a></td><td>Sets cookies via redirect</td></tr>
    <tr><td><a href="/cookies/delete?foo=">/cookies/delete?name=</a></td><td>Deletes cookies via redirect</td></tr>
  </table>

  <h2>Streaming</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/stream/5">/stream/:n</a></td><td>Streams n JSON lines (max 100)</td></tr>
    <tr><td><a href="/stream-bytes/1024">/stream-bytes/:n</a></td><td>Streams n random bytes (max 100KB)</td></tr>
  </table>
</body>
</html>`;
