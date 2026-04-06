/**
 * @fileoverview Unit tests for middleware functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleCORS,
  checkBodySize,
  logRequest,
  addSecurityHeaders,
  createErrorResponse,
  withMiddleware,
  securityHeaders,
} from '../../src/utils/middleware';
import type { CFRequest } from '../../src/types';

describe('handleCORS', () => {
  it('returns null for non-OPTIONS requests', () => {
    const request = { method: 'GET' } as CFRequest;
    const result = handleCORS(request);

    expect(result).toBeNull();
  });

  it('returns preflight response for OPTIONS requests', () => {
    const request = { method: 'OPTIONS' } as CFRequest;
    const result = handleCORS(request);

    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(204);
  });

  it('includes correct CORS headers in preflight', () => {
    const request = { method: 'OPTIONS' } as CFRequest;
    const result = handleCORS(request)!;

    expect(result.headers.get('access-control-allow-origin')).toBe('*');
    expect(result.headers.get('access-control-allow-methods')).toContain('GET');
    expect(result.headers.get('access-control-allow-methods')).toContain('POST');
    expect(result.headers.get('access-control-allow-methods')).toContain('PUT');
    expect(result.headers.get('access-control-allow-methods')).toContain('DELETE');
    expect(result.headers.get('access-control-allow-methods')).toContain('PATCH');
    expect(result.headers.get('access-control-allow-methods')).toContain('OPTIONS');
    expect(result.headers.get('access-control-allow-headers')).toContain('Content-Type');
    expect(result.headers.get('access-control-allow-headers')).toContain('Authorization');
    expect(result.headers.get('access-control-max-age')).toBe('86400');
  });

  it('has no body for preflight response', async () => {
    const request = { method: 'OPTIONS' } as CFRequest;
    const result = handleCORS(request)!;

    const body = await result.text();
    expect(body).toBe('');
  });
});

describe('checkBodySize', () => {
  it('returns null when no content-length header', () => {
    const request = new Request('http://localhost') as CFRequest;
    const result = checkBodySize(request);

    expect(result).toBeNull();
  });

  it('returns null when content-length is within limit', () => {
    const request = new Request('http://localhost', {
      headers: { 'content-length': '1024' },
    }) as CFRequest;
    const result = checkBodySize(request);

    expect(result).toBeNull();
  });

  it('returns 413 when content-length exceeds limit', () => {
    const request = new Request('http://localhost', {
      headers: { 'content-length': String(11 * 1024 * 1024) },
    }) as CFRequest;
    const result = checkBodySize(request);

    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(413);
  });

  it('includes error message in 413 response', async () => {
    const request = new Request('http://localhost', {
      headers: { 'content-length': String(11 * 1024 * 1024) },
    }) as CFRequest;
    const result = checkBodySize(request)!;

    const body = await result.json();
    expect(body.error).toBe('Payload Too Large');
    expect(body.message).toContain('10485760');
    expect(body.message).toContain('bytes');
  });

  it('handles edge case at exactly the limit', () => {
    const request = new Request('http://localhost', {
      headers: { 'content-length': String(10 * 1024 * 1024) },
    }) as CFRequest;
    const result = checkBodySize(request);

    expect(result).toBeNull();
  });

  it('handles invalid content-length gracefully', () => {
    const request = new Request('http://localhost', {
      headers: { 'content-length': 'invalid' },
    }) as CFRequest;
    const result = checkBodySize(request);

    expect(result).toBeNull();
  });
});

describe('logRequest', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs request details as JSON', () => {
    const request = new Request('http://localhost/test', {
      headers: {
        'user-agent': 'TestAgent/1.0',
        'cf-ray': 'test-ray-id',
      },
    }) as CFRequest;
    const url = new URL('http://localhost/test');

    logRequest(request, url);

    expect(consoleSpy).toHaveBeenCalled();
    const logged = JSON.parse(consoleSpy.mock.calls[0]![0] as string);

    expect(logged.method).toBe('GET');
    expect(logged.path).toBe('/test');
    expect(logged.userAgent).toBe('TestAgent/1.0');
    expect(logged.ray).toBe('test-ray-id');
    expect(logged.timestamp).toBeDefined();
    expect(logged.ip).toBeDefined();
  });

  it('handles missing headers gracefully', () => {
    const request = new Request('http://localhost/test') as CFRequest;
    const url = new URL('http://localhost/test');

    logRequest(request, url);

    const logged = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
    expect(logged.userAgent).toBeNull();
    expect(logged.ray).toBeNull();
  });

  it('uses ISO format for timestamp', () => {
    const request = new Request('http://localhost/test') as CFRequest;
    const url = new URL('http://localhost/test');

    logRequest(request, url);

    const logged = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
    expect(logged.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('addSecurityHeaders', () => {
  it('adds all security headers to response', () => {
    const response = new Response('OK');
    const result = addSecurityHeaders(response);

    Object.entries(securityHeaders).forEach(([key, value]) => {
      expect(result.headers.get(key.toLowerCase())).toBe(value);
    });
  });

  it('adds CORS header', () => {
    const response = new Response('OK');
    const result = addSecurityHeaders(response);

    expect(result.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('preserves existing headers', () => {
    const response = new Response('OK', {
      headers: {
        'content-type': 'application/json',
        'x-custom-header': 'custom-value',
      },
    });
    const result = addSecurityHeaders(response);

    expect(result.headers.get('content-type')).toBe('application/json');
    expect(result.headers.get('x-custom-header')).toBe('custom-value');
  });

  it('overwrites conflicting headers with security values', () => {
    const response = new Response('OK', {
      headers: {
        'x-frame-options': 'SAMEORIGIN',
      },
    });
    const result = addSecurityHeaders(response);

    expect(result.headers.get('x-frame-options')).toBe('DENY');
  });

  it('preserves body and status', async () => {
    const response = new Response('Test body', { status: 201 });
    const result = addSecurityHeaders(response);

    expect(result.status).toBe(201);
    expect(await result.text()).toBe('Test body');
  });

  it('works with error responses', () => {
    const response = new Response('Error', { status: 500 });
    const result = addSecurityHeaders(response);

    expect(result.status).toBe(500);
    expect(result.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('createErrorResponse', () => {
  it('creates JSON error response', async () => {
    const request = new Request('http://localhost') as CFRequest;
    const result = createErrorResponse(request, 'Test error', 400);

    expect(result.status).toBe(400);
    expect(result.headers.get('content-type')).toBe('application/json');

    const body = await result.json();
    expect(body.error).toBe('Test error');
    expect(body.status).toBe(400);
  });

  it('supports different status codes', async () => {
    const request = new Request('http://localhost') as CFRequest;

    const codes = [400, 401, 403, 404, 500];

    for (const code of codes) {
      const result = createErrorResponse(request, 'Error', code);
      expect(result.status).toBe(code);
    }
  });
});

describe('withMiddleware', () => {
  it('calls handler and returns response', async () => {
    const handler = vi.fn(async () => new Response('OK'));
    const wrapped = withMiddleware(handler);

    const request = new Request('http://localhost/test') as CFRequest;
    const url = new URL('http://localhost/test');

    const result = await wrapped(request, url);

    expect(handler).toHaveBeenCalled();
    expect(await result.text()).toBe('OK');
  });

  it('adds security headers to successful response', async () => {
    const handler = vi.fn(async () => new Response('OK'));
    const wrapped = withMiddleware(handler);

    const request = new Request('http://localhost/test') as CFRequest;
    const url = new URL('http://localhost/test');

    const result = await wrapped(request, url);

    expect(result.headers.get('x-content-type-options')).toBe('nosniff');
    expect(result.headers.get('x-frame-options')).toBe('DENY');
  });

  it('blocks requests exceeding body size limit', async () => {
    const handler = vi.fn(async () => new Response('OK'));
    const wrapped = withMiddleware(handler);

    const request = new Request('http://localhost/test', {
      headers: { 'content-length': String(11 * 1024 * 1024) },
    }) as CFRequest;
    const url = new URL('http://localhost/test');

    const result = await wrapped(request, url);

    expect(handler).not.toHaveBeenCalled();
    expect(result.status).toBe(413);
  });

  it('handles CORS preflight without calling handler', async () => {
    const handler = vi.fn(async () => new Response('OK'));
    const wrapped = withMiddleware(handler);

    const request = new Request('http://localhost/test', {
      method: 'OPTIONS',
    }) as CFRequest;
    const url = new URL('http://localhost/test');

    const result = await wrapped(request, url);

    expect(handler).not.toHaveBeenCalled();
    expect(result.status).toBe(204);
    expect(result.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('catches and handles errors in handler', async () => {
    const handler = vi.fn(async () => {
      throw new Error('Handler error');
    });
    const wrapped = withMiddleware(handler);

    const request = new Request('http://localhost/test') as CFRequest;
    const url = new URL('http://localhost/test');

    const result = await wrapped(request, url);

    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('Handler error');
  });

  it('handles non-Error exceptions', async () => {
    const handler = vi.fn(async () => {
      throw 'String error';
    });
    const wrapped = withMiddleware(handler);

    const request = new Request('http://localhost/test') as CFRequest;
    const url = new URL('http://localhost/test');

    const result = await wrapped(request, url);

    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('String error');
  });

  it('adds security headers to error responses', async () => {
    const handler = vi.fn(async () => {
      throw new Error('Error');
    });
    const wrapped = withMiddleware(handler);

    const request = new Request('http://localhost/test') as CFRequest;
    const url = new URL('http://localhost/test');

    const result = await wrapped(request, url);

    expect(result.headers.get('x-content-type-options')).toBe('nosniff');
    expect(result.headers.get('x-frame-options')).toBe('DENY');
    expect(result.headers.get('access-control-allow-origin')).toBe('*');
  });
});
