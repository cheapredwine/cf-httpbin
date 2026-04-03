/**
 * @fileoverview HTTP method route handlers
 *
 * These endpoints echo back information about the request.
 * They support GET, POST, PUT, DELETE, PATCH, and ANY methods,
 * and handle various content types (JSON, form data, multipart, etc.)
 *
 * Useful for testing HTTP clients and debugging request formatting.
 *
 * Endpoints:
 * - /get - Returns GET request data
 * - /post - Returns POST request data
 * - /put - Returns PUT request data
 * - /delete - Returns DELETE request data
 * - /patch - Returns PATCH request data
 * - /anything - Accepts any HTTP method
 */

import type { CFRequest, ReflectData, FileInfo } from '../types';
import { jsonResponse, headersToObj, getClientIP } from '../utils/headers';

/**
 * Result of parsing a request body
 *
 * This interface groups together all the data we might extract
 * from a request body, regardless of content type.
 */
interface ParsedBody {
  /** Raw body text */
  data: string;
  /** Parsed JSON (if content-type was application/json) */
  json: unknown;
  /** Form fields (if content-type was form data) */
  form: Record<string, string> | null;
  /** Uploaded files (if content-type was multipart/form-data) */
  files: Record<string, FileInfo> | null;
}

/**
 * Parse a JSON request body
 *
 * @param request - The incoming request
 * @returns Object with raw text and parsed JSON
 */
async function parseJsonBody(request: CFRequest): Promise<ParsedBody> {
  const text = await request.text();

  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // If JSON parsing fails, leave json as null
    // This handles malformed JSON gracefully
  }

  return {
    data: text,
    json,
    form: null,
    files: null,
  };
}

/**
 * Parse URL-encoded form data
 *
 * Example input: "name=John&age=30"
 * Example output form: { name: "John", age: "30" }
 *
 * @param request - The incoming request
 * @returns Object with raw text and parsed form fields
 */
async function parseFormBody(request: CFRequest): Promise<ParsedBody> {
  const text = await request.text();

  // URLSearchParams parses query string format
  // Object.fromEntries converts it to a plain object
  const form = Object.fromEntries(new URLSearchParams(text));

  return {
    data: text,
    json: null,
    form,
    files: null,
  };
}

/**
 * Parse multipart form data (file uploads)
 *
 * Multipart forms can contain:
 * - Text fields (regular form data)
 * - File uploads (binary data with metadata)
 *
 * @param request - The incoming request
 * @returns Object with form fields and uploaded files
 */
async function parseMultipartBody(request: CFRequest): Promise<ParsedBody> {
  try {
    // formData() is a built-in Request method for parsing multipart
    const formData = await request.formData();

    const form: Record<string, string> = {};
    const files: Record<string, FileInfo> = {};

    // Iterate through all fields in the form
    for (const [key, value] of formData) {
      if (typeof value === 'string') {
        // Regular text field
        form[key] = value;
      } else {
        // File upload - value is a File object
        const file = value as File;
        files[key] = {
          filename: file.name,
          size: file.size,
          type: file.type,
        };
      }
    }

    return {
      data: '', // Multipart data is too complex to show as raw text
      json: null,
      form,
      files,
    };
  } catch {
    // If parsing fails, return empty data
    return {
      data: '',
      json: null,
      form: {},
      files: {},
    };
  }
}

/**
 * Parse the request body based on content type
 *
 * This function acts as a dispatcher - it looks at the Content-Type header
 * and calls the appropriate parser for that format.
 *
 * @param request - The incoming request
 * @returns Parsed body data in a standard format
 */
async function parseRequestBody(request: CFRequest): Promise<ParsedBody> {
  // Get content-type header, default to empty string if not present
  // The ?? operator means "use this value if the left side is null/undefined"
  const contentType = request.headers.get('content-type') ?? '';

  // No body to parse
  if (!request.body) {
    return {
      data: '',
      json: null,
      form: null,
      files: null,
    };
  }

  // Choose parser based on content type
  // includes() checks if the string contains this substring
  if (contentType.includes('application/json')) {
    return parseJsonBody(request);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return parseFormBody(request);
  }

  if (contentType.includes('multipart/form-data')) {
    return parseMultipartBody(request);
  }

  // Unknown content type - just read as text
  const text = await request.text().catch(() => '');
  return {
    data: text,
    json: null,
    form: null,
    files: null,
  };
}

/**
 * Build a reflection of the request data
 *
 * This is the core function that gathers all information about a request:
 * - URL query parameters
 * - Request headers
 * - Body content (parsed according to content-type)
 * - Client information
 *
 * "Reflect" means to echo back - the client sees exactly what the server received.
 *
 * @param request - The incoming request
 * @param url - Parsed URL object
 * @returns Complete reflection data
 */
export async function buildReflect(
  request: CFRequest,
  url: URL
): Promise<ReflectData> {
  // Parse the body using the appropriate parser
  const bodyData = await parseRequestBody(request);

  // Build the reflection object
  return {
    // URL query parameters (?foo=bar&baz=qux)
    args: Object.fromEntries(url.searchParams),

    // Body data (varies by content type)
    data: bodyData.data,
    json: bodyData.json,
    form: bodyData.form ?? {},
    files: bodyData.files ?? {},

    // Request metadata
    headers: headersToObj(request.headers),
    method: request.method,
    origin: getClientIP(request),
    url: request.url,
  };
}

/**
 * Handle GET /get
 *
 * Returns information about the GET request.
 */
export async function handleGet(
  request: CFRequest,
  url: URL
): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

/**
 * Handle POST /post
 *
 * Returns information about the POST request, including parsed body.
 */
export async function handlePost(
  request: CFRequest,
  url: URL
): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

/**
 * Handle PUT /put
 *
 * Returns information about the PUT request.
 */
export async function handlePut(
  request: CFRequest,
  url: URL
): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

/**
 * Handle DELETE /delete
 *
 * Returns information about the DELETE request.
 */
export async function handleDelete(
  request: CFRequest,
  url: URL
): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

/**
 * Handle PATCH /patch
 *
 * Returns information about the PATCH request.
 */
export async function handlePatch(
  request: CFRequest,
  url: URL
): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}

/**
 * Handle /anything (accepts any HTTP method)
 *
 * This is a catch-all endpoint that accepts GET, POST, PUT, DELETE, PATCH, etc.
 * Useful when you need to test a specific method but don't want method-specific behavior.
 */
export async function handleAnything(
  request: CFRequest,
  url: URL
): Promise<Response> {
  return jsonResponse(await buildReflect(request, url), request);
}
