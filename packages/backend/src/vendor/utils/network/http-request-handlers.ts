import logger from '#vendor/utils/logger.js';
import type { HttpRequest, HttpResponse } from '#vendor/start/server.js';
import { validateHeader } from '#app/validate/checkers/header-checker.js';
import { validateParameter } from '#app/validate/checkers/parameter-checker.js';
import type { Payload } from '#vendor/types/types.js';
import { validateCookie } from '#app/validate/checkers/cookie-checker.js';
import config from '#config/app.js';

const getHeaders = (req: HttpRequest): Map<string, string> => {
    const headers: Map<string, string> = new Map<string, string>();
    req.forEach((key, value) => {
        if (validateHeader(key, value)) {
            headers.set(key, value.trim());
        } else {
            logger.warn(`Invalid header detected and skipped: ${key}`);
        }
    });

    return headers;
};

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const parseFormDataStream = (body: string, boundary: string): Record<string, string> => {
    const result = Object.create(null) as Record<string, string>;
    let start = 0;
    let fieldCount = 0;

    while ((start = body.indexOf(boundary, start)) !== -1) {
        const nameStart = body.indexOf('name="', start);
        if (nameStart === -1) break;

        const nameEnd = body.indexOf('"', nameStart + 6);
        if (nameEnd === -1) break;

        const fieldName = body.slice(nameStart + 6, nameEnd);

        const headerEnd = body.indexOf('\r\n\r\n', nameEnd);
        if (headerEnd === -1) break;

        const valueStart = headerEnd + 4;
        const valueEnd = body.indexOf('\r\n--', valueStart);
        if (valueEnd === -1) break;

        if (FORBIDDEN_KEYS.has(fieldName)) {
            logger.warn(`Blocked dangerous form field name: ${fieldName}`);
            start = valueEnd;
            continue;
        }

        fieldCount++;
        if (fieldCount > config.maxFormFields) {
            logger.warn(`Form data exceeded max field count (${String(config.maxFormFields)})`);
            break;
        }

        const rawValue = body.slice(valueStart, valueEnd);
        if (rawValue.length > config.maxFieldValueLength) {
            logger.warn(`Form field "${fieldName}" value exceeds max length, skipped`);
            start = valueEnd;
            continue;
        }

        result[fieldName] = rawValue.trim();
        start = valueEnd;
    }

    return result;
};

const readData = (res: HttpResponse): Promise<Buffer | null> => {
    logger.info('readData');
    return new Promise((resolve: (value: Buffer | null) => void, reject: (reason?: unknown) => void) => {
        const chunks: Buffer[] = [];
        let totalSize = 0;
        res.onData((ab, isLast) => {
            try {
                const chunk = Buffer.from(ab);
                totalSize += chunk.length;

                if (totalSize > config.maxBodySize) {
                    reject(new Error(`Request body exceeds max size (${String(config.maxBodySize)} bytes)`));
                    return;
                }

                chunks.push(chunk);

                if (isLast) {
                    resolve(chunks.length === 1 ? chunks[0] ?? null : Buffer.concat(chunks));
                }
            } catch (e) {
                logger.error(e, 'error read data');
                reject(new Error('error read data'));
            }
        });
    });
};

const readJson = (body: string): Record<string, unknown> => {
    logger.info('readJson');
    if (body === '') return {};
    try {
        const result = JSON.parse(body) as Record<string, unknown>;
        if (typeof result === 'object') return result;
        throw new Error('error parse json');
    } catch (e) {
        console.error(e);
        throw new Error(`error parse json: ${String(e)}`);
    }
};
const parseContentType = (contentType: string): string => {
    const boundaryIndex = contentType.indexOf('boundary=');
    if (boundaryIndex === -1)
        throw new Error('Boundary not found in Content-Type');

    let boundary = contentType.slice(boundaryIndex + 9).trim();

    const semicolonIndex = boundary.indexOf(';');
    if (semicolonIndex !== -1) boundary = boundary.slice(0, semicolonIndex).trim();

    if (boundary.startsWith('"') && boundary.endsWith('"')) {
        boundary = boundary.slice(1, -1);
    }

    if (boundary === '') throw new Error('Empty boundary in Content-Type');

    return `--${boundary}`;
};

const getData = async (res: HttpResponse, contentType: string): Promise<Payload | null> => {
    let data: Payload | null = null;
    const buffer = await readData(res);
    if (buffer !== null) {
        const body = buffer.toString();
        if (contentType === 'application/json') data = readJson(body);
        else if (contentType.startsWith('multipart/form-data'))
            data = parseFormDataStream(body, parseContentType(contentType));
    }

    return data;
};

const normalizePath = (path: string): string => {
    if (path === '') return '';
    let normalizedPath = path;
    if (normalizedPath.endsWith('/'))
        normalizedPath = normalizedPath.slice(0, -1);
    if (normalizedPath.startsWith('/'))
        normalizedPath = normalizedPath.slice(1);
    return normalizedPath;
};

const isValidUrl = (url: string): boolean => {
    // Check for multiple consecutive slashes (e.g., //, ///)
    return !/\/\/+/.test(url);
};

const extractParameters = (paramNames: string[], req: HttpRequest): Record<string, string> => {
    const params: Record<string, string> = {};
    for (let i = 0; i < paramNames.length; i++) {
        const paramName = paramNames[i];
        const paramValue = req.getParameter(i) ?? '';
        validateParameter(paramValue, paramName);
        params[paramName ?? 'unknown'] = paramValue;
    }
    return params;
};

const parseCookies = (cookieHeader: string): Map<string, string> => {
    const list = new Map<string, string>();
    if (cookieHeader !== "") {
      const handler = (cookie: string): void => {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex === -1) return;
        try {
          const key = cookie.slice(0, separatorIndex).trim();
          const value = cookie.slice(separatorIndex + 1).trim();
          if (validateCookie(key, value)) {
            list.set(key, decodeURIComponent(value));
          }
        } catch (error) {
          console.error(`Error decoding cookie value ${cookieHeader}":`, error);
        }
      };
  
      let start = 0;
  
      for (let i = 0; i <= cookieHeader.length; i++) {
        if (i === cookieHeader.length || cookieHeader[i] === ";") {
          handler(cookieHeader.slice(start, i).trim());
          start = i + 1;
        }
      }
    }
  
    return list;
  };

export { getHeaders, getData, extractParameters, normalizePath, isValidUrl, parseCookies };
