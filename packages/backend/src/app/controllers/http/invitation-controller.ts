import { randomUUID } from "crypto";
import type { HttpContext } from "#vendor/types/types.js";
import { getTypedPayload } from "#vendor/utils/validation/get-typed-payload.js";
import inventionAccept from "#app/servises/invention-accept.js";
import Invitation from "#app/models/Invitation.js";
import type {
  CreateInvitationResponse,
  GetUserInvitationsResponse,
  UseInvitationResponse,
} from "../types/InvitationController.js";
import type {
  CreateInvitationInput,
  GetUserInvitationsInput,
  UseInvitationInput,
} from "shared/schemas";

export default {
  // Create new invitation
  async createInvitation(
    context: HttpContext<CreateInvitationInput>,
  ): Promise<CreateInvitationResponse> {
    const { session, logger } = context;
    logger.info("createInvitation");
    const { userId, name } = getTypedPayload(context);

    const expiresIn = 7; // Invitation validity period in days
    const sessionInfo = session?.sessionInfo;
    const userIdFromSession = sessionInfo?.data?.userId;
    if (
      !userId ||
      !userIdFromSession ||
      Number(userId) !== Number(userIdFromSession) ||
      !name
    ) {
      logger.error("User ID is required");
      return { status: "error", message: "User ID is required" };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    const createdInvitation = await Invitation.create({
      name: name,
      token: Buffer.from(randomUUID()).toString("base64"),
      userId: userId,
      expiresAt,
    });

    return {
      status: "success",
      message: "Invitation created successfully",
      token: createdInvitation.token,
    };
  },

  // Get all user invitations
  async getUserInvitations(
    context: HttpContext<GetUserInvitationsInput>,
  ): Promise<GetUserInvitationsResponse> {
    const { responseData, logger } = context;
    logger.info("getUserInvitations");

    const { userId } = getTypedPayload(context);

    if (!userId) {
      responseData.status = 400;
      return { status: "error", message: "User ID is required" };
    }

    const invitationsData = await Invitation.findByUserId(BigInt(userId));

    return { status: "success", invitations: invitationsData };
  },

  // Check and use invitation
  async useInvitation(
    context: HttpContext<UseInvitationInput>,
  ): Promise<UseInvitationResponse> {
    const { responseData, logger, session } = context;
    logger.info("useInvitation");

    const { token } = getTypedPayload(context);

    logger.info(token);

    if (!token) {
      responseData.status = 400;
      return { status: "error", message: "Token are required" };
    }
    let status: "success" | "error" | "awaiting" = "awaiting";

    const sessionInfo = session?.sessionInfo;
    if (sessionInfo) {
      const userId = sessionInfo.data?.userId;
      if (userId) {
        await inventionAccept(token, Number(userId));
        logger.info("inventionAccept");
        status = "success";
      } else {
        session.updateSessionData({
          inventionToken: token,
        });
      }
    }

    return { status };
  },
};
