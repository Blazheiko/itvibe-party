import { generateKey } from 'metautil';
import redis from '#database/redis.js';
import type { SessionInfo } from '#vendor/types/types.js';
import configApp from '#config/app.js';

export async function generateWsToken(
    sessionInfo: SessionInfo,
    userId: number | bigint,
): Promise<string> {
    const userIdNumber = Number(userId);

    if (!Number.isFinite(userIdNumber) || userIdNumber <= 0) {
        return '';
    }

    const wsToken = generateKey(configApp.characters, 16);
    await redis.setex(
        `auth:ws:${wsToken}`,
        60,
        JSON.stringify({
            sessionId: sessionInfo.id,
            userId: String(userIdNumber),
        }),
    );

    return wsToken;
}
