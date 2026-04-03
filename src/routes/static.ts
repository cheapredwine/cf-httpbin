/**
 * Static asset route handlers
 */

import { textResponse } from '../utils/headers';
import { INDEX_HTML } from '../static/content';
import { DOCS_HTML } from '../static/docs';
import { FAVICON_SVG, FAVICON_ICO_SVG } from '../static/favicon';

export function handleIndex(): Response {
  return textResponse(INDEX_HTML, 200, 'text/html; charset=utf-8');
}

export function handleDocs(): Response {
  return textResponse(DOCS_HTML, 200, 'text/html; charset=utf-8');
}

export function handleFaviconIco(): Response {
  return new Response(FAVICON_ICO_SVG, {
    headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
  });
}

export function handleFaviconSvg(): Response {
  return new Response(FAVICON_SVG, {
    headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
  });
}
