/**
 * Static content (HTML, JSON, XML samples)
 */

export const SAMPLE_JSON = {
  slideshow: {
    author: 'Yours Truly',
    date: 'date of publication',
    slides: [
      { title: 'Wake up to WonderWidgets!', type: 'all' },
      {
        items: [
          'Why <em>WonderWidgets</em> are great',
          'Who <em>buys</em> WonderWidgets',
        ],
        title: 'Overview',
        type: 'all',
      },
    ],
    title: 'Sample Slide Show',
  },
};

export const SAMPLE_HTML = `<!DOCTYPE html>
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

export const SAMPLE_XML = `<?xml version='1.0' encoding='us-ascii'?>
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

export const SAMPLE_UTF8 = `<!DOCTYPE html>
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

export const INDEX_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>cf-httpbin | HTTP Testing Service</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="/favicon.ico" type="image/x-icon">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="HTTP testing service for debugging, testing, and development. Test REST APIs, inspect requests, and validate HTTP behavior.">
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      max-width: 900px; 
      margin: 0 auto; 
      padding: 20px; 
      line-height: 1.6;
      color: #333;
    }
    header {
      border-bottom: 3px solid #f6821f;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 { 
      color: #f6821f; 
      margin: 0 0 10px 0;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      font-size: 1.1em;
      margin: 10px 0;
    }
    .hint {
      background: #fff8f0;
      border-left: 4px solid #f6821f;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .hint strong { color: #f6821f; }
    h2 { 
      color: #333; 
      border-bottom: 2px solid #eee;
      padding-bottom: 8px;
      margin-top: 40px;
    }
    table { 
      border-collapse: collapse; 
      width: 100%; 
      margin: 20px 0;
      font-size: 0.95em;
    }
    td, th { 
      border: 1px solid #ddd; 
      padding: 10px 14px; 
      text-align: left; 
    }
    th { 
      background: #f6821f; 
      color: white; 
      font-weight: 600;
    }
    tr:hover { background: #f9f9f9; }
    a { 
      color: #f6821f; 
      text-decoration: none;
      transition: color 0.2s;
    }
    a:hover { 
      color: #d66a0f; 
      text-decoration: underline;
    }
    code { 
      background: #f4f4f4; 
      padding: 3px 8px; 
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .note {
      font-size: 0.9em;
      color: #666;
      font-style: italic;
    }
    footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
    .example {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <header>
    <h1>cf-httpbin</h1>
    <p class="subtitle">HTTP testing service for debugging, testing, and development.</p>
    <p>Inspired by <a href="https://httpbin.org">httpbin.org</a>, running on <a href="https://workers.cloudflare.com">Cloudflare Workers</a>. <a href="/docs">View Documentation →</a></p>
  </header>

  <div class="hint">
    <strong>💡 Quick Start:</strong> Click any endpoint below to try it instantly, or use <code>curl</code> to test programmatically. All endpoints return JSON unless noted. Browser requests get pretty-printed JSON automatically (add <code>?pretty=0</code> to disable or <code>?pretty=1</code> to force).
  </div>

  <h2>HTTP Methods</h2>
  <p class="note">Test different HTTP methods and inspect request/response data</p>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/get">/get</a></td><td>Returns GET request data</td></tr>
    <tr><td>/post</td><td>Returns POST request data <span class="note">(use curl -X POST)</span></td></tr>
    <tr><td>/put</td><td>Returns PUT request data</td></tr>
    <tr><td>/delete</td><td>Returns DELETE request data</td></tr>
    <tr><td>/patch</td><td>Returns PATCH request data</td></tr>
    <tr><td><a href="/anything">/anything</a></td><td>Returns any request data (all methods)</td></tr>
  </table>
  
  <div class="example">
    $ curl -X POST https://cf-httpbin.jsherron-test-account.workers.dev/post \\<br>
    &nbsp;&nbsp;-H "Content-Type: application/json" \\<br>
    &nbsp;&nbsp;-d '{"hello": "world"}'
  </div>

  <h2>Request Inspection</h2>
  <p class="note">Inspect headers, IP addresses, and Cloudflare metadata</p>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/headers">/headers</a></td><td>Returns all request headers</td></tr>
    <tr><td><a href="/ip">/ip</a></td><td>Returns origin (client), proxy (edge), and forwarded_for chain</td></tr>
    <tr><td><a href="/user-agent">/user-agent</a></td><td>Returns user-agent string</td></tr>
    <tr><td><a href="/cf">/cf</a></td><td>Returns Cloudflare metadata: Ray ID, country, colo, device type</td></tr>
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
  <p class="note">Returns status code with body text like "200 OK" or "404 Not Found"</p>
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

  <h2>Utilities</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><a href="/uuid">/uuid</a></td><td>Returns UUIDv4</td></tr>
    <tr><td>/base64/:value</td><td>Decodes base64 value</td></tr>
    <tr><td>/bytes/:n</td><td>Returns n random bytes (max 100KB)</td></tr>
  </table>

  <h2>Compression</h2>
  <p class="note">Test compression handling in your HTTP client</p>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td>/gzip</td><td>Returns gzip-compressed JSON with Content-Encoding header</td></tr>
    <tr><td>/deflate</td><td>Returns deflate-compressed JSON with Content-Encoding header</td></tr>
  </table>

  <footer>
    <p>
      <strong>cf-httpbin</strong> | 
      <a href="/docs">Documentation</a> | 
      <a href="https://github.com/jsherron/cf-httpbin">GitHub</a> | 
      Running on <a href="https://workers.cloudflare.com">Cloudflare Workers</a>
    </p>
  </footer>
</body>
</html>`;
