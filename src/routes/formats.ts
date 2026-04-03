/**
 * Response format route handlers
 */

import type { CFRequest } from '../types';
import { jsonResponse, textResponse } from '../utils/headers';
import { SAMPLE_JSON, SAMPLE_HTML, SAMPLE_XML, SAMPLE_UTF8 } from '../static/content';

export function handleJSON(request: CFRequest): Response {
  return jsonResponse(SAMPLE_JSON, request);
}

export function handleHTML(): Response {
  return textResponse(SAMPLE_HTML, 200, 'text/html; charset=utf-8');
}

export function handleXML(): Response {
  return textResponse(SAMPLE_XML, 200, 'application/xml');
}

export function handleRobots(): Response {
  return textResponse('User-agent: *\nDisallow: /deny\n', 200);
}

export function handleDeny(): Response {
  return textResponse(
    '          .-\'\'\'-.     ,.--\'\'\'--.,\n' +
    '        /        \\  /            \\ \n' +
    '       |  0   0   ||  NOT FOR YOU |\n' +
    '       |    __    ||              |\n' +
    '        \\  \'--\'  /  \\            /\n' +
    '         \'-....-\'    \'--......--\'\n',
    200
  );
}

export function handleUTF8(): Response {
  return textResponse(SAMPLE_UTF8, 200, 'text/html; charset=utf-8');
}
