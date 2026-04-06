/**
 * @fileoverview Unit tests for compression utility functions
 */

import { describe, it, expect } from 'vitest';
import { gzip, deflate } from '../../src/utils/compression';

describe('gzip', () => {
  it('compresses string data', async () => {
    const original = 'Hello, World! This is a test string for compression.';
    const compressed = await gzip(original);

    expect(compressed).toBeInstanceOf(ArrayBuffer);
    expect(compressed.byteLength).toBeGreaterThan(0);
    expect(compressed.byteLength).toBeLessThan(original.length * 2);
  });

  it('produces smaller output for compressible data', async () => {
    const original = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // Highly compressible
    const compressed = await gzip(original);

    expect(compressed.byteLength).toBeLessThan(original.length);
  });

  it('handles empty string', async () => {
    const compressed = await gzip('');

    expect(compressed).toBeInstanceOf(ArrayBuffer);
    expect(compressed.byteLength).toBeGreaterThan(0); // Gzip has header overhead
  });

  it('handles unicode strings', async () => {
    const original = 'Hello, 世界! 🌍 Привет, мир!';
    const compressed = await gzip(original);

    expect(compressed).toBeInstanceOf(ArrayBuffer);
    expect(compressed.byteLength).toBeGreaterThan(0);
  });

  it('handles large strings', async () => {
    const original = 'x'.repeat(10000);
    const compressed = await gzip(original);

    expect(compressed).toBeInstanceOf(ArrayBuffer);
    expect(compressed.byteLength).toBeGreaterThan(0);
    // Large repeated pattern should compress well
    expect(compressed.byteLength).toBeLessThan(original.length / 10);
  });

  it('produces different output for different inputs', async () => {
    const input1 = 'Hello, World!';
    const input2 = 'Goodbye, World!';

    const compressed1 = await gzip(input1);
    const compressed2 = await gzip(input2);

    // Convert to arrays for comparison
    const arr1 = new Uint8Array(compressed1);
    const arr2 = new Uint8Array(compressed2);

    // They should be different
    expect(arr1).not.toEqual(arr2);
  });

  it('produces consistent output for same input', async () => {
    const input = 'Test consistency';

    const compressed1 = await gzip(input);
    const compressed2 = await gzip(input);

    const arr1 = new Uint8Array(compressed1);
    const arr2 = new Uint8Array(compressed2);

    expect(arr1).toEqual(arr2);
  });
});

describe('deflate', () => {
  it('compresses string data', async () => {
    const original = 'Hello, World! This is a test string for compression.';
    const compressed = await deflate(original);

    expect(compressed).toBeInstanceOf(ArrayBuffer);
    expect(compressed.byteLength).toBeGreaterThan(0);
  });

  it('produces smaller output for compressible data', async () => {
    const original = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'; // Highly compressible
    const compressed = await deflate(original);

    expect(compressed.byteLength).toBeLessThan(original.length);
  });

  it('handles empty string', async () => {
    const compressed = await deflate('');

    expect(compressed).toBeInstanceOf(ArrayBuffer);
    expect(compressed.byteLength).toBeGreaterThan(0); // Deflate has overhead
  });

  it('handles unicode strings', async () => {
    const original = 'Hello, 世界! 🌍 Привет, мир!';
    const compressed = await deflate(original);

    expect(compressed).toBeInstanceOf(ArrayBuffer);
    expect(compressed.byteLength).toBeGreaterThan(0);
  });

  it('handles large strings', async () => {
    const original = 'y'.repeat(10000);
    const compressed = await deflate(original);

    expect(compressed).toBeInstanceOf(ArrayBuffer);
    expect(compressed.byteLength).toBeGreaterThan(0);
    // Large repeated pattern should compress well
    expect(compressed.byteLength).toBeLessThan(original.length / 10);
  });

  it('produces different output than gzip', async () => {
    const input = 'Test compression algorithms';

    const gzipped = await gzip(input);
    const deflated = await deflate(input);

    // Gzip adds headers, so it should be slightly larger
    expect(gzipped.byteLength).toBeGreaterThanOrEqual(deflated.byteLength);

    // They should have different content
    const gzipArr = new Uint8Array(gzipped);
    const deflateArr = new Uint8Array(deflated);
    expect(gzipArr).not.toEqual(deflateArr);
  });

  it('produces consistent output for same input', async () => {
    const input = 'Test consistency';

    const compressed1 = await deflate(input);
    const compressed2 = await deflate(input);

    const arr1 = new Uint8Array(compressed1);
    const arr2 = new Uint8Array(compressed2);

    expect(arr1).toEqual(arr2);
  });
});

describe('compression formats', () => {
  it('gzip output starts with gzip magic number', async () => {
    const input = 'Test data';
    const compressed = await gzip(input);
    const bytes = new Uint8Array(compressed);

    // Gzip magic number: 0x1f 0x8b
    expect(bytes[0]).toBe(0x1f);
    expect(bytes[1]).toBe(0x8b);
  });

  it('deflate output is different format than gzip', async () => {
    const input = 'Test data';
    const compressed = await deflate(input);
    const bytes = new Uint8Array(compressed);

    // Deflate doesn't have gzip magic number
    expect(bytes[0]).not.toBe(0x1f);
    expect(bytes[1]).not.toBe(0x8b);
  });

  it('compressed data can be identified by format', async () => {
    const input = 'Test data for format identification';
    const gzipped = new Uint8Array(await gzip(input));
    const deflated = new Uint8Array(await deflate(input));

    // Gzip has magic bytes 1f 8b
    const isGzip = gzipped[0] === 0x1f && gzipped[1] === 0x8b;
    expect(isGzip).toBe(true);

    // Deflate doesn't have those magic bytes
    const deflateLooksLikeGzip = deflated[0] === 0x1f && deflated[1] === 0x8b;
    expect(deflateLooksLikeGzip).toBe(false);
  });
});
