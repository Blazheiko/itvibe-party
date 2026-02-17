import logger from '#vendor/utils/logger.js';
import type { HttpRequest, HttpResponse } from '#vendor/start/server.js';
import { validateHeader } from '#app/validate/checkers/header-checker.js';
import { validateParameter } from '#app/validate/checkers/parameter-checker.js';
import type { Payload, UploadedFile } from '#vendor/types/types.js';
import { validateCookie } from '#app/validate/checkers/cookie-checker.js';
import config from '#config/app.js';
import { getParts } from 'uWebSockets.js';

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

const readData = (res: HttpResponse): Promise<Buffer | null> => {
    logger.info('readData');
    return new Promise((resolve: (value: Buffer | null) => void, reject: (reason?: unknown) => void) => {
        const chunks: Buffer[] = [];
        let totalSize = 0;
        res.onData((ab, isLast) => {
            try {
                const chunk = Buffer.from(new Uint8Array(ab));
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
interface FormDataResult {
    payload: Record<string, string>;
    files: Map<string, UploadedFile>;
}

const parseMultipart = (buffer: Buffer, contentType: string): FormDataResult => {
    const payload = Object.create(null) as Record<string, string>;
    const files = new Map<string, UploadedFile>();

    const parts = getParts(buffer, contentType);
    if (parts === undefined) return { payload, files };

    for (const part of parts) {
        if (part.filename !== undefined && part.filename !== '') {
            files.set(part.name, {
                name: part.name,
                filename: part.filename,
                type: part.type ?? 'application/octet-stream',
                data: part.data,
            });
        } else {
            const decoder = new TextDecoder();
            payload[part.name] = decoder.decode(part.data);
        }
    }

    return { payload, files };
};

const getData = async (res: HttpResponse, contentType: string): Promise<{ payload: Payload | null; files: Map<string, UploadedFile> | null }> => {
    let payload: Payload | null = null;
    let files: Map<string, UploadedFile> | null = null;
    const buffer = await readData(res);

    if (buffer !== null) {
        if (contentType === 'application/json') {
            payload = readJson(buffer.toString());
        } else if (contentType.startsWith('multipart/form-data')) {
            const result = parseMultipart(buffer, contentType);
            payload = result.payload;
            files = result.files.size > 0 ? result.files : null;
        }
    }

    return { payload, files };
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
