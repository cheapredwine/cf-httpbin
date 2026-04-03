/**
 * Core type definitions for flarebin
 *
 * TypeScript Glossary for this codebase:
 *
 * interface - Defines the shape of an object (like a schema or template)
 * type - Creates a type alias (shorthand/nickname for a complex type)
 * Record<K, V> - Object with keys of type K, values of type V
 *                 Example: Record<string, string> means { "key": "value", ... }
 * Promise<T> - A value that will be available in the future (after async operation)
 * <T> - Generic: a placeholder type that gets specified when used
 * ?: - Optional: this property might not exist (can be undefined)
 * !: - Non-null assertion: we promise this won't be null (use carefully)
 * | - Union: "either this type OR that type" (like a multiple choice)
 * & - Intersection: "this type AND that type combined"
 * as - Type assertion: "trust me, treat this as X type"
 * export - Makes this type available for import in other files
 */

import type { CfProperties } from '@cloudflare/workers-types';

/**
 * Extended Request type with Cloudflare properties
 *
 * The `extends` keyword means: "Start with Request, then add our custom stuff"
 * The `?` after `cf` means this property is optional (might not exist)
 */
export interface CFRequest extends Request {
  /** Cloudflare-specific properties (colo, country, ASN, etc.) */
  cf?: CfProperties;
}

/**
 * IP address information from various sources
 *
 * This helps clients understand how their request appears to the server,
 * especially when going through proxies/CDNs.
 */
export interface IPInfo {
  /** Client's original IP address (from CF-Connecting-IP header) */
  origin: string;
  /** Last proxy in the chain (from X-Forwarded-For) */
  proxy: string;
  /** Full X-Forwarded-For chain, or null if not present */
  forwarded_for: string | null;
}

/**
 * Cloudflare metadata about the request
 *
 * Cloudflare adds these properties to every request based on:
 * - Geographic location (derived from IP)
 * - Network information (ASN lookup)
 * - Connection details (TCP/QUIC RTT)
 * - Device detection
 *
 * The `| null` pattern means: "this is a string, OR it might not exist"
 */
export interface CFMetadata {
  // Basic request info
  /** Cloudflare Ray ID (unique request identifier) */
  ray: string | null;
  /** Client IP address */
  ip: string;
  /** HTTP or HTTPS */
  scheme: string;

  // Geographic info
  /** Cloudflare datacenter code (e.g., "SJC" for San Jose) */
  colo: string | null;
  /** Country code (ISO 3166-1 alpha-2, e.g., "US") */
  country: string | null;
  /** Region/state name */
  region: string | null;
  /** Region code */
  regionCode: string | null;
  /** City name */
  city: string | null;
  /** Postal/ZIP code */
  postalCode: string | null;
  /** Metro code (DMA for US) */
  metroCode: string | null;
  /** Timezone (e.g., "America/Los_Angeles") */
  timezone: string | null;
  /** Latitude as string */
  latitude: string | null;
  /** Longitude as string */
  longitude: string | null;

  // Network info
  /** Autonomous System Number (identifies the network operator) */
  asn: number | null;
  /** Organization name (e.g., "Cloudflare, Inc.") */
  asOrganization: string | null;

  // Performance metrics
  /** TCP round-trip time in milliseconds */
  clientTcpRtt: number | null;
  /** QUIC round-trip time in milliseconds */
  clientQuicRtt: number | null;

  // Device/client info
  /** Device type (desktop, mobile, tablet) */
  device: string | null;
  /** Accept-Encoding header from client */
  clientAcceptEncoding: string | null;

  // Worker context
  /** True if this request came from another Worker */
  isWorkerSubrequest: boolean;
}

/**
 * Information about an uploaded file
 *
 * Used when handling multipart/form-data uploads (file uploads)
 */
export interface FileInfo {
  /** Original filename */
  filename: string;
  /** Size in bytes */
  size: number;
  /** MIME type (e.g., "image/png", "application/pdf") */
  type: string;
}

/**
 * Data returned by "reflect" endpoints (/get, /post, etc.)
 *
 * These endpoints echo back information about the request,
 * useful for debugging HTTP clients.
 *
 * Record<string, string> means an object where:
 * - All keys are strings
 * - All values are strings
 */
export interface ReflectData {
  /** URL query parameters (e.g., ?foo=bar becomes { foo: "bar" }) */
  args: Record<string, string>;
  /** Raw request body as text */
  data: string;
  /** Uploaded files information */
  files: Record<string, FileInfo>;
  /** Form data fields (for application/x-www-form-urlencoded) */
  form: Record<string, string>;
  /** Request headers as a plain object */
  headers: Record<string, string>;
  /** Parsed JSON body (null if not JSON) */
  json: unknown;
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** Client IP address */
  origin: string;
  /** Full request URL */
  url: string;
}

/** Response from /uuid endpoint */
export interface UUIDResponse {
  uuid: string;
}

/** Response from /base64 endpoint */
export interface Base64Response {
  /** The original base64-encoded string */
  encoded: string;
  /** The decoded value */
  decoded: string;
}

/**
 * Cookie key-value pairs
 *
 * The [key: string] syntax means: "any string key is allowed"
 * This is an index signature - it doesn't limit which keys exist
 */
export interface CookieMap {
  [key: string]: string;
}

/**
 * A function that handles an HTTP route
 *
 * TypeScript syntax breakdown:
 * - export: Can be imported by other files
 * - type: We're defining a type alias (like a nickname)
 * - RouteHandler: The name we're giving this type
 * - (request, url, match) => ... : Function signature (parameters and return type)
 * - match?: Optional parameter (might not be provided)
 * - RegExpMatchArray: Result from matching a regex pattern
 * - Response | Promise<Response>: Returns either a Response immediately,
 *   OR a Promise that will resolve to a Response (for async functions)
 *
 * @param request - The incoming request with Cloudflare properties
 * @param url - Parsed URL object with pathname, searchParams, etc.
 * @param match - Regex match result with captured groups (optional)
 * @returns A Response, or a Promise that resolves to a Response
 */
export type RouteHandler = (
  request: CFRequest,
  url: URL,
  match?: RegExpMatchArray
) => Response | Promise<Response>;

/**
 * A single route definition
 *
 * Routes connect URL patterns to handler functions.
 * The router stores an array of these and finds matches for each request.
 */
export interface Route {
  /** Regex pattern to match against the URL pathname */
  pattern: RegExp;
  /** HTTP methods this route accepts (e.g., ["GET", "POST"]) */
  methods: string[];
  /** Function to call when this route matches */
  handler: RouteHandler;
}

/**
 * A middleware function
 *
 * Middleware runs before route handlers and can:
 * - Return a Response to short-circuit (e.g., CORS preflight)
 * - Return null to continue to the next middleware/route
 *
 * The `| null` means it might return null
 * The outer `| Promise<...>` means it might be async
 */
export type Middleware = (
  request: CFRequest,
  url: URL
) => Response | null | Promise<Response | null>;

/** Log entry for request logging */
export interface RequestLog {
  method: string;
  path: string;
  ip: string;
  userAgent: string | null;
  timestamp: string;
  ray: string | null;
}

/**
 * Environment bindings (empty for now, extend as needed)
 *
 * In Cloudflare Workers, you can bind:
 * - KV namespaces (key-value storage)
 * - Durable Objects
 * - Secrets
 * - R2 buckets
 *
 * Example with KV:
 *   export interface Env {
 *     MY_KV: KVNamespace;
 *     API_SECRET: string;
 *   }
 */
export interface Env {
  // Add KV bindings, secrets, etc. here
}

/**
 * Valid HTTP status codes we support
 *
 * This is a union type listing specific allowed numbers.
 * It ensures we don't accidentally use an invalid status code.
 *
 * The | operator chains multiple possible values.
 */
export type StatusCode =
  | 100 | 101 | 200 | 201 | 202 | 204 | 206
  | 301 | 302 | 304
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 408 | 409 | 410 | 418 | 429
  | 500 | 501 | 502 | 503 | 504;

/**
 * Human-readable text for each HTTP status code
 *
 * Record<number, string> means:
 * - Keys are numbers (the status codes)
 * - Values are strings (the descriptions)
 */
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
