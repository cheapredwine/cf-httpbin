/**
 * @fileoverview Unit tests for header utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  headersToObj,
  getClientIP,
  parseCookies,
  shouldPrettyPrint,
  jsonResponse,
  textResponse,
} from '../../src/utils/headers';

describe('headersToObj', () => {
  it('converts Headers object to plain object', () => {
    const headers = new Headers({
      'content-type': 'application/json',
      'authorization': 'Bearer token123',
    });

    const result = headersToObj(headers);

    expect(result).toEqual({
      'content-type': 'application/json',
      'authorization': 'Bearer token123',
    });
  });

  it('handles empty headers', () => {
    const headers = new Headers();
    const result = headersToObj(headers);
    expect(result).toEqual({});
  });

  it('handles headers with multiple values', () => {
    const headers = new Headers();
    headers.append('set-cookie', 'cookie1=value1');
    headers.append('set-cookie', 'cookie2=value2');

    const result = headersToObj(headers);

    // Headers.get() returns combined values for most headers
    // but behavior varies by implementation
    expect(result['set-cookie']).toBeDefined();
    expect(result['set-cookie']).toContain('cookie');
  });

  it('preserves header case from Headers object', () => {
    const headers = new Headers();
    headers.set('X-Custom-Header', 'value');

    const result = headersToObj(headers);

    // Headers object lowercases header names
    expect(result).toHaveProperty('x-custom-header');
    expect(result['x-custom-header']).toBe('value');
  });
});

describe('getClientIP', () => {
  it('returns CF-Connecting-IP when present', () => {
    const request = new Request('http://localhost', {
      headers: {
        'CF-Connecting-IP': '1.2.3.4',
        'X-Forwarded-For': '5.6.7.8',
      },
    });

    expect(getClientIP(request)).toBe('1.2.3.4');
  });

  it('falls back to X-Forwarded-For when CF-Connecting-IP is missing', () => {
    const request = new Request('http://localhost', {
      headers: {
        'X-Forwarded-For': '5.6.7.8',
      },
    });

    expect(getClientIP(request)).toBe('5.6.7.8');
  });

  it('returns "unknown" when no IP headers present', () => {
    const request = new Request('http://localhost');

    expect(getClientIP(request)).toBe('unknown');
  });

  it('handles empty header values', () => {
    const request = new Request('http://localhost', {
      headers: {
        'CF-Connecting-IP': '',
      },
    });

    // ?? operator only falls through for null/undefined, not empty string
    // Empty string is returned as-is
    expect(getClientIP(request)).toBe('');
  });
});

describe('parseCookies', () => {
  it('parses simple cookies', () => {
    const cookieHeader = 'session=abc123; user=john';
    const result = parseCookies(cookieHeader);

    expect(result).toEqual({
      session: 'abc123',
      user: 'john',
    });
  });

  it('handles empty cookie header', () => {
    const result = parseCookies('');
    expect(result).toEqual({});
  });

  it('handles cookies with equals signs in values', () => {
    const cookieHeader = 'data=foo=bar; token=abc=def=ghi';
    const result = parseCookies(cookieHeader);

    expect(result).toEqual({
      data: 'foo=bar',
      token: 'abc=def=ghi',
    });
  });

  it('trims whitespace around cookie names and values', () => {
    const cookieHeader = '  session  =  abc123  ;  user  =  john  ';
    const result = parseCookies(cookieHeader);

    expect(result).toEqual({
      session: 'abc123',
      user: 'john',
    });
  });

  it('handles cookies without values', () => {
    const cookieHeader = 'session=abc123; empty=';
    const result = parseCookies(cookieHeader);

    expect(result).toEqual({
      session: 'abc123',
      empty: '',
    });
  });

  it('handles single cookie', () => {
    const result = parseCookies('solo=value');
    expect(result).toEqual({ solo: 'value' });
  });
});

describe('shouldPrettyPrint', () => {
  it('returns true when pretty=1 query param is set', () => {
    const request = new Request('http://localhost/api?pretty=1');
    expect(shouldPrettyPrint(request)).toBe(true);
  });

  it('returns false when pretty=0 query param is set', () => {
    const request = new Request('http://localhost/api?pretty=0');
    expect(shouldPrettyPrint(request)).toBe(false);
  });

  it('returns true when Accept header includes text/html', () => {
    const request = new Request('http://localhost/api', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    expect(shouldPrettyPrint(request)).toBe(true);
  });

  it('returns false when Accept header does not include text/html', () => {
    const request = new Request('http://localhost/api', {
      headers: {
        'Accept': 'application/json',
      },
    });
    expect(shouldPrettyPrint(request)).toBe(false);
  });

  it('pretty=0 overrides Accept: text/html', () => {
    const request = new Request('http://localhost/api?pretty=0', {
      headers: {
        'Accept': 'text/html',
      },
    });
    expect(shouldPrettyPrint(request)).toBe(false);
  });

  it('pretty=1 overrides Accept: application/json', () => {
    const request = new Request('http://localhost/api?pretty=1', {
      headers: {
        'Accept': 'application/json',
      },
    });
    expect(shouldPrettyPrint(request)).toBe(true);
  });

  it('defaults to false with no indicators', () => {
    const request = new Request('http://localhost/api');
    expect(shouldPrettyPrint(request)).toBe(false);
  });
});

describe('jsonResponse', () => {
  it('creates JSON response with correct content-type', () => {
    const request = new Request('http://localhost/api');
    const data = { message: 'hello' };

    const response = jsonResponse(data, request);

    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.status).toBe(200);
  });

  it('sets custom status code', () => {
    const request = new Request('http://localhost/api');
    const response = jsonResponse({ error: 'not found' }, request, 404);

    expect(response.status).toBe(404);
  });

  it('minifies JSON by default', async () => {
    const request = new Request('http://localhost/api');
    const data = { message: 'hello', nested: { key: 'value' } };

    const response = jsonResponse(data, request);
    const body = await response.text();

    expect(body).not.toContain('\n');
    expect(body).toBe(JSON.stringify(data));
  });

  it('pretty-prints JSON when requested', async () => {
    const request = new Request('http://localhost/api?pretty=1');
    const data = { message: 'hello' };

    const response = jsonResponse(data, request);
    const body = await response.text();

    expect(body).toContain('\n');
    expect(body).toContain('  ');
  });

  it('handles null values', async () => {
    const request = new Request('http://localhost/api');
    const response = jsonResponse({ value: null }, request);
    const body = await response.text();

    expect(body).toBe('{"value":null}');
  });

  it('handles arrays', async () => {
    const request = new Request('http://localhost/api');
    const response = jsonResponse([1, 2, 3], request);
    const body = await response.text();

    expect(body).toBe('[1,2,3]');
  });
});

describe('textResponse', () => {
  it('creates text response with default content-type', () => {
    const response = textResponse('Hello, World!');

    expect(response.headers.get('content-type')).toBe('text/plain');
    expect(response.status).toBe(200);
  });

  it('creates text response with custom status', () => {
    const response = textResponse('Not Found', 404);

    expect(response.status).toBe(404);
  });

  it('creates HTML response with custom content-type', () => {
    const response = textResponse('<h1>Hello</h1>', 200, 'text/html');

    expect(response.headers.get('content-type')).toBe('text/html');
  });

  it('returns correct body', async () => {
    const response = textResponse('Test body');
    const body = await response.text();

    expect(body).toBe('Test body');
  });

  it('handles empty string', async () => {
    const response = textResponse('');
    const body = await response.text();

    expect(body).toBe('');
  });
});
