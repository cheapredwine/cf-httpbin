/**
 * Request inspection route handlers
 */

import type { CFRequest, IPInfo, CFMetadata } from '../types';
import { jsonResponse, headersToObj, getClientIP } from '../utils/headers';

export function handleHeaders(request: CFRequest): Response {
  return jsonResponse({ headers: headersToObj(request.headers) }, request);
}

export function handleIP(request: CFRequest): Response {
  const origin = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';

  let proxy = 'unknown';
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 1) {
      proxy = ips[ips.length - 1]!;
    }
  }

  const info: IPInfo = {
    origin,
    proxy,
    forwarded_for: forwardedFor || null,
  };

  return jsonResponse(info, request);
}

export function handleUserAgent(request: CFRequest): Response {
  return jsonResponse({ 'user-agent': request.headers.get('user-agent') ?? '' }, request);
}

export function handleCf(request: CFRequest): Response {
  const cfVisitor = request.headers.get('cf-visitor');
  let scheme: string | null = null;
  if (cfVisitor) {
    try {
      scheme = JSON.parse(cfVisitor).scheme;
    } catch {
      // ignore parse errors
    }
  }

  // Access the request.cf object which contains Cloudflare-specific metadata
  const cf = request.cf;

  const metadata: CFMetadata = {
    ray: request.headers.get('cf-ray') ?? null,
    ip: getClientIP(request),
    scheme: scheme ?? request.headers.get('x-forwarded-proto') ?? 'https',
    colo: (cf?.colo as string | undefined) ?? null,
    country: (cf?.country as string | undefined) ?? null,
    region: (cf?.region as string | undefined) ?? null,
    regionCode: (cf?.regionCode as string | undefined) ?? null,
    city: (cf?.city as string | undefined) ?? null,
    postalCode: (cf?.postalCode as string | undefined) ?? null,
    metroCode: (cf?.metroCode as string | undefined) ?? null,
    timezone: (cf?.timezone as string | undefined) ?? null,
    latitude: (cf?.latitude as string | undefined) ?? null,
    longitude: (cf?.longitude as string | undefined) ?? null,
    asn: (cf?.asn as number | undefined) ?? null,
    asOrganization: (cf?.asOrganization as string | undefined) ?? null,
    clientTcpRtt: (cf?.clientTcpRtt as number | undefined) ?? null,
    clientQuicRtt: (cf?.clientQuicRtt as number | undefined) ?? null,
    device: request.headers.get('cf-device-type') ?? null,
    clientAcceptEncoding: (cf?.clientAcceptEncoding as string | undefined) ?? null,
    isWorkerSubrequest: request.headers.get('cf-worker') !== null,
  };

  return jsonResponse(metadata, request);
}
