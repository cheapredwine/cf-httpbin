/**
 * @fileoverview Unit tests for router utility
 */

import { describe, it, expect, vi } from 'vitest';
import { Router } from '../../src/utils/router';
import type { CFRequest } from '../../src/types';

describe('Router', () => {
  describe('basic routing', () => {
    it('registers and matches GET route', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.get(/^\/test$/, handler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);

      expect(handler).toHaveBeenCalled();
      expect(response?.status).toBe(200);
    });

    it('registers and matches POST route', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('Created', { status: 201 }));

      router.post(/^\/test$/, handler);

      const request = { method: 'POST' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);

      expect(handler).toHaveBeenCalled();
      expect(response?.status).toBe(201);
    });

    it('registers and matches PUT route', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('Updated'));

      router.put(/^\/test$/, handler);

      const request = { method: 'PUT' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);
      expect(handler).toHaveBeenCalled();
    });

    it('registers and matches PATCH route', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('Patched'));

      router.patch(/^\/test$/, handler);

      const request = { method: 'PATCH' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);
      expect(handler).toHaveBeenCalled();
    });

    it('registers and matches DELETE route', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('Deleted'));

      router.delete(/^\/test$/, handler);

      const request = { method: 'DELETE' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('method matching', () => {
    it('returns null when method does not match', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.get(/^\/test$/, handler);

      const request = { method: 'POST' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);

      expect(handler).not.toHaveBeenCalled();
      expect(response).toBeNull();
    });

    it('matches ANY method pseudo-method', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.add(/^\/test$/, ['ANY'], handler);

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const request = { method } as CFRequest;
        const url = new URL('http://localhost/test');

        const response = await router.handle(request, url);
        expect(response?.status).toBe(200);
      }

      expect(handler).toHaveBeenCalledTimes(5);
    });
  });

  describe('pattern matching', () => {
    it('captures regex groups and passes to handler', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.get(/^\/users\/(.+)$/, handler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/users/123');

      await router.handle(request, url);

      expect(handler).toHaveBeenCalled();
      const call = handler.mock.calls[0] as unknown[];
      const match = call[2] as RegExpMatchArray;
      expect(match[1]).toBe('123');
    });

    it('matches patterns with optional trailing slash', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.get(/^\/test\/?$/, handler);

      const urls = ['http://localhost/test', 'http://localhost/test/'];

      for (const urlStr of urls) {
        const request = { method: 'GET' } as CFRequest;
        const url = new URL(urlStr);

        const response = await router.handle(request, url);
        expect(response?.status).toBe(200);
      }
    });

    it('does not match when pattern fails', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.get(/^\/test$/, handler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/other');

      const response = await router.handle(request, url);

      expect(handler).not.toHaveBeenCalled();
      expect(response).toBeNull();
    });

    it('respects pattern start/end anchors', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      // Pattern requires exact match
      router.get(/^\/test$/, handler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test/extra');

      const response = await router.handle(request, url);

      expect(handler).not.toHaveBeenCalled();
      expect(response).toBeNull();
    });
  });

  describe('route priority', () => {
    it('uses first matching route (order matters)', async () => {
      const router = new Router();
      const firstHandler = vi.fn(() => new Response('First'));
      const secondHandler = vi.fn(() => new Response('Second'));

      router.get(/^\/test$/, firstHandler);
      router.get(/^\/test$/, secondHandler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);

      expect(firstHandler).toHaveBeenCalled();
      expect(secondHandler).not.toHaveBeenCalled();
      expect(await response?.text()).toBe('First');
    });

    it('more specific routes should be registered first', async () => {
      const router = new Router();
      const specificHandler = vi.fn(() => new Response('Specific'));
      const generalHandler = vi.fn(() => new Response('General'));

      // Specific pattern first
      router.get(/^\/api\/users\/me$/, specificHandler);
      // General pattern second
      router.get(/^\/api\/users\/(.+)$/, generalHandler);

      // Test specific route
      let request = { method: 'GET' } as CFRequest;
      let url = new URL('http://localhost/api/users/me');

      await router.handle(request, url);
      expect(specificHandler).toHaveBeenCalled();

      // Test general route
      request = { method: 'GET' } as CFRequest;
      url = new URL('http://localhost/api/users/123');

      await router.handle(request, url);
      expect(generalHandler).toHaveBeenCalled();
    });
  });

  describe('middleware', () => {
    it('runs middleware before route handlers', async () => {
      const router = new Router();
      const order: string[] = [];

      const middleware = vi.fn(() => {
        order.push('middleware');
        return null;
      });

      const handler = vi.fn(() => {
        order.push('handler');
        return new Response('OK');
      });

      router.use(middleware);
      router.get(/^\/test$/, handler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test');

      await router.handle(request, url);

      expect(order).toEqual(['middleware', 'handler']);
    });

    it('middleware can short-circuit request', async () => {
      const router = new Router();
      const middleware = vi.fn(() => new Response('Blocked', { status: 403 }));
      const handler = vi.fn(() => new Response('OK'));

      router.use(middleware);
      router.get(/^\/test$/, handler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);

      expect(handler).not.toHaveBeenCalled();
      expect(response?.status).toBe(403);
    });

    it('runs multiple middleware in order', async () => {
      const router = new Router();
      const order: string[] = [];

      router.use(() => {
        order.push('first');
        return null;
      });

      router.use(() => {
        order.push('second');
        return null;
      });

      router.get(/^\/test$/, () => {
        order.push('handler');
        return new Response('OK');
      });

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test');

      await router.handle(request, url);

      expect(order).toEqual(['first', 'second', 'handler']);
    });

    it('stops at first middleware that returns response', async () => {
      const router = new Router();
      const order: string[] = [];

      router.use(() => {
        order.push('first');
        return null;
      });

      router.use(() => {
        order.push('blocking');
        return new Response('Blocked');
      });

      router.use(() => {
        order.push('third');
        return null;
      });

      router.get(/^\/test$/, () => {
        order.push('handler');
        return new Response('OK');
      });

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test');

      await router.handle(request, url);

      expect(order).toEqual(['first', 'blocking']);
    });
  });

  describe('async handlers', () => {
    it('handles async route handlers', async () => {
      const router = new Router();

      router.get(/^\/test$/, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return new Response('Async OK');
      });

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);

      expect(await response?.text()).toBe('Async OK');
    });

    it('handles async middleware', async () => {
      const router = new Router();

      router.use(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return null;
      });

      router.get(/^\/test$/, () => new Response('OK'));

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test');

      const response = await router.handle(request, url);

      expect(response?.status).toBe(200);
    });
  });

  describe('handler parameters', () => {
    it('passes request to handler', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.get(/^\/test$/, handler);

      const request = { method: 'GET', url: 'http://localhost/test' } as CFRequest;
      const url = new URL('http://localhost/test');

      await router.handle(request, url);

      expect(handler).toHaveBeenCalledWith(request, url, expect.any(Array));
    });

    it('passes URL to handler', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.get(/^\/test$/, handler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/test?foo=bar');

      await router.handle(request, url);

      const call = handler.mock.calls[0] as unknown[];
      const passedUrl = call[1]! as URL;
      expect(passedUrl).toBe(url);
      expect(passedUrl.searchParams.get('foo')).toBe('bar');
    });

    it('passes regex match to handler', async () => {
      const router = new Router();
      const handler = vi.fn(() => new Response('OK'));

      router.get(/^\/users\/(.+)\/posts\/(.+)$/, handler);

      const request = { method: 'GET' } as CFRequest;
      const url = new URL('http://localhost/users/123/posts/456');

      await router.handle(request, url);

      const call = handler.mock.calls[0] as unknown[];
      const match = call[2]! as RegExpMatchArray;
      expect(match[0]).toBe('/users/123/posts/456');
      expect(match[1]).toBe('123');
      expect(match[2]).toBe('456');
    });
  });
});
