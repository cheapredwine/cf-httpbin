/**
 * Core type definitions for cf-httpbin
 */

import type { CfProperties } from '@cloudflare/workers-types';

/** Extended Request type with Cloudflare properties */
export interface CFRequest extends Request {
  cf?: CfProperties;
}

export interface IPInfo {
  origin: string;
  proxy: string;
  forwarded_for: string | null;
}

export interface CFMetadata {
  // Basic request info
  ray: string | null;
  ip: string;
  scheme: string;
  
  // Geographic info
  colo: string | null;
  country: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  postalCode: string | null;
  metroCode: string | null;
  timezone: string | null;
  latitude: string | null;
  longitude: string | null;
  
  // Network info
  asn: number | null;
  asOrganization: string | null;
  
  // Performance metrics
  clientTcpRtt: number | null;
  clientQuicRtt: number | null;
  
  // Device/client info
  device: string | null;
  clientAcceptEncoding: string | null;
  
  // Worker context
  isWorkerSubrequest: boolean;
}

export interface FileInfo {
  filename: string;
  size: number;
  type: string;
}

export interface ReflectData {
  args: Record<string, string>;
  data: string;
  files: Record<string, FileInfo>;
  form: Record<string, string>;
  headers: Record<string, string>;
  json: unknown;
  method: string;
  origin: string;
  url: string;
}

export interface UUIDResponse {
  uuid: string;
}

export interface Base64Response {
  encoded: string;
  decoded: string;
}

export interface CookieMap {
  [key: string]: string;
}

/** Route handler function type */
export type RouteHandler = (
  request: CFRequest,
  url: URL,
  match?: RegExpMatchArray
) => Response | Promise<Response>;

/** Route definition */
export interface Route {
  pattern: RegExp;
  methods: string[];
  handler: RouteHandler;
}

/** Middleware function type */
export type Middleware = (
  request: CFRequest,
  url: URL
) => Response | null | Promise<Response | null>;

/** Request log entry */
export interface RequestLog {
  method: string;
  path: string;
  ip: string;
  userAgent: string | null;
  timestamp: string;
  ray: string | null;
}

/** Environment bindings (empty for now, extend as needed) */
export interface Env {
  // Add KV bindings, secrets, etc. here
}

/** HTTP status code mapping */
export type StatusCode =
  | 100 | 101 | 200 | 201 | 202 | 204 | 206
  | 301 | 302 | 304
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 408 | 409 | 410 | 418 | 429
  | 500 | 501 | 502 | 503 | 504;

/** Status text mapping */
export const STATUS_TEXTS: Record<number, string> = {
  100: 'Continue',
  101: 'Switching Protocols',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  206: 'Partial Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  418: "I'm a Teapot",
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};
