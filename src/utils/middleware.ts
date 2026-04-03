/**
 * @fileoverview Middleware functions for request/response processing
 *
 * Middleware are functions that run before (and sometimes after) route handlers.
 * They handle cross-cutting concerns like:
 * - Logging (tracking requests)
 * - Security (headers, CORS)
 * - Validation (body size limits)
 * - Error handling
 *
 * Think of middleware as a pipeline: Request → Middleware → Route Handler → Middleware → Response
 */

import type { CFRequest, RequestLog } from '../types';
import { jsonResponse, textResponse, getClientIP } from './headers';

// =============================================================================
// Constants
// =============================================================================

/** Maximum request body size (10MB) - prevents memory exhaustion attacks */
const MAX_BODY_SIZE = 10 * 1024 * 1024;

/** Security headers to add to all responses */
export const securityHeaders = {
  /** Prevents MIME type sniffing (browser won't try to guess content type) */
  'X-Content-Type-Options': 'nosniff',
  /** Prevents the page from being embedded in iframes (clickjacking protection) */
  'X-Frame-Options': 'DENY',
  /** Enables XSS protection in older browsers */
  'X-XSS-Protection': '1; mode=block',
  /** Controls how much referrer info is sent with requests */
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// =============================================================================
// Individual Middleware Functions
// =============================================================================

/**
 * Handle CORS (Cross-Origin Resource Sharing)
 *
 * CORS is a security mechanism that controls which websites can access your API.
 * Browsers enforce this - server-to-server requests ignore CORS.
 *
 * This middleware:
 * 1. Responds to preflight OPTIONS requests (browser asking permission)
 * 2. Returns null for actual requests (letting them continue)
 *
 * @param request - The incoming request
 * @returns Response for OPTIONS requests, null for others
 */
export function handleCORS(request: CFRequest): Response | null {
  // Preflight requests are sent by browsers before the actual request
  // for "non-simple" operations (PUT, DELETE, custom headers, etc.)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, // No Content - preflight has no body
      headers: {
        // Allow requests from ANY origin (domain) - permissive for testing
        'Access-Control-Allow-Origin': '*',
        // Allowed HTTP methods
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
        // Allowed request headers
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        // How long browsers can cache this preflight response (24 hours in seconds)
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Not a preflight request - continue to next middleware/handler
  return null;
}

/**
 * Check if request body size exceeds limit
 *
 * This prevents attackers from exhausting memory by sending huge requests.
 * We check the Content-Length header before reading the body.
 *
 * @param request - The incoming request
 * @returns 413 error response if too large, null if OK
 */
export function checkBodySize(request: CFRequest): Response | null {
  const contentLength = request.headers.get('content-length');

  if (contentLength) {
    // ParseInt converts string to number (base 10)
    const size = parseInt(contentLength, 10);

    if (size > MAX_BODY_SIZE) {
      return jsonResponse(
        {
          error: 'Payload Too Large',
          message: `Maximum body size is ${MAX_BODY_SIZE} bytes`,
        },
        request,
        413 // HTTP 413 Payload Too Large
      );
    }
  }

  // Size is OK (or unknown) - continue
  return null;
}

/**
 * Log request details
 *
 * Structured logging helps with:
 * - Debugging issues
 * - Monitoring traffic patterns
 * - Security auditing
 * - Performance analysis
 *
 * We use JSON format for easy parsing by log analysis tools.
 *
 * @param request - The incoming request
 * @param url - Parsed URL object
 */
export function logRequest(request: CFRequest, url: URL): void {
  const logEntry: RequestLog = {
    method: request.method,
    path: url.pathname,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
    ray: request.headers.get('cf-ray'),
  };

  // JSON.stringify converts the object to a JSON string
  // Cloudflare Logpush can ingest these structured logs
  console.log(JSON.stringify(logEntry));
}

/**
 * Add security headers to a response
 *
 * Security headers tell browsers how to handle the response safely.
 * They're a defense-in-depth measure against various attacks.
 *
 * @param response - The response to enhance
 * @returns New response with security headers added
 */
export function addSecurityHeaders(response: Response): Response {
  // Create new headers based on existing ones
  // We create a copy instead of modifying the original (immutable)
  const newHeaders = new Headers(response.headers);

  // Add each security header
  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }

  // Also add CORS header to allow cross-origin requests
  newHeaders.set('Access-Control-Allow-Origin', '*');

  // Create a new Response with the enhanced headers
  // We copy over body, status, and statusText from the original
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Create a standardized error response
 *
 * Ensures all errors have a consistent format:
 * { error: "message", status: code }
 *
 * @param request - The incoming request (for jsonResponse)
 * @param message - Error message
 * @param status - HTTP status code
 * @returns JSON error response
 */
export function createErrorResponse(
  request: CFRequest,
  message: string,
  status: number
): Response {
  return jsonResponse({ error: message, status }, request, status);
}

// =============================================================================
// Middleware Wrapper
// =============================================================================

/**
 * Wrap a route handler with middleware
 *
 * This function creates a new function that:
 * 1. Runs middleware before the handler (logging, size check, CORS)
 * 2. Runs the handler
 * 3. Adds security headers to the response
 * 4. Catches and handles any errors
 *
 * It's a "higher-order function" - a function that takes/returns functions.
 *
 * Execution order:
 *   logRequest → checkBodySize → handleCORS → handler → addSecurityHeaders
 *
 * @param handler - The route handler to wrap
 * @returns New function with middleware applied
 */
export function withMiddleware(
  handler: (req: CFRequest, url: URL) => Promise<Response>
) {
  // Return an async function that will be called for each request
  return async (request: CFRequest, url: URL): Promise<Response> => {
    // Step 1: Log the request
    logRequest(request, url);

    // Step 2: Check body size limit
    const sizeCheck = checkBodySize(request);
    if (sizeCheck) {
      // Request too large - return error with security headers
      return addSecurityHeaders(sizeCheck);
    }

    // Step 3: Handle CORS preflight
    const corsResponse = handleCORS(request);
    if (corsResponse) {
      // This was a preflight request - return response with security headers
      return addSecurityHeaders(corsResponse);
    }

    // Step 4: Run the actual route handler
    try {
      const response = await handler(request, url);

      // Step 5: Add security headers to successful response
      return addSecurityHeaders(response);
    } catch (err) {
      // Error handling: convert exception to proper response
      // instanceof checks the error type at runtime
      const message = err instanceof Error ? err.message : String(err);

      const errorResponse = jsonResponse(
        { error: 'Internal Server Error', message },
        request,
        500 // HTTP 500 Internal Server Error
      );

      return addSecurityHeaders(errorResponse);
    }
  };
}
