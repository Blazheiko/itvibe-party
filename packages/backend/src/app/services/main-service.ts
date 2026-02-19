import type { HttpData, ResponseData, SessionInfo } from '#vendor/types/types.js';
import { userRepository } from '#app/repositories/index.js';
import { userTransformer } from '#app/transformers/index.js';
import { generateWsToken } from '#app/services/generate-ws-token-service.js';
import { getWsUrl } from '#app/services/get-ws-url-service.js';
import { success, type ServiceSuccess } from '#app/services/shared/service-result.js';
import diskConfig from '#config/disk.js';
import type { SaveUserInput } from 'shared/schemas';

interface StorageConfigPayload {
    s3Endpoint: string;
    s3Bucket: string;
    s3Prefix: string;
    s3StaticDataPrefix: string;
    s3DynamicDataPrefix: string;
}

interface InitUserPayload {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

export const mainService = {
    ping(): ServiceSuccess<{ status: 'ok' }> {
        return success({ status: 'ok' });
    },

    testRoute(): ServiceSuccess<{ status: 'ok' }> {
        return success({ status: 'ok' });
    },

    testHeaders(
        httpData: HttpData,
    ): ServiceSuccess<{ status: 'ok'; headers: { key: string; value: string }[]; params: unknown[] }> {
        const headers: { key: string; value: string }[] = [];
        const params: unknown[] = Object.entries(httpData.params);

        httpData.headers.forEach((value, key) => {
            headers.push({ key, value });
        });

        return success({ status: 'ok', headers, params });
    },

    getSetCookies(
        httpData: HttpData,
    ): ServiceSuccess<{ status: 'ok'; cookies: { key: string; value: string }[] }> {
        const cookies: { key: string; value: string }[] = [];
        httpData.cookies.forEach((value, key) => {
            cookies.push({ key, value });
        });
        return success({ status: 'ok', cookies });
    },

    testSession(
        httpData: HttpData,
        sessionInfo: SessionInfo | null,
    ): ServiceSuccess<{
        status: 'ok';
        cookies: { key: string; value: string }[];
        sessionInfo: SessionInfo | null;
    }> {
        const cookies: { key: string; value: string }[] = [];
        httpData.cookies.forEach((value, key) => {
            cookies.push({ key, value });
        });
        return success({ status: 'ok', cookies, sessionInfo });
    },

    testApiSession(
        httpData: HttpData,
        sessionInfo: SessionInfo | null,
    ): ServiceSuccess<{
        status: 'ok';
        headers: { key: string; value: string }[];
        sessionInfo: SessionInfo | null;
    }> {
        const headers: { key: string; value: string }[] = [];
        httpData.headers.forEach((value, key) => {
            headers.push({ key, value });
        });

        return success({ status: 'ok', headers, sessionInfo });
    },

    index(
        httpData: HttpData,
        responseData: ResponseData,
    ): ServiceSuccess<{ payload: HttpData; responseData: ResponseData }> {
        return success({ payload: httpData, responseData });
    },

    testParams(httpData: HttpData): ServiceSuccess<{ params: HttpData['params']; query: string[]; status: 'ok' }> {
        return success({
            params: httpData.params,
            query: httpData.query.getAll('test'),
            status: 'ok',
        });
    },

    async updateWsToken(
        sessionInfo: SessionInfo | null,
    ): Promise<ServiceSuccess<{ status: 'ok' | 'unauthorized'; message?: string; wsUrl: string }>> {
        if (sessionInfo === null) {
            return success({
                status: 'unauthorized',
                message: 'Session not found',
                wsUrl: '',
            });
        }

        const userId = sessionInfo.data.userId;
        if (userId === undefined || userId === '') {
            return success({ status: 'unauthorized', message: 'Session expired', wsUrl: '' });
        }

        const wsToken = await generateWsToken(sessionInfo, Number(userId));
        return success({ status: 'ok', wsUrl: wsToken !== '' ? getWsUrl(wsToken) : '' });
    },

    async init(
        sessionInfo: SessionInfo | null,
    ): Promise<
        ServiceSuccess<{
            status: 'ok' | 'error' | 'unauthorized';
            message?: string;
            user?: InitUserPayload;
            wsUrl?: string;
            storage?: StorageConfigPayload;
        }>
    > {
        if (sessionInfo === null) {
            return success({ status: 'error', message: 'Session not found' });
        }

        const userId = sessionInfo.data.userId;
        if (userId === undefined || userId === '') {
            return success({ status: 'unauthorized', message: 'Session expired' });
        }

        const user = await userRepository.findById(BigInt(userId));
        if (user === undefined) {
            return success({ status: 'unauthorized', message: 'Session expired' });
        }

        const wsToken = await generateWsToken(sessionInfo, Number(user.id));
        return success({
            status: 'ok',
            user: {
                id: Number(user.id),
                name: user.name,
                email: user.email,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
            wsUrl: wsToken !== '' ? getWsUrl(wsToken) : '',
            storage: {
                s3Endpoint: diskConfig.s3Endpoint ?? '',
                s3Bucket: diskConfig.s3Bucket ?? '',
                s3Prefix: diskConfig.s3Prefix ?? '',
                s3StaticDataPrefix: diskConfig.s3StaticDataPrefix ?? '',
                s3DynamicDataPrefix: diskConfig.s3DynamicDataPrefix ?? '',
            },
        });
    },

    setHeaderAndCookie(responseData: ResponseData): ServiceSuccess<{ status: 'ok' }> {
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

    testMiddleware(
        responseData: ResponseData,
    ): ServiceSuccess<{ middlewares: string[]; status: 'ok' }> {
        return success({
            middlewares: responseData.middlewareData as unknown as string[],
            status: 'ok',
        });
    },

    async saveUser(
        payload: SaveUserInput,
    ): Promise<ServiceSuccess<{ status: 'ok'; user: ReturnType<typeof userTransformer.serialize> }>> {
        const user = await userRepository.create({
            name: payload.name,
            email: payload.email,
            password: payload.password,
        });

        return success({ status: 'ok', user: userTransformer.serialize(user) });
    },
};
