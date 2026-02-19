import { hashPassword, validatePassword } from 'metautil';
import type { Auth, Session } from '#vendor/types/types.js';
import { userRepository } from '#app/repositories/index.js';
import { userTransformer } from '#app/transformers/index.js';
import { failure, success, type ServiceResult, type ServiceSuccess } from '#app/services/shared/service-result.js';
import { acceptInvitation } from '#app/services/invitation-accept-service.js';
import { generateWsToken } from '#app/services/generate-ws-token-service.js';
import { getWsUrl } from '#app/services/get-ws-url-service.js';
import type { LoginInput, RegisterInput } from 'shared/schemas';

export const authService = {
    async register(
        payload: RegisterInput,
        auth: Auth,
        session: Session,
    ): Promise<
        ServiceResult<{
            status: 'success' | 'error';
            user: ReturnType<typeof userTransformer.serialize>;
            wsUrl: string;
        }>
    > {
        const { name, email, password, token } = payload;

        const exist = await userRepository.findByEmail(email);
        if (exist !== undefined) {
            return failure('CONFLICT', 'Email already exist');
        }

        const oldSessionData = session.sessionInfo?.data;
        const hash = await hashPassword(password);

        const userCreated = await userRepository.create({
            name,
            email,
            password: hash,
        });

        const invTokenRegister = oldSessionData?.['inventionToken'];
        if (typeof invTokenRegister === 'string' && invTokenRegister !== '') {
            await acceptInvitation(invTokenRegister, Number(userCreated.id));
        }

        await session.destroySession(session.sessionInfo?.id);
        const loggedIn = await auth.login(userCreated.id);
        const status: 'success' | 'error' = loggedIn ? 'success' : 'error';

        const sessionInfo = session.sessionInfo;
        let wsToken = '';
        if (sessionInfo !== null) {
            wsToken = await generateWsToken(sessionInfo, Number(userCreated.id));
        }

        if (token !== '') {
            await acceptInvitation(token, Number(userCreated.id));
        }

        return success({
            status,
            user: userTransformer.serialize(userCreated),
            wsUrl: wsToken !== '' ? getWsUrl(wsToken) : '',
        });
    },

    async login(
        payload: LoginInput,
        auth: Auth,
        session: Session,
    ): Promise<
        ServiceResult<{
            status: 'success' | 'error';
            user: ReturnType<typeof userTransformer.serialize>;
            wsUrl: string;
        }>
    > {
        const { email, password, token } = payload;

        const user = await userRepository.findByEmail(email);
        if (user === undefined) {
            return failure('UNAUTHORIZED', 'unauthorized');
        }

        const valid = await validatePassword(password, user.password);
        if (!valid) {
            return failure('UNAUTHORIZED', 'unauthorized');
        }

        const oldSessionData = session.sessionInfo?.data;
        const invTokenLogin = oldSessionData?.['inventionToken'];
        if (typeof invTokenLogin === 'string' && invTokenLogin !== '') {
            await acceptInvitation(invTokenLogin, Number(user.id));
        }

        const loggedIn = await auth.login(user.id);
        const status: 'success' | 'error' = loggedIn ? 'success' : 'error';
        const sessionInfo = session.sessionInfo;

        let wsToken = '';
        if (sessionInfo !== null) {
            wsToken = await generateWsToken(sessionInfo, Number(user.id));
        }

        if (token !== '') {
            await acceptInvitation(token, Number(user.id));
        }

        return success({
            status,
            user: userTransformer.serialize(user),
            wsUrl: wsToken !== '' ? getWsUrl(wsToken) : '',
        });
    },

    async logout(auth: Auth): Promise<ServiceSuccess<{ status: 'success' | 'error' }>> {
        const result = await auth.logout();
        const status: 'success' | 'error' = result ? 'success' : 'error';
        return success({ status });
    },

    async logoutAll(
        auth: Auth,
    ): Promise<ServiceSuccess<{ status: 'success' | 'error'; deletedCount: number }>> {
        const result = await auth.logoutAll();
        const status: 'success' | 'error' = result > 0 ? 'success' : 'error';
        return success({
            status,
            deletedCount: result,
        });
    },
};
