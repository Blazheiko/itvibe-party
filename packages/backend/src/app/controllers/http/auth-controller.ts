import userModel from "#app/models/User.js";
import type { HttpContext } from "#vendor/types/types.js";
import { getTypedPayload } from "#vendor/utils/validation/get-typed-payload.js";
import { hashPassword, validatePassword } from "metautil";
import inventionAccept from "#app/servises/invention-accept.js";
import generateWsToken from "#app/servises/generate-ws-token.js";
import type {
  RegisterResponse,
  LoginResponse,
  LogoutResponse,
} from "../types/AuthController.js";
import getWsUrl from "#app/servises/getWsUrl.js";
import type { LoginInput, RegisterInput } from "shared/schemas";

export default {
  async register(
    context: HttpContext<RegisterInput>,
  ): Promise<RegisterResponse> {
    const { auth, session, logger } = context;
    logger.info("register handler");
    const payload = getTypedPayload(context);
    const { name, email, password, token } = payload;

    const exist = await userModel.findByEmail(email);
    if (exist) {
      return { status: "error", message: "Email already exist" };
    }

    const oldSessionData = session.sessionInfo?.data;

    const hash = await hashPassword(password);

    const userCreated = await userModel.create({
      name: name,
      email: email,
      password: hash,
    });

    // Get raw user data for auth.login
    const rawUser = await userModel.findByEmail(email);
    if (!rawUser) {
      return { status: "error", message: "Failed to create user" };
    }

    if (oldSessionData && oldSessionData['inventionToken']) {
      await inventionAccept(String(oldSessionData['inventionToken']), Number(rawUser.id));
      logger.info("inventionAccept register");
    }

    await session.destroySession(session.sessionInfo?.id);
    const res = await auth.login(rawUser.id);
    const sessionInfo = session.sessionInfo;
    let wsToken = "";
    if (sessionInfo)
      wsToken = await generateWsToken(sessionInfo, Number(rawUser.id));
    if (token) await inventionAccept(token, Number(rawUser.id));
    return {
      status: res ? "success" : "error",
      user: userCreated,
      wsUrl: wsToken ? getWsUrl(wsToken) : "",
    };
  },
  async login(
    context: HttpContext<LoginInput>,
  ): Promise<LoginResponse | string> {
    const { responseData, auth, session, logger } = context;
    logger.info("login handler");
    // logger.info(context.httpData);
    const { email, password, token } = getTypedPayload(context);
    // logger.info(`email: ${email}, password: ${password}, token: ${token}`)

    const user = await userModel.findByEmail(email);
    logger.info(user, "user");

    if (user) {
      const valid = await validatePassword(password, user.password);
      if (valid) {
        const oldSessionData = session.sessionInfo?.data;
        if (oldSessionData && oldSessionData['inventionToken']) {
          await inventionAccept(String(oldSessionData['inventionToken']), Number(user.id));
          logger.info("inventionAccept login");
        }
        const res = await auth.login(user.id);
        const sessionInfo = session.sessionInfo;
        logger.info(sessionInfo);

        let wsToken = "";
        if (sessionInfo)
          wsToken = await generateWsToken(sessionInfo, Number(user.id));
        if (token) await inventionAccept(token, Number(user.id));

        return {
          status: res ? "success" : "error",
          user: userModel.serialize(user),
          wsUrl: wsToken ? getWsUrl(wsToken) : "",
        };
      }
    }
    logger.info("unauthorized");
    responseData.status = 401;
    return "unauthorized";
  },
  async logout(context: HttpContext): Promise<LogoutResponse> {
    const { auth, logger } = context;
    logger.info("logout handler");
    const res = await auth.logout();
    return { status: res ? "success" : "error" };
  },
  async logoutAll(context: HttpContext): Promise<LogoutResponse> {
    const { auth, logger } = context;
    logger.info("logoutAll handler");
    const res = await auth.logoutAll();
    return { status: res ? "success" : "error", deletedCount: res };
  },
};
