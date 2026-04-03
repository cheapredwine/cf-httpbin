/**
 * @fileoverview Simple router for Cloudflare Workers
 *
 * This is a minimal URL router that:
 * - Matches URL patterns using regular expressions
 * - Dispatches to handler functions based on HTTP method
 * - Supports middleware for cross-cutting concerns
 *
 * Why not use a framework?
 * - This is simple and has zero dependencies
 * - Workers have a 1MB bundle size limit - every KB counts
 * - No need for features like template rendering or DB integration
 *
 * How it works:
 * 1. Routes are registered with a pattern (regex), methods, and handler
 * 2. When a request comes in, we iterate through routes
 * 3. First matching route wins - order matters!
 * 4. The handler is called with (request, url, match)
 */

import type { CFRequest, Route, Middleware } from '../types';

/**
 * Router class for matching URLs to handler functions
 *
 * Usage:
 *   const router = new Router();
 *   router.get(/^\/users$/, handleUsers);
 *   router.post(/^\/users$/, handleCreateUser);
 *   const response = await router.handle(request, url);
 */
export class Router {
  /** Array of registered routes - checked in order */
  private routes: Route[] = [];

  /** Array of middleware functions - run before routes */
  private middlewares: Middleware[] = [];

  /**
   * Add a middleware to be executed before routes
   *
   * Middleware runs before route matching and can:
   * - Return a Response to short-circuit (e.g., CORS preflight)
   * - Return null to continue to route matching
   *
   * @param middleware - The middleware function to add
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Register a route handler
   *
   * This is the low-level method. You usually want the convenience methods below.
   *
   * @param pattern - RegExp to match against URL pathname
   * @param methods - Array of HTTP methods this route accepts (e.g., ['GET', 'POST'])
   * @param handler - Function to call when route matches
   *
   * @example
   * router.add(/^\/users\/(.+)$/, ['GET'], (req, url, match) => {
   *   const userId = match[1]; // Captured from regex
   *   return new Response(`User ${userId}`);
   * });
   */
  add(pattern: RegExp, methods: string[], handler: Route['handler']): void {
    this.routes.push({ pattern, methods, handler });
  }

  // =============================================================================
  // Convenience Methods for HTTP Verbs
  // =============================================================================

  /**
   * Register a GET route
   *
   * @param pattern - RegExp to match URL pathname
   * @param handler - Function to handle the request
   */
  get(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['GET'], handler);
  }

  /**
   * Register a POST route
   */
  post(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['POST'], handler);
  }

  /**
   * Register a PUT route
   */
  put(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['PUT'], handler);
  }

  /**
   * Register a PATCH route
   */
  patch(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['PATCH'], handler);
  }

  /**
   * Register a DELETE route
   */
  delete(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['DELETE'], handler);
  }

  // =============================================================================
  // Request Handling
  // =============================================================================

  /**
   * Handle a request by running middleware and matching routes
   *
   * Execution flow:
   * 1. Run all middleware functions
   * 2. If any middleware returns a Response, return it immediately
   * 3. Otherwise, iterate through routes
   * 4. For each route, check if pattern matches AND method is allowed
   * 5. If match found, call handler and return its response
   * 6. If no match, return null (caller should return 404)
   *
   * @param request - The incoming request
   * @param url - Parsed URL object (for pathname access)
   * @returns Response from middleware/handler, or null if no route matched
   */
  async handle(request: CFRequest, url: URL): Promise<Response | null> {
    // Step 1: Run middleware
    // Middleware can short-circuit by returning a Response
    for (const middleware of this.middlewares) {
      const result = await middleware(request, url);
      if (result !== null) {
        // Middleware wants to handle this request itself
        return result;
      }
      // Middleware returned null - continue to next middleware/route
    }

    // Step 2: Find matching route
    // Routes are checked in registration order - first match wins!
    for (const route of this.routes) {
      // Test if URL pathname matches the route pattern
      // match() returns an array if matched, null if not
      const match = url.pathname.match(route.pattern);

      if (match) {
        // Check if the HTTP method is allowed for this route
        const methodAllowed = route.methods.includes(request.method);

        // Also check for 'ANY' pseudo-method (accepts all methods)
        const anyMethodAllowed = route.methods.includes('ANY');

        if (methodAllowed || anyMethodAllowed) {
          // Match! Call the handler with:
          // - request: The full request object
          // - url: Parsed URL for easy access to pathname, searchParams, etc.
          // - match: Regex match result (includes captured groups)
          return await route.handler(request, url, match);
        }
      }
    }

    // No route matched - return null so caller can send 404
    return null;
  }
}
