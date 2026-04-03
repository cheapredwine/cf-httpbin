/**
 * @fileoverview flarebin — httpbin.org-inspired HTTP testing service for Cloudflare Workers
 *
 * This is the main entry point for the Worker. It:
 * 1. Creates a router
 * 2. Registers all route handlers
 * 3. Wraps everything in middleware (CORS, security headers, logging)
 * 4. Handles incoming requests
 *
 * Architecture:
 * - Router: Matches URLs to handler functions
 * - Routes: Individual endpoint implementations in src/routes/
 * - Middleware: Cross-cutting concerns (CORS, security, logging)
 * - Utils: Helper functions for common operations
 */

import type { CFRequest } from './types';
import { Router } from './utils/router';
import { withMiddleware } from './utils/middleware';
import { textResponse } from './utils/headers';

// =============================================================================
// Route Handler Imports
// =============================================================================
// We import each handler function from its respective module.
// This keeps the code organized - each route category has its own file.

// HTTP method endpoints (/get, /post, etc.)
import {
  handleGet,
  handlePost,
  handlePut,
  handleDelete,
  handlePatch,
  handleAnything,
} from './routes/methods';

// Request inspection endpoints (/headers, /ip, etc.)
import { handleHeaders, handleIP, handleUserAgent, handleCf } from './routes/inspection';

// Response format endpoints (/json, /html, etc.)
import {
  handleJSON,
  handleHTML,
  handleXML,
  handleRobots,
  handleDeny,
  handleUTF8,
} from './routes/formats';

// Status code endpoint (/status/:code)
import { handleStatus } from './routes/status';

// Redirect endpoints
import {
  handleRedirect,
  handleAbsoluteRedirect,
  handleRelativeRedirect,
  handleRedirectTo,
} from './routes/redirects';

// Authentication endpoints
import { handleBasicAuth, handleBearer } from './routes/auth';

// Cookie endpoints
import { handleCookies, handleSetCookies, handleDeleteCookies } from './routes/cookies';

// Streaming endpoints
import { handleStream, handleStreamBytes } from './routes/streaming';

// Utility endpoints (/uuid, /base64, etc.)
import { handleUUID, handleBase64, handleBytes } from './routes/utilities';

// Compression endpoints (/gzip, /deflate)
import { handleGzip, handleDeflate } from './routes/compression';

// Static pages (index, docs, favicon)
import {
  handleIndex,
  handleDocs,
  handleFaviconIco,
  handleFaviconSvg,
} from './routes/static';

// Delay endpoint (/delay/:seconds)
import { handleDelay } from './routes/delays';

// =============================================================================
// Router Setup
// =============================================================================

/**
 * Create and configure the router with all routes
 *
 * Each route consists of:
 * - Pattern: A regular expression that matches the URL path
 * - Methods: HTTP methods this route responds to (GET, POST, etc.)
 * - Handler: Function that processes the request and returns a response
 *
 * Regex Pattern Syntax Quick Reference:
 * - ^ = Start of string (anchor)
 * - $ = End of string (anchor)
 * - \ = Escape special characters (e.g., \. matches literal dot)
 * - / = Literal forward slash
 * - (.+) = Capture group matching one or more characters
 * - \/? = Optional slash (0 or 1)
 * - .* = Any characters (including empty)
 * - ? = Makes the previous character/group optional
 */
function createRouter(): Router {
  const router = new Router();

  // ── HTTP Methods ──────────────────────────────────────────────────────────
  // These endpoints echo back information about the request.
  // They all use the same underlying "reflect" functionality.
  router.get(/^\/get$/, handleGet);
  router.post(/^\/post$/, handlePost);
  router.put(/^\/put$/, handlePut);
  router.delete(/^\/delete$/, handleDelete);
  router.patch(/^\/patch$/, handlePatch);
  // /anything accepts any HTTP method - useful for testing method-specific behavior
  router.add(/^\/anything\/?.*$/, ['ANY'], handleAnything);

  // ── Request Inspection ────────────────────────────────────────────────────
  // Let clients see how their request appears to the server.
  // Useful for debugging proxies, headers, and client configuration.
  router.get(/^\/headers$/, handleHeaders);
  router.get(/^\/ip$/, handleIP);
  router.get(/^\/user-agent$/, handleUserAgent);
  router.get(/^\/cf$/, handleCf);

  // ── Response Formats ──────────────────────────────────────────────────────
  // Return data in different formats for testing content-type handling.
  router.get(/^\/json$/, handleJSON);
  router.get(/^\/html$/, handleHTML);
  router.get(/^\/xml$/, handleXML);
  router.get(/^\/robots\.txt$/, handleRobots);
  router.get(/^\/deny$/, handleDeny);
  router.get(/^\/encoding\/utf8$/, handleUTF8);

  // ── Static Assets ─────────────────────────────────────────────────────────
  // Favicon and other static files.
  // \. escapes the dot so it matches literal dot (not "any character")
  router.get(/^\/favicon\.ico$/, handleFaviconIco);
  router.get(/^\/favicon\.svg$/, handleFaviconSvg);

  // ── Utilities ─────────────────────────────────────────────────────────────
  // Helper endpoints for common operations.
  // (.+) captures the value after the slash as a regex match group.
  // The match! (with !) tells TypeScript "this will exist" since the regex matched.
  router.get(/^\/uuid$/, handleUUID);
  router.get(/^\/base64\/(.+)$/, (req, _url, match) => handleBase64(match!, req));
  router.get(/^\/bytes\/(.+)$/, (req, _url, match) => handleBytes(match!, req));

  // ── Compression ───────────────────────────────────────────────────────────
  // Test compression handling in your HTTP client.
  router.get(/^\/gzip$/, handleGzip);
  router.get(/^\/deflate$/, handleDeflate);

  // ── Status Codes ──────────────────────────────────────────────────────────
  // Return specific HTTP status codes for testing error handling.
  // (.+) captures the status code from the URL.
  router.get(/^\/status\/(.+)$/, (req, _url, match) => handleStatus(match!, req));

  // ── Redirects ─────────────────────────────────────────────────────────────
  // Test redirect following behavior.
  // (.+) captures the redirect count or target URL.
  router.get(/^\/redirect\/(.+)$/, (req, url, match) => handleRedirect(match!, url, req));
  router.get(/^\/absolute-redirect\/(.+)$/, (req, url, match) =>
    handleAbsoluteRedirect(match!, url, req)
  );
  router.get(/^\/relative-redirect\/(.+)$/, (req, _url, match) =>
    handleRelativeRedirect(match!, req)
  );
  // /redirect-to uses query params (?url=...) so no regex capture needed
  router.get(/^\/redirect-to$/, (req, url) => handleRedirectTo(url, req));

  // ── Delays ────────────────────────────────────────────────────────────────
  // Simulate slow responses for testing timeouts and loading states.
  router.get(/^\/delay\/(.+)$/, (req, url, match) => handleDelay(match!, req, url));

  // ── Auth ──────────────────────────────────────────────────────────────────
  // Test authentication handling. Browsers will prompt for credentials.
  router.get(/^\/basic-auth\/(.+)$/, (req, _url, match) => handleBasicAuth(match!, req));
  router.get(/^\/bearer$/, handleBearer);

  // ── Cookies ───────────────────────────────────────────────────────────────
  // Set, read, and delete cookies.
  // These use query params so they don't need regex captures.
  router.get(/^\/cookies$/, handleCookies);
  router.get(/^\/cookies\/set$/, (_req, url) => handleSetCookies(url));
  router.get(/^\/cookies\/delete$/, (_req, url) => handleDeleteCookies(url));

  // ── Streaming ─────────────────────────────────────────────────────────────
  // Test streaming responses and download progress.
  router.get(/^\/stream\/(.+)$/, (req, url, match) => handleStream(match!, req, url));
  router.get(/^\/stream-bytes\/(.+)$/, (req, url, match) =>
    handleStreamBytes(match!, url, req)
  );

  // ── Index & Documentation ─────────────────────────────────────────────────
  // Root path (/) shows the index page, /docs shows API documentation.
  // ^\/?$ matches empty path or just a slash
  router.get(/^\/?$/, handleIndex);
  router.get(/^\/docs$/, handleDocs);

  return router;
}

// =============================================================================
// Main Worker Entry Point
// =============================================================================

// Create the router once at startup (not per-request)
const router = createRouter();

/**
 * Cloudflare Worker fetch handler
 *
 * This function is called for every incoming HTTP request.
 * It's the entry point to our application.
 *
 * @param request - The incoming HTTP request from the client
 * @returns Promise that resolves to an HTTP Response
 */
export default {
  async fetch(request: Request): Promise<Response> {
    // Parse the request URL to access pathname, query params, etc.
    const url = new URL(request.url);

    // Cast the standard Request to our CFRequest type.
    // This adds the `cf` property with Cloudflare-specific metadata.
    // The `as` keyword is a TypeScript type assertion - we know it's safe.
    const cfRequest = request as CFRequest;

    // Wrap the router in middleware.
    // Middleware runs before/after the route handler to add:
    // - Logging
    // - CORS headers
    // - Security headers
    // - Error handling
    const handler = withMiddleware(async (req: CFRequest, requestUrl: URL) => {
      // Ask the router to find and execute a matching route
      const response = await router.handle(req, requestUrl);

      // If no route matched (response is null), return 404 Not Found
      // ?? is the nullish coalescing operator: use right side if left is null/undefined
      return response ?? textResponse('Not Found', 404);
    });

    // Execute the handler and return the response
    return await handler(cfRequest, url);
  },
};
