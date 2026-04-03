/**
 * Middleware functions for request/response processing
 */

import type { CFRequest, RequestLog } from '../types';
import { jsonResponse, textResponse, getClientIP } from './headers';

/** Maximum request body size (10MB) */
const MAX_BODY_SIZE = 10 * 1024 * 1024;

/** Security headers to add to all responses */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Handle CORS preflight requests and add CORS headers
 */
export function handleCORS(request: CFRequest): Response | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return null;
}

/**
 * Check request body size and return 413 if too large
 */
export function checkBodySize(request: CFRequest): Response | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_BODY_SIZE) {
      return jsonResponse(
        { error: 'Payload Too Large', message: `Maximum body size is ${MAX_BODY_SIZE} bytes` },
        request,
        413
      );
    }
  }
  return null;
}

/**
 * Log request details for debugging/monitoring
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

  // Use console.log for Cloudflare Logpush integration
  console.log(JSON.stringify(logEntry));
}

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }

  // Add CORS header to allow cross-origin requests
  newHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  request: CFRequest,
  message: string,
  status: number
): Response {
  return jsonResponse({ error: message, status }, request, status);
}

/**
 * Wrapper to apply middleware to a handler response
 */
export function withMiddleware(handler: (req: CFRequest, url: URL) => Promise<Response>) {
  return async (request: CFRequest, url: URL): Promise<Response> => {
    // Log the request
    logRequest(request, url);

    // Check body size
    const sizeCheck = checkBodySize(request);
    if (sizeCheck) return addSecurityHeaders(sizeCheck);

    // Handle CORS
    const corsResponse = handleCORS(request);
    if (corsResponse) return addSecurityHeaders(corsResponse);

    // Run the handler
    try {
      const response = await handler(request, url);
      return addSecurityHeaders(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const errorResponse = jsonResponse(
        { error: 'Internal Server Error', message },
        request,
        500
      );
      return addSecurityHeaders(errorResponse);
    }
  };
}
