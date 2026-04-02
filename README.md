# cf-httpbin

An [httpbin.org](https://httpbin.org)-compatible HTTP testing service running on [Cloudflare Workers](https://workers.cloudflare.com). No servers, no containers — just a Worker deployed globally on Cloudflare's edge.

**Live:** <a href="https://cf-httpbin.jsherron-test-account.workers.dev" target="_blank">https://cf-httpbin.jsherron-test-account.workers.dev</a>

## Endpoints

### HTTP Methods

| Endpoint | Method | Description |
|---|---|---|
| `/get` | GET | Returns GET request data |
| `/post` | POST | Returns POST request data |
| `/put` | PUT | Returns PUT request data |
| `/delete` | DELETE | Returns DELETE request data |
| `/patch` | PATCH | Returns PATCH request data |
| `/anything` | ANY | Returns any request data |

### Request Inspection

| Endpoint | Description |
|---|---|
| `/headers` | Returns request headers |
| `/ip` | Returns client IP, proxy IP, and `X-Forwarded-For` chain |
| `/user-agent` | Returns user-agent string |
| `/cf` | Returns Cloudflare-specific metadata (Ray ID, country, colo, etc.) |

### Response Formats

| Endpoint | Description |
|---|---|
| `/json` | Returns sample JSON |
| `/html` | Returns sample HTML |
| `/xml` | Returns sample XML |
| `/robots.txt` | Returns robots.txt |
| `/deny` | Returns a page that should be denied |
| `/encoding/utf8` | Returns a UTF-8 encoded page |

### Status Codes

| Endpoint | Description |
|---|---|
| `/status/:code` | Returns the given HTTP status code |

Comma-separate codes for random selection: `/status/200,404,500`

### Redirects

| Endpoint | Description |
|---|---|
| `/redirect/:n` | 302 redirects n times |
| `/absolute-redirect/:n` | Absolute 302 redirects n times |
| `/relative-redirect/:n` | Relative 302 redirects n times |
| `/redirect-to?url=&status_code=` | Redirects to given URL |

### Delays

| Endpoint | Description |
|---|---|
| `/delay/:seconds` | Delays response by n seconds (max 10) |

### Auth

| Endpoint | Description |
|---|---|
| `/basic-auth/:user/:pass` | HTTP Basic Auth challenge |
| `/bearer` | Bearer token auth challenge |

### Cookies

| Endpoint | Description |
|---|---|
| `/cookies` | Returns current cookies |
| `/cookies/set?name=value` | Sets cookies via redirect |
| `/cookies/delete?name=` | Deletes cookies via redirect |

### Streaming

| Endpoint | Description |
|---|---|
| `/stream/:n` | Streams n newline-delimited JSON objects (max 100) |
| `/stream-bytes/:n` | Streams n random bytes (max 100KB) |

## Browser URLs

Paste these directly into a browser:

```
# HTTP Methods
https://cf-httpbin.jsherron-test-account.workers.dev/get
https://cf-httpbin.jsherron-test-account.workers.dev/anything
https://cf-httpbin.jsherron-test-account.workers.dev/anything/custom-path

# Request Inspection
https://cf-httpbin.jsherron-test-account.workers.dev/headers
https://cf-httpbin.jsherron-test-account.workers.dev/ip
https://cf-httpbin.jsherron-test-account.workers.dev/user-agent
https://cf-httpbin.jsherron-test-account.workers.dev/cf

# Response Formats
https://cf-httpbin.jsherron-test-account.workers.dev/json
https://cf-httpbin.jsherron-test-account.workers.dev/html
https://cf-httpbin.jsherron-test-account.workers.dev/xml
https://cf-httpbin.jsherron-test-account.workers.dev/robots.txt
https://cf-httpbin.jsherron-test-account.workers.dev/deny
https://cf-httpbin.jsherron-test-account.workers.dev/encoding/utf8

# Status Codes
https://cf-httpbin.jsherron-test-account.workers.dev/status/200
https://cf-httpbin.jsherron-test-account.workers.dev/status/404
https://cf-httpbin.jsherron-test-account.workers.dev/status/418
https://cf-httpbin.jsherron-test-account.workers.dev/status/500
https://cf-httpbin.jsherron-test-account.workers.dev/status/200,404,500

# Redirects
https://cf-httpbin.jsherron-test-account.workers.dev/redirect/3
https://cf-httpbin.jsherron-test-account.workers.dev/absolute-redirect/3
https://cf-httpbin.jsherron-test-account.workers.dev/relative-redirect/3
https://cf-httpbin.jsherron-test-account.workers.dev/redirect-to?url=https://cloudflare.com
https://cf-httpbin.jsherron-test-account.workers.dev/redirect-to?url=https://cloudflare.com&status_code=301

# Delays
https://cf-httpbin.jsherron-test-account.workers.dev/delay/2
https://cf-httpbin.jsherron-test-account.workers.dev/delay/5

# Auth (browser will prompt for credentials)
https://cf-httpbin.jsherron-test-account.workers.dev/basic-auth/myuser/mypass
https://cf-httpbin.jsherron-test-account.workers.dev/bearer

# Cookies
https://cf-httpbin.jsherron-test-account.workers.dev/cookies
https://cf-httpbin.jsherron-test-account.workers.dev/cookies/set?foo=bar&baz=qux
https://cf-httpbin.jsherron-test-account.workers.dev/cookies/delete?foo=

# Streaming
https://cf-httpbin.jsherron-test-account.workers.dev/stream/5
https://cf-httpbin.jsherron-test-account.workers.dev/stream-bytes/1024
```

## Examples

### macOS / Linux (curl)

```bash
BASE=https://cf-httpbin.jsherron-test-account.workers.dev

# GET reflection
curl $BASE/get

# POST with JSON body
curl -X POST $BASE/post \
  -H "Content-Type: application/json" \
  -d '{"hello": "world"}'

# POST with form data
curl -X POST $BASE/post \
  -d "foo=bar&baz=qux"

# Your IP as seen by Cloudflare
curl $BASE/ip

# Request headers
curl $BASE/headers

# Specific status code
curl -I $BASE/status/418

# Random status code
curl -I $BASE/status/200,404,500

# 2 second delay
curl $BASE/delay/2

# Redirect 3 times
curl -L $BASE/redirect/3

# Redirect to a URL
curl -L "$BASE/redirect-to?url=https://cloudflare.com"

# Basic auth (correct credentials)
curl -u myuser:mypass $BASE/basic-auth/myuser/mypass

# Bearer token
curl -H "Authorization: Bearer mytoken" $BASE/bearer

# Set a cookie and read it back
curl -c cookies.txt "$BASE/cookies/set?foo=bar"
curl -b cookies.txt $BASE/cookies

# Stream 5 JSON lines
curl $BASE/stream/5

# Stream 1024 random bytes
curl $BASE/stream-bytes/1024
```

### Windows (PowerShell)

```powershell
$BASE = "https://cf-httpbin.jsherron-test-account.workers.dev"

# GET reflection
Invoke-RestMethod "$BASE/get"

# POST with JSON body
Invoke-RestMethod -Method POST "$BASE/post" `
  -ContentType "application/json" `
  -Body '{"hello": "world"}'

# POST with form data
Invoke-RestMethod -Method POST "$BASE/post" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "foo=bar&baz=qux"

# Your IP as seen by Cloudflare
Invoke-RestMethod "$BASE/ip"

# Request headers
Invoke-RestMethod "$BASE/headers"

# Specific status code (show status)
try { Invoke-WebRequest "$BASE/status/418" } catch { $_.Exception.Response.StatusCode }

# Random status code
try { Invoke-WebRequest "$BASE/status/200,404,500" } catch { $_.Exception.Response.StatusCode }

# 2 second delay
Invoke-RestMethod "$BASE/delay/2"

# Redirect 3 times (followed automatically)
Invoke-RestMethod "$BASE/redirect/3"

# Redirect to a URL
Invoke-RestMethod "$BASE/redirect-to?url=https://cloudflare.com"

# Basic auth
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("myuser:mypass"))
Invoke-RestMethod "$BASE/basic-auth/myuser/mypass" `
  -Headers @{ Authorization = "Basic $cred" }

# Bearer token
Invoke-RestMethod "$BASE/bearer" `
  -Headers @{ Authorization = "Bearer mytoken" }

# Set a cookie and read it back
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod "$BASE/cookies/set?foo=bar" -WebSession $session
Invoke-RestMethod "$BASE/cookies" -WebSession $session

# Stream 5 JSON lines
Invoke-RestMethod "$BASE/stream/5"

# Stream 1024 random bytes (save to file)
Invoke-WebRequest "$BASE/stream-bytes/1024" -OutFile random.bin
```

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy
npm run deploy
```

Requires [Node.js](https://nodejs.org) and a [Cloudflare account](https://dash.cloudflare.com/sign-up).

## Testing

Tests are written with [Vitest](https://vitest.dev) and run in a local [Miniflare](https://miniflare.dev) environment.

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

The test suite covers:
- HTTP Methods (GET, POST, PUT, DELETE, PATCH, /anything)
- Request Inspection (/headers, /ip, /user-agent)
- Response Formats (/json, /html, /xml, /robots.txt, /deny, /encoding/utf8)
- Status Codes (/status/:code)
- Redirects (/redirect, /absolute-redirect, /relative-redirect, /redirect-to)
- Delays (/delay/:seconds)
- Auth (/basic-auth, /bearer)
- Cookies (/cookies, /cookies/set, /cookies/delete)
- Streaming (/stream, /stream-bytes)

## Deployment

This Worker deploys automatically to Cloudflare Workers via the Cloudflare Dashboard on every push to `main`.

## Notes

- `/ip` returns `origin` (client), `proxy` (edge), and `forwarded_for` (full chain)
- `/delay` is capped at 10 seconds
- `/stream-bytes` is capped at 100KB
- Streaming responses use `ReadableStream` natively in the Workers runtime