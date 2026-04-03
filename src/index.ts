// cf-httpbin — httpbin.org-compatible Cloudflare Worker

import type { CFRequest } from './types';
import { Router } from './utils/router';
import { withMiddleware } from './utils/middleware';
import { textResponse } from './utils/headers';

// Route handlers
import { handleGet, handlePost, handlePut, handleDelete, handlePatch, handleAnything } from './routes/methods';
import { handleHeaders, handleIP, handleUserAgent, handleCf } from './routes/inspection';
import { handleJSON, handleHTML, handleXML, handleRobots, handleDeny, handleUTF8 } from './routes/formats';
import { handleStatus } from './routes/status';
import { handleRedirect, handleAbsoluteRedirect, handleRelativeRedirect, handleRedirectTo } from './routes/redirects';
import { handleBasicAuth, handleBearer } from './routes/auth';
import { handleCookies, handleSetCookies, handleDeleteCookies } from './routes/cookies';
import { handleStream, handleStreamBytes } from './routes/streaming';
import { handleUUID, handleBase64, handleBytes } from './routes/utilities';
import { handleGzip, handleDeflate } from './routes/compression';
import { handleIndex, handleDocs, handleFaviconIco, handleFaviconSvg } from './routes/static';
import { handleDelay } from './routes/delays';

// Create router and register routes
function createRouter(): Router {
  const router = new Router();

  // ── HTTP Methods ──────────────────────────────────────────────────────
  router.get(/^\/get$/, handleGet);
  router.post(/^\/post$/, handlePost);
  router.put(/^\/put$/, handlePut);
  router.delete(/^\/delete$/, handleDelete);
  router.patch(/^\/patch$/, handlePatch);
  router.add(/^\/anything\/?.*$/, ['ANY'], handleAnything);

  // ── Request Inspection ────────────────────────────────────────────────
  router.get(/^\/headers$/, handleHeaders);
  router.get(/^\/ip$/, handleIP);
  router.get(/^\/user-agent$/, handleUserAgent);
  router.get(/^\/cf$/, handleCf);

  // ── Response Formats ──────────────────────────────────────────────────
  router.get(/^\/json$/, handleJSON);
  router.get(/^\/html$/, handleHTML);
  router.get(/^\/xml$/, handleXML);
  router.get(/^\/robots\.txt$/, handleRobots);
  router.get(/^\/deny$/, handleDeny);
  router.get(/^\/encoding\/utf8$/, handleUTF8);

  // ── Static Assets ─────────────────────────────────────────────────────
  router.get(/^\/favicon\.ico$/, handleFaviconIco);
  router.get(/^\/favicon\.svg$/, handleFaviconSvg);

  // ── Utilities ─────────────────────────────────────────────────────────
  router.get(/^\/uuid$/, handleUUID);
  router.get(/^\/base64\/(.+)$/, (req, _url, match) => handleBase64(match!, req));
  router.get(/^\/bytes\/(.+)$/, (req, _url, match) => handleBytes(match!, req));

  // ── Compression ───────────────────────────────────────────────────────
  router.get(/^\/gzip$/, handleGzip);
  router.get(/^\/deflate$/, handleDeflate);

  // ── Status Codes ──────────────────────────────────────────────────────
  router.get(/^\/status\/(.+)$/, (req, _url, match) => handleStatus(match!, req));

  // ── Redirects ─────────────────────────────────────────────────────────
  router.get(/^\/redirect\/(.+)$/, (req, url, match) => handleRedirect(match!, url, req));
  router.get(/^\/absolute-redirect\/(.+)$/, (req, url, match) => handleAbsoluteRedirect(match!, url, req));
  router.get(/^\/relative-redirect\/(.+)$/, (req, _url, match) => handleRelativeRedirect(match!, req));
  router.get(/^\/redirect-to$/, (req, url) => handleRedirectTo(url, req));

  // ── Delays ────────────────────────────────────────────────────────────
  router.get(/^\/delay\/(.+)$/, (req, url, match) => handleDelay(match!, req, url));

  // ── Auth ──────────────────────────────────────────────────────────────
  router.get(/^\/basic-auth\/(.+)$/, (req, _url, match) => handleBasicAuth(match!, req));
  router.get(/^\/bearer$/, handleBearer);

  // ── Cookies ───────────────────────────────────────────────────────────
  router.get(/^\/cookies$/, handleCookies);
  router.get(/^\/cookies\/set$/, (_req, url) => handleSetCookies(url));
  router.get(/^\/cookies\/delete$/, (_req, url) => handleDeleteCookies(url));

  // ── Streaming ─────────────────────────────────────────────────────────
  router.get(/^\/stream\/(.+)$/, (req, url, match) => handleStream(match!, req, url));
  router.get(/^\/stream-bytes\/(.+)$/, (req, url, match) => handleStreamBytes(match!, url, req));

  // ── Index & Documentation ─────────────────────────────────────────────
  router.get(/^\/?$/, handleIndex);
  router.get(/^\/docs$/, handleDocs);

  return router;
}

const router = createRouter();

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Cast request to CFRequest for Cloudflare-specific properties
    const cfRequest = request as CFRequest;

    // Apply middleware and handle request
    const handler = withMiddleware(async (req: CFRequest, requestUrl: URL) => {
      const response = await router.handle(req, requestUrl);
      return response ?? textResponse('Not Found', 404);
    });

    return await handler(cfRequest, url);
  },
};
