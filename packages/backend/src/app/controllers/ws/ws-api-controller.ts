import logger from "#logger";
import User from "#app/models/User.js";
import type { WsContext } from "#vendor/types/types.js";
import broadcastig from "#app/servises/broadcastig.js";
import readMessages from "#app/servises/chat/read-messages.js";
import type {
  ReadMessagesInput,
  RegisterInput,
  WSCallerIdPayload,
  WSEventTypingPayload,
  WSTargetUserIdPayload,
} from "shared/schemas";

export default {
  eventTyping({ wsData }: WsContext<WSEventTypingPayload>) {
    const payload = wsData.payload as WSEventTypingPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.contactId),
      "event_typing",
      payload,
    );

    return { status: "ok" };
  },
  async readMessage({ wsData }: WsContext<ReadMessagesInput>) {
    logger.info("ws readMessage");
    const payload = wsData.payload as ReadMessagesInput;
    logger.info(payload);
    await readMessages(BigInt(payload.userId), BigInt(payload.contactId));
    return { status: "ok", message: "Read message event sent" };
  },
  async incomingCall({ wsData }: WsContext<WSEventTypingPayload>) {
    const payload = wsData.payload as WSEventTypingPayload;

    broadcastig.broadcastMessageToUser(
      String(payload.contactId),
      "incoming_call",
      payload,
    );
    return { status: "ok", message: "Incoming call event sent" };
  },
  async acceptIncomingCall({ wsData }: WsContext<WSCallerIdPayload>) {
    const payload = wsData.payload as WSCallerIdPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.callerId),
      "accept_call",
      payload,
    );
    return { status: "ok", message: "Accept call event sent" };
  },
  async declineIncomingCall({ wsData }: WsContext<WSCallerIdPayload>) {
    const payload = wsData.payload as WSCallerIdPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.callerId),
      "decline_call",
      payload,
    );
    return { status: "ok", message: "Decline call event sent" };
  },
  async webrtcCallOffer({ wsData }: WsContext<WSTargetUserIdPayload>) {
    const payload = wsData.payload as WSTargetUserIdPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.targetUserId),
      "webrtc_call_offer",
      payload,
    );
    return { status: "ok", message: "Webrtc call offer event sent" };
  },
  async webrtcCallAnswer({ wsData }: WsContext<WSTargetUserIdPayload>) {
    const payload = wsData.payload as WSTargetUserIdPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.targetUserId),
      "webrtc_call_answer",
      payload,
    );
    return { status: "ok", message: "Webrtc call answer event sent" };
  },
  async webrtcIceCandidate({ wsData }: WsContext<WSTargetUserIdPayload>) {
    const payload = wsData.payload as WSTargetUserIdPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.targetUserId),
      "webrtc_ice_candidate",
      payload,
    );
    return { status: "ok", message: "Webrtc ice candidate event sent" };
  },
  async webrtcStartCall({ wsData }: WsContext<WSTargetUserIdPayload>) {
    const payload = wsData.payload as WSTargetUserIdPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.targetUserId),
      "webrtc_start_call",
      payload,
    );
    return { status: "ok", message: "Webrtc start call event sent" };
  },
  async webrtcCallEnd({ wsData }: WsContext<WSTargetUserIdPayload>) {
    logger.info("ws webrtcCallEnd");
    const payload = wsData.payload as WSTargetUserIdPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.targetUserId),
      "webrtc_call_end",
      payload,
    );
    return { status: "ok", message: "Webrtc call end event sent" };
  },
  async webrtcCancelCall({ wsData }: WsContext<WSTargetUserIdPayload>) {
    logger.info("ws webrtcCancelCall");
    const payload = wsData.payload as WSTargetUserIdPayload;
    broadcastig.broadcastMessageToUser(
      String(payload.targetUserId),
      "webrtc_cancel_call",
      payload,
    );
    return { status: "ok", message: "Webrtc cancel call event sent" };
  },
  error() {
    logger.info("ws error");
    throw new Error("Test error");

    // return responseData;
  },
  testWs() {
    logger.info("ws testWs");
    return { status: "ok", message: "testWs" };
  },
  async saveUser({ wsData }: WsContext<RegisterInput>) {
    logger.info("ws saveUser");
    const payload = wsData.payload as RegisterInput;
    console.log({ payload });
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      password: payload.password,
    });
    // console.log(user);

    return { status: "ok", user };
  },
};
