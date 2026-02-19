import type { HttpData, ResponseData, SessionInfo } from '#vendor/types/types.js';
import { userRepository } from '#app/repositories/index.js';
import { userTransformer } from '#app/transformers/index.js';
import { generateWsToken } from '#app/services/generate-ws-token-service.js';
import { getWsUrl } from '#app/services/get-ws-url-service.js';
import { success } from '#app/services/shared/service-result.js';
import diskConfig from '#config/disk.js';
import type { SaveUserInput } from 'shared/schemas';

export const mainService = {
    ping() {
        return success({ status: 'ok' });
    },

    testRoute() {
        return success({ status: 'ok' });
    },

    testHeaders(httpData: HttpData) {
        const headers: Array<{ key: string; value: string }> = [];
        const params: unknown[] = Object.entries(httpData.params);

        httpData.headers.forEach((value, key) => {
            headers.push({ key, value });
        });

        return success({ status: 'ok', headers, params });
    },

    getSetCookies(httpData: HttpData) {
        const cookies: Array<{ key: string; value: string }> = [];
        httpData.cookies.forEach((value, key) => {
            cookies.push({ key, value });
        });
        return success({ status: 'ok', cookies });
    },

    testSession(httpData: HttpData, sessionInfo: SessionInfo | null) {
        const cookies: Array<{ key: string; value: string }> = [];
        httpData.cookies.forEach((value, key) => {
            cookies.push({ key, value });
        });
        return success({ status: 'ok', cookies, sessionInfo });
    },

    testApiSession(httpData: HttpData, sessionInfo: SessionInfo | null) {
        const headers: Array<{ key: string; value: string }> = [];
        httpData.headers.forEach((value, key) => {
            headers.push({ key, value });
        });

        return success({ status: 'ok', headers, sessionInfo });
    },

    index(httpData: HttpData, responseData: ResponseData) {
        return success({ payload: httpData, responseData });
    },

    testParams(httpData: HttpData) {
        return success({
            params: httpData.params,
            query: httpData.query.getAll('test'),
            status: 'ok',
        });
    },

    async updateWsToken(sessionInfo: SessionInfo | null) {
        if (sessionInfo === null) {
            return success({
                status: 'unauthorized',
                message: 'Session not found',
                wsUrl: '',
            });
        }

        const userId = sessionInfo.data?.['userId'];
        if (!userId) {
            return success({ status: 'unauthorized', message: 'Session expired', wsUrl: '' });
        }

        const wsToken = await generateWsToken(sessionInfo, Number(userId));
        return success({ status: 'ok', wsUrl: wsToken ? getWsUrl(wsToken) : '' });
    },

    async init(sessionInfo: SessionInfo | null) {
        if (sessionInfo === null) {
            return success({ status: 'error', message: 'Session not found' });
        }

        const userId = sessionInfo.data?.['userId'];
        if (!userId) {
            return success({ status: 'unauthorized', message: 'Session expired' });
        }

        const user = await userRepository.findById(BigInt(userId));
        if (user === undefined) {
            return success({ status: 'unauthorized', message: 'Session expired' });
        }

        const wsToken = await generateWsToken(sessionInfo, Number(user.id));
        return success({
            status: 'ok',
            user: userTransformer.serialize(user),
            wsUrl: wsToken ? getWsUrl(wsToken) : '',
            storage: {
                s3Endpoint: diskConfig.s3Endpoint ?? '',
                s3Bucket: diskConfig.s3Bucket ?? '',
                s3Prefix: diskConfig.s3Prefix ?? '',
                s3StaticDataPrefix: diskConfig.s3StaticDataPrefix ?? '',
                s3DynamicDataPrefix: diskConfig.s3DynamicDataPrefix ?? '',
            },
        });
    },

    setHeaderAndCookie(responseData: ResponseData) {
        responseData.headers.push({ name: 'test-header', value: 'test' });
        responseData.setCookie({
            name: 'cookieTest1',
            value: 'test',
            path: '/',
            httpOnly: true,
            secure: false,
            maxAge: 3600,
            expires: undefined,
            sameSite: undefined,
        });
        responseData.setCookie('cookieTest2', 'test');
        return success({ status: 'ok' });
    },

    testMiddleware(responseData: ResponseData) {
        return success({
            middlewares: responseData.middlewareData as unknown as string[],
            status: 'ok',
        });
    },

    async saveUser(payload: SaveUserInput) {
        const user = await userRepository.create({
            name: payload.name,
            email: payload.email,
            password: payload.password,
        });

        return success({ status: 'ok', user: userTransformer.serialize(user) });
    },
};
