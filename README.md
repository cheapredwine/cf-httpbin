# flarebin

An [httpbin.org](https://httpbin.org)-inspired HTTP testing service running on [Cloudflare Workers](https://workers.cloudflare.com). No servers, no containers — just a Worker deployed globally on Cloudflare's edge.

**Live:** [https://flarebin.jsherron-test-account.workers.dev](https://flarebin.jsherron-test-account.workers.dev)

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
| `/cf` | Returns Cloudflare metadata: location (colo, country, region, city, lat/lon, timezone), network (ASN, organization), performance (TCP/QUIC RTT), and request info (Ray ID, scheme, device) |

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

### Utilities

| Endpoint | Description |
|---|---|
| `/uuid` | Returns a UUIDv4 |
| `/base64/:value` | Decodes base64 value |
| `/bytes/:n` | Returns n random bytes (max 100KB) |

### Compression

| Endpoint | Description |
|---|---|
| `/gzip` | Returns gzip-compressed JSON |
| `/deflate` | Returns deflate-compressed JSON |

## Features

### CORS Support
All endpoints support Cross-Origin Resource Sharing (CORS) with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`

Preflight `OPTIONS` requests return a 204 response with appropriate headers.

### Security Headers
All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### JSON Error Responses
Error responses return structured JSON instead of plain text:
```json
{
  "error": "Invalid status code",
  "status": 400
}
```

### Request Limits
- Maximum request body size: **10MB**
- Maximum delay: **10 seconds**
- Maximum stream items: **100**
- Maximum bytes (streaming or direct): **100KB**

### Request Logging
All requests are logged in structured JSON format for monitoring and debugging:
```json
{
  "method": "GET",
  "path": "/get",
  "ip": "1.2.3.4",
  "userAgent": "curl/7.64.1",
  "timestamp": "2026-04-03T05:44:50.123Z",
  "ray": "9e65c4f05ae8a0c3"
}
```

## Browser URLs

Paste these directly into a browser:

```
# HTTP Methods
https://flarebin.jsherron-test-account.workers.dev/get
https://flarebin.jsherron-test-account.workers.dev/anything
https://flarebin.jsherron-test-account.workers.dev/anything/custom-path

# Request Inspection
https://flarebin.jsherron-test-account.workers.dev/headers
https://flarebin.jsherron-test-account.workers.dev/ip
https://flarebin.jsherron-test-account.workers.dev/user-agent
https://flarebin.jsherron-test-account.workers.dev/cf

# Response Formats
https://flarebin.jsherron-test-account.workers.dev/json
https://flarebin.jsherron-test-account.workers.dev/html
https://flarebin.jsherron-test-account.workers.dev/xml
https://flarebin.jsherron-test-account.workers.dev/robots.txt
https://flarebin.jsherron-test-account.workers.dev/deny
https://flarebin.jsherron-test-account.workers.dev/encoding/utf8

# Status Codes
https://flarebin.jsherron-test-account.workers.dev/status/200
https://flarebin.jsherron-test-account.workers.dev/status/404
https://flarebin.jsherron-test-account.workers.dev/status/418
https://flarebin.jsherron-test-account.workers.dev/status/500
https://flarebin.jsherron-test-account.workers.dev/status/200,404,500

# Redirects
https://flarebin.jsherron-test-account.workers.dev/redirect/3
https://flarebin.jsherron-test-account.workers.dev/absolute-redirect/3
https://flarebin.jsherron-test-account.workers.dev/relative-redirect/3
https://flarebin.jsherron-test-account.workers.dev/redirect-to?url=https://cloudflare.com
https://flarebin.jsherron-test-account.workers.dev/redirect-to?url=https://cloudflare.com&status_code=301

# Delays
https://flarebin.jsherron-test-account.workers.dev/delay/2
https://flarebin.jsherron-test-account.workers.dev/delay/5

# Auth (browser will prompt for credentials)
https://flarebin.jsherron-test-account.workers.dev/basic-auth/myuser/mypass
https://flarebin.jsherron-test-account.workers.dev/bearer

# Cookies
https://flarebin.jsherron-test-account.workers.dev/cookies
https://flarebin.jsherron-test-account.workers.dev/cookies/set?foo=bar&baz=qux
https://flarebin.jsherron-test-account.workers.dev/cookies/delete?foo=

# Streaming
https://flarebin.jsherron-test-account.workers.dev/stream/5
https://flarebin.jsherron-test-account.workers.dev/stream-bytes/1024
```

## Examples

### macOS / Linux (curl)

```bash
BASE=https://flarebin.jsherron-test-account.workers.dev

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
$BASE = "https://flarebin.jsherron-test-account.workers.dev"

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
- Request Inspection (/headers, /ip, /user-agent, /cf)
- Response Formats (/json, /html, /xml, /robots.txt, /deny, /encoding/utf8)
- Status Codes (/status/:code)
- Redirects (/redirect, /absolute-redirect, /relative-redirect, /redirect-to)
- Delays (/delay/:seconds)
- Auth (/basic-auth, /bearer)
- Cookies (/cookies, /cookies/set, /cookies/delete)
- Streaming (/stream, /stream-bytes)
- CORS handling and headers
- Security headers
- JSON error responses
- Request body size limits

## Deployment

### Automatic Deployment via GitHub Actions

This project deploys automatically to Cloudflare Workers on every push to `main` using GitHub Actions.

**Prerequisites:**

1. A [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. GitHub repository secrets configured

**Setup GitHub Secrets:**

**Step 1: Get your Cloudflare Account ID**

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** in the left sidebar
3. Your Account ID is displayed on the right side of the page, or in the URL: `dash.cloudflare.com/{ACCOUNT_ID}/...`
4. Copy this value - you'll add it to GitHub in Step 3

**Step 2: Create a Cloudflare API Token**

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **"Edit Cloudflare Workers"** template (click "Use template")
4. Review the permissions (should include `Account > Workers Scripts > Edit`)
5. Click **Continue to summary**, then **Create Token**
6. **Copy the token immediately** (you can't see it again after leaving this page)

**Step 3: Add Secrets to GitHub**

1. Go to your GitHub repository: `https://github.com/cheapredwine/flarebin`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the first secret:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Paste the token from Step 2
   - Click **Add secret**
5. Click **New repository secret** again
6. Add the second secret:
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: Paste the Account ID from Step 1
   - Click **Add secret**

**That's it!** The next push to `main` will automatically deploy your Worker.

**How it works:**

- Every push to `main` triggers the deploy workflow (`.github/workflows/deploy.yml`)
- The workflow runs `npm run bundle` to create `dist/bundle.js`
- Wrangler deploys the bundle to Cloudflare Workers
- Your Worker is live at `https://flarebin.YOUR_SUBDOMAIN.workers.dev`

**Manual Deployment:**

You can also deploy manually from your local machine:

```bash
# Install dependencies
npm install

# Build the bundle
npm run bundle

# Deploy to Cloudflare Workers
npm run deploy
```

Manual deployment requires:
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) authenticated with your Cloudflare account
- Run `npx wrangler login` to authenticate

## Notes

- `/ip` returns `origin` (client), `proxy` (edge), and `forwarded_for` (full chain)
- `/delay` is capped at 10 seconds
- `/stream-bytes` is capped at 100KB
- Streaming responses use `ReadableStream` natively in the Workers runtime