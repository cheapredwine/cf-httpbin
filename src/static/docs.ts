/**
 * Documentation page HTML
 */

export const DOCS_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Documentation | cf-httpbin</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="/favicon.ico" type="image/x-icon">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Complete documentation for cf-httpbin HTTP testing service">
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
    h2 { 
      color: #333; 
      border-bottom: 2px solid #eee;
      padding-bottom: 8px;
      margin-top: 40px;
    }
    h3 {
      color: #444;
      margin-top: 30px;
    }
    h4 {
      color: #666;
      font-size: 1em;
      margin-top: 20px;
      margin-bottom: 10px;
      font-weight: 600;
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
    pre {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      border-left: 4px solid #f6821f;
    }
    pre code {
      background: none;
      padding: 0;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 20px;
      font-size: 0.9em;
    }
    footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <a href="/" class="back-link">← Back to Home</a>
  
  <header>
    <h1>cf-httpbin Documentation</h1>
    <p>Complete reference for all endpoints and usage examples</p>
  </header>

  <h2>JSON Formatting</h2>
  <p>All JSON responses are automatically pretty-printed (indented) when accessed from a browser for better readability on mobile and desktop. API clients like curl receive minified JSON by default for efficiency.</p>
  
  <p><strong>Override behavior:</strong></p>
  <ul>
    <li>Add <code>?pretty=1</code> to any endpoint to force pretty-printing (useful for curl)</li>
    <li>Add <code>?pretty=0</code> to any endpoint to force minified JSON (useful in browsers)</li>
  </ul>
  
  <p><strong>Examples:</strong></p>
  <pre><code># Force pretty-print in curl
curl "https://cf-httpbin.jsherron-test-account.workers.dev/get?pretty=1"

# Get minified JSON in browser
https://cf-httpbin.jsherron-test-account.workers.dev/get?pretty=0</code></pre>

  <h2>Quick Examples</h2>
  
  <h3>Test a GET request</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl https://cf-httpbin.jsherron-test-account.workers.dev/get</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/get</code></pre>
  
  <h3>Test a POST with JSON</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl -X POST https://cf-httpbin.jsherron-test-account.workers.dev/post \\
  -H "Content-Type: application/json" \\
  -d '{"hello": "world"}'</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod -Method POST https://cf-httpbin.jsherron-test-account.workers.dev/post \`
  -ContentType "application/json" \`
  -Body '{"hello": "world"}'</code></pre>
  
  <h3>Check your IP address</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl https://cf-httpbin.jsherron-test-account.workers.dev/ip</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/ip</code></pre>
  
  <h3>Test Basic Authentication</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl -u myuser:mypass \\
  https://cf-httpbin.jsherron-test-account.workers.dev/basic-auth/myuser/mypass</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("myuser:mypass"))
Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/basic-auth/myuser/mypass \`
  -Headers @{ Authorization = "Basic $cred" }</code></pre>

  <h2>HTTP Methods</h2>
  <table>
    <tr><th>Endpoint</th><th>Method</th><th>Description</th></tr>
    <tr><td><code>/get</code></td><td>GET</td><td>Returns GET request data including args, headers, origin, and url</td></tr>
    <tr><td><code>/post</code></td><td>POST</td><td>Returns POST request data including json, form, files, and headers</td></tr>
    <tr><td><code>/put</code></td><td>PUT</td><td>Returns PUT request data</td></tr>
    <tr><td><code>/delete</code></td><td>DELETE</td><td>Returns DELETE request data</td></tr>
    <tr><td><code>/patch</code></td><td>PATCH</td><td>Returns PATCH request data</td></tr>
    <tr><td><code>/anything</code></td><td>ANY</td><td>Returns request data for any HTTP method</td></tr>
    <tr><td><code>/anything/:path</code></td><td>ANY</td><td>Returns request data with custom path preserved</td></tr>
  </table>

  <h3>Example Response</h3>
  <pre><code>{
  "args": {"foo": "bar"},
  "data": "",
  "files": {},
  "form": {},
  "headers": {
    "accept": "*/*",
    "user-agent": "curl/7.64.1"
  },
  "json": null,
  "method": "GET",
  "origin": "1.2.3.4",
  "url": "https://cf-httpbin.example.com/get?foo=bar"
}</code></pre>

  <h2>Request Inspection</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/headers</code></td><td>Returns all request headers as JSON</td></tr>
    <tr><td><code>/ip</code></td><td>Returns origin (client IP), proxy (edge IP), and forwarded_for chain</td></tr>
    <tr><td><code>/user-agent</code></td><td>Returns the User-Agent header value</td></tr>
    <tr><td><code>/cf</code></td><td>Returns Cloudflare-specific metadata: ray, country, ip, scheme, device, colo</td></tr>
  </table>

  <h2>Response Formats</h2>
  <table>
    <tr><th>Endpoint</th><th>Content-Type</th><th>Description</th></tr>
    <tr><td><code>/json</code></td><td>application/json</td><td>Returns sample JSON slideshow data</td></tr>
    <tr><td><code>/html</code></td><td>text/html</td><td>Returns sample HTML page</td></tr>
    <tr><td><code>/xml</code></td><td>application/xml</td><td>Returns sample XML document</td></tr>
    <tr><td><code>/robots.txt</code></td><td>text/plain</td><td>Returns a robots.txt file</td></tr>
    <tr><td><code>/deny</code></td><td>text/plain</td><td>Returns ASCII art denial message</td></tr>
    <tr><td><code>/encoding/utf8</code></td><td>text/html</td><td>Returns UTF-8 encoded HTML with various characters</td></tr>
  </table>

  <h2>Status Codes</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/status/:code</code></td><td>Returns specified HTTP status code (100-599) with response body "code statusText"</td></tr>
    <tr><td><code>/status/200,404,500</code></td><td>Returns random status from comma-separated list</td></tr>
  </table>

  <h3>Example</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl https://cf-httpbin.jsherron-test-account.workers.dev/status/418
# Returns: 418 I'm a Teapot

curl -I https://cf-httpbin.jsherron-test-account.workers.dev/status/418
# Returns HTTP/2 418 with header info</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code># Get the response body
try {
  Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/status/418
} catch {
  $_.ErrorDetails.Message
}
# Returns: 418 I'm a Teapot

# Get just the status code
try { 
  Invoke-WebRequest https://cf-httpbin.jsherron-test-account.workers.dev/status/418 
} catch { 
  $_.Exception.Response.StatusCode 
}
# Returns: 418</code></pre>

  <h2>Redirects</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/redirect/:n</code></td><td>302 redirect n times (absolute URLs)</td></tr>
    <tr><td><code>/absolute-redirect/:n</code></td><td>302 redirect n times with absolute URLs</td></tr>
    <tr><td><code>/relative-redirect/:n</code></td><td>302 redirect n times with relative URLs</td></tr>
    <tr><td><code>/redirect-to?url=:url</code></td><td>Redirects to specified URL</td></tr>
    <tr><td><code>/redirect-to?url=:url&status_code=:code</code></td><td>Redirects with custom status code</td></tr>
  </table>

  <h3>Example</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl -L https://cf-httpbin.jsherron-test-account.workers.dev/redirect/3
# Follows 3 redirects then returns /get data</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/redirect/3
# PowerShell follows redirects automatically</code></pre>

  <h2>Delays</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/delay/:seconds</code></td><td>Delays response by n seconds (max 10)</td></tr>
  </table>

  <h3>Example</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl https://cf-httpbin.jsherron-test-account.workers.dev/delay/2
# Waits 2 seconds then returns /get data</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/delay/2
# Waits 2 seconds then returns /get data</code></pre>

  <h2>Authentication</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/basic-auth/:user/:pass</code></td><td>HTTP Basic Auth (returns 401 without valid credentials)</td></tr>
    <tr><td><code>/bearer</code></td><td>Bearer token authentication (returns 401 without valid token)</td></tr>
  </table>

  <h3>Example - Basic Auth</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl -u myuser:mypass \\
  https://cf-httpbin.jsherron-test-account.workers.dev/basic-auth/myuser/mypass</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("myuser:mypass"))
Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/basic-auth/myuser/mypass \`
  -Headers @{ Authorization = "Basic $cred" }</code></pre>

  <h3>Example - Bearer Token</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl -H "Authorization: Bearer mytoken123" \\
  https://cf-httpbin.jsherron-test-account.workers.dev/bearer</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/bearer \`
  -Headers @{ Authorization = "Bearer mytoken123" }</code></pre>

  <h2>Cookies</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/cookies</code></td><td>Returns all cookies sent in the request</td></tr>
    <tr><td><code>/cookies/set?name=value</code></td><td>Sets cookies via 302 redirect to /cookies</td></tr>
    <tr><td><code>/cookies/delete?name=</code></td><td>Deletes cookies via 302 redirect to /cookies</td></tr>
  </table>

  <h3>Example</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl -c cookies.txt \\
  "https://cf-httpbin.jsherron-test-account.workers.dev/cookies/set?foo=bar"
curl -b cookies.txt https://cf-httpbin.jsherron-test-account.workers.dev/cookies</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod "https://cf-httpbin.jsherron-test-account.workers.dev/cookies/set?foo=bar" \`
  -WebSession $session
Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/cookies \`
  -WebSession $session</code></pre>

  <h2>Streaming</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/stream/:n</code></td><td>Streams n newline-delimited JSON objects (max 100)</td></tr>
    <tr><td><code>/stream-bytes/:n</code></td><td>Streams n random bytes (max 100KB)</td></tr>
    <tr><td><code>/stream-bytes/:n?chunk_size=:size</code></td><td>Streams with custom chunk size</td></tr>
  </table>

  <h3>Example</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl https://cf-httpbin.jsherron-test-account.workers.dev/stream/5
# Streams 5 JSON lines</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/stream/5
# Returns all 5 JSON lines</code></pre>

  <h2>Utilities</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/uuid</code></td><td>Returns a random UUIDv4</td></tr>
    <tr><td><code>/base64/:value</code></td><td>Decodes base64 encoded value</td></tr>
    <tr><td><code>/bytes/:n</code></td><td>Returns n random bytes (max 100KB)</td></tr>
  </table>

  <h3>Example</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl https://cf-httpbin.jsherron-test-account.workers.dev/uuid
# Returns: {"uuid": "550e8400-e29b-41d4-a716-446655440000"}</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/uuid
# Returns: @{uuid=550e8400-e29b-41d4-a716-446655440000}</code></pre>

  <h2>Compression</h2>
  <table>
    <tr><th>Endpoint</th><th>Description</th></tr>
    <tr><td><code>/gzip</code></td><td>Returns gzip-compressed JSON with Content-Encoding: gzip</td></tr>
    <tr><td><code>/deflate</code></td><td>Returns deflate-compressed JSON with Content-Encoding: deflate</td></tr>
  </table>

  <h3>Example</h3>
  <h4>macOS / Linux (curl)</h4>
  <pre><code>curl --compressed https://cf-httpbin.jsherron-test-account.workers.dev/gzip
# curl automatically decompresses the response</code></pre>
  
  <h4>Windows (PowerShell)</h4>
  <pre><code>Invoke-RestMethod https://cf-httpbin.jsherron-test-account.workers.dev/gzip
# PowerShell automatically handles gzip decompression</code></pre>

  <h2>CORS Support</h2>
  <p>All endpoints support Cross-Origin Resource Sharing (CORS) out of the box:</p>
  <ul>
    <li><code>Access-Control-Allow-Origin: *</code> on all responses</li>
    <li>Preflight <code>OPTIONS</code> requests return 204 with appropriate headers</li>
    <li>Supported methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD</li>
  </ul>

  <h2>Security Headers</h2>
  <p>All responses include security headers:</p>
  <ul>
    <li><code>X-Content-Type-Options: nosniff</code></li>
    <li><code>X-Frame-Options: DENY</code></li>
    <li><code>X-XSS-Protection: 1; mode=block</code></li>
    <li><code>Referrer-Policy: strict-origin-when-cross-origin</code></li>
  </ul>

  <h2>Error Responses</h2>
  <p>Error responses return structured JSON:</p>
  <pre><code>{
  "error": "Invalid status code",
  "status": 400
}</code></pre>

  <h2>Limits</h2>
  <ul>
    <li>Maximum request body size: <strong>10MB</strong></li>
    <li>Maximum delay: <strong>10 seconds</strong></li>
    <li>Maximum stream items: <strong>100</strong></li>
    <li>Maximum bytes (streaming or direct): <strong>100KB</strong></li>
  </ul>

  <h2>Notes</h2>
  <ul>
    <li>All endpoints return JSON unless otherwise noted</li>
    <li><code>/ip</code> returns <code>origin</code> (client IP), <code>proxy</code> (edge IP), and <code>forwarded_for</code> (full X-Forwarded-For chain)</li>
    <li>All responses are generated at the edge on Cloudflare's global network</li>
    <li>Request logging is enabled for monitoring and debugging</li>
  </ul>

  <footer>
    <p>
      <strong>cf-httpbin</strong> | 
      <a href="/">Home</a> | 
      <a href="https://github.com/jsherron/cf-httpbin">GitHub</a> | 
      Running on <a href="https://workers.cloudflare.com">Cloudflare Workers</a>
    </p>
  </footer>
</body>
</html>`;
