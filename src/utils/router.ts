/**
 * Simple router for Cloudflare Workers
 */

import type { CFRequest, Route, Middleware } from '../types';

export class Router {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];

  /**
   * Add a middleware to be executed before routes
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Register a route handler
   */
  add(pattern: RegExp, methods: string[], handler: Route['handler']): void {
    this.routes.push({ pattern, methods, handler });
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  get(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['GET'], handler);
  }

  post(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['POST'], handler);
  }

  put(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['PUT'], handler);
  }

  patch(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['PATCH'], handler);
  }

  delete(pattern: RegExp, handler: Route['handler']): void {
    this.add(pattern, ['DELETE'], handler);
  }

  /**
   * Handle a request by running middlewares and matching routes
   */
  async handle(request: CFRequest, url: URL): Promise<Response | null> {
    // Run middlewares first
    for (const middleware of this.middlewares) {
      const result = await middleware(request, url);
      if (result !== null) {
        return result;
      }
    }

    // Find matching route
    for (const route of this.routes) {
      const match = url.pathname.match(route.pattern);
      if (match && route.methods.includes(request.method)) {
        return await route.handler(request, url, match);
      }

      // Also check for ANY method routes
      if (match && route.methods.includes('ANY')) {
        return await route.handler(request, url, match);
      }
    }

    return null;
  }
}
