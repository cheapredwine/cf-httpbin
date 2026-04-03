/**
 * @fileoverview Request inspection endpoints
 *
 * These endpoints let clients see how their request appears to the server.
 * Useful for debugging proxies, headers, and client configuration.
 *
 * Endpoints:
 * - /headers - Show all request headers
 * - /ip - Show client IP and proxy chain
 * - /user-agent - Show browser/client identifier
 * - /cf - Show Cloudflare-specific metadata
 */

import type { CFRequest, IPInfo, CFMetadata } from '../types';
import { jsonResponse, headersToObj, getClientIP } from '../utils/headers';

/**
 * Handle GET /headers
 *
 * Returns all headers sent by the client. This is useful for debugging:
 * - What headers your HTTP client is actually sending
 * - What headers proxies/CDNs are adding
 * - Header case sensitivity issues
 *
 * @param request - The incoming request
 * @returns JSON response with all headers
 */
export function handleHeaders(request: CFRequest): Response {
  return jsonResponse({ headers: headersToObj(request.headers) }, request);
}

/**
 * Handle GET /ip
 *
 * Returns IP address information from various sources.
 *
 * When you make an HTTP request, your IP can appear in multiple places:
 * - Direct connection IP (visible to server)
 * - X-Forwarded-For header (added by proxies)
 * - CF-Connecting-IP header (added by Cloudflare)
 *
 * This endpoint shows all of them so you understand your "network path".
 *
 * @param request - The incoming request
 * @returns JSON with origin IP, proxy IP, and forwarded-for chain
 */
export function handleIP(request: CFRequest): Response {
  // Get the original client IP from Cloudflare's header
  // The ?? operator provides a default if the header is missing
  const origin = request.headers.get('cf-connecting-ip') ?? 'unknown';

  // X-Forwarded-For is a comma-separated list of IPs
  // Format: client, proxy1, proxy2, ...
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';

  // Find the last proxy in the chain (if any)
  // We look for the last IP in the X-Forwarded-For list
  let proxy = 'unknown';
  if (forwardedFor) {
    // Split by comma, trim whitespace from each IP
    const ips = forwardedFor.split(',').map(ip => ip.trim());

    // If there's more than one IP, the last one is the proxy closest to us
    if (ips.length > 1) {
      // The ! tells TypeScript "this won't be undefined" (we checked length > 1)
      proxy = ips[ips.length - 1]!;
    }
  }

  // Build the response object using our IPInfo interface
  const info: IPInfo = {
    origin,           // Real client IP
    proxy,            // Last proxy in chain
    forwarded_for: forwardedFor || null,  // Full chain (null if empty)
  };

  return jsonResponse(info, request);
}

/**
 * Handle GET /user-agent
 *
 * Returns the User-Agent header, which identifies the browser/client.
 *
 * Examples:
 * - Browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
 * - curl: "curl/7.64.1"
 * - Python requests: "python-requests/2.28.1"
 *
 * @param request - The incoming request
 * @returns JSON with user-agent string
 */
export function handleUserAgent(request: CFRequest): Response {
  const userAgent = request.headers.get('user-agent') ?? '';

  return jsonResponse({ 'user-agent': userAgent }, request);
}

/**
 * Handle GET /cf
 *
 * Returns Cloudflare-specific metadata about the request.
 *
 * Cloudflare adds a ton of useful information to every request via:
 * 1. The `request.cf` object (populated by Cloudflare's edge)
 * 2. Various CF-* headers
 *
 * This data includes:
 * - Geographic location (country, city, lat/lon)
 * - Network info (ASN, organization)
 * - Performance metrics (TCP/QUIC RTT)
 * - Request details (Ray ID, datacenter)
 *
 * @param request - The incoming request with Cloudflare properties
 * @returns JSON with Cloudflare metadata
 */
export function handleCf(request: CFRequest): Response {
  // CF-Visitor header contains the original scheme (http vs https)
  // This is useful because the connection to Cloudflare might be HTTPS
  // even if the origin request was HTTP
  const cfVisitorHeader = request.headers.get('cf-visitor');
  let scheme: string | null = null;

  if (cfVisitorHeader) {
    try {
      // Parse the JSON: {"scheme":"https"}
      scheme = JSON.parse(cfVisitorHeader).scheme;
    } catch {
      // If parsing fails, scheme stays null and we use fallback below
    }
  }

  // Access the request.cf object which contains Cloudflare-specific metadata
  // This is added by Cloudflare's edge before your Worker sees the request
  const cfProperties = request.cf;

  // Build the metadata object
  // The pattern `(cf?.property as Type | undefined) ?? null` means:
  // 1. Try to access cf.property (?. safely handles if cf is undefined)
  // 2. Cast it to the expected type OR undefined (Cloudflare's types are broad)
  // 3. Use ?? null to convert undefined to null for consistency
  const metadata: CFMetadata = {
    // Basic request info
    ray: request.headers.get('cf-ray') ?? null,
    ip: getClientIP(request),
    scheme: scheme ?? request.headers.get('x-forwarded-proto') ?? 'https',

    // Geographic info from Cloudflare's GeoIP database
    colo: (cfProperties?.colo as string | undefined) ?? null,
    country: (cfProperties?.country as string | undefined) ?? null,
    region: (cfProperties?.region as string | undefined) ?? null,
    regionCode: (cfProperties?.regionCode as string | undefined) ?? null,
    city: (cfProperties?.city as string | undefined) ?? null,
    postalCode: (cfProperties?.postalCode as string | undefined) ?? null,
    metroCode: (cfProperties?.metroCode as string | undefined) ?? null,
    timezone: (cfProperties?.timezone as string | undefined) ?? null,
    latitude: (cfProperties?.latitude as string | undefined) ?? null,
    longitude: (cfProperties?.longitude as string | undefined) ?? null,

    // Network info from ASN lookup
    asn: (cfProperties?.asn as number | undefined) ?? null,
    asOrganization: (cfProperties?.asOrganization as string | undefined) ?? null,

    // Performance metrics
    clientTcpRtt: (cfProperties?.clientTcpRtt as number | undefined) ?? null,
    clientQuicRtt: (cfProperties?.clientQuicRtt as number | undefined) ?? null,

    // Device detection
    device: request.headers.get('cf-device-type') ?? null,
    clientAcceptEncoding: (cfProperties?.clientAcceptEncoding as string | undefined) ?? null,

    // Worker context - is this request from another Worker?
    isWorkerSubrequest: request.headers.get('cf-worker') !== null,
  };

  return jsonResponse(metadata, request);
}
