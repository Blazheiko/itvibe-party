import {
  contactListRepository,
  userRepository,
} from "#app/repositories/index.js";
import { contactListTransformer } from "#app/transformers/index.js";
import { getOnlineUser } from "#vendor/utils/network/ws-handlers.js";
import { failure, success } from "#app/services/shared/service-result.js";

export const chatListService = {
  async getContactList(
    requestedUserId: number,
    sessionUserId: string | number | bigint | undefined,
  ) {
    if (!requestedUserId || !sessionUserId) {
      return failure("UNAUTHORIZED", "Session expired");
    }

    if (Number(requestedUserId) !== Number(sessionUserId)) {
      return failure("UNAUTHORIZED", "Session expired");
    }

    const userId = BigInt(requestedUserId);
    const contactListData =
      await contactListRepository.findByUserIdWithDetails(userId);
    const onlineUsers = getOnlineUser(
      contactListData.map((contact) => String(contact.contactId)),
    );

    return success({
      contactList: contactListTransformer.serializeArrayWithDetails(
        contactListData as any,
      ),
      onlineUsers,
    });
  },

  async createChat(
    userIdValue: string | number | bigint | undefined,
    participantId: number,
  ) {
    if (!userIdValue) {
      return failure("UNAUTHORIZED", "Session expired");
    }

    if (!participantId) {
      return failure("BAD_REQUEST", "Participant ID is required");
    }

    const userId = BigInt(userIdValue);
    const participantBigInt = BigInt(participantId);

    const participant = await userRepository.findById(participantBigInt);
    if (participant === undefined) {
      return failure("NOT_FOUND", "Participant not found");
    }

    const existingChat = await contactListRepository.findExistingChat(
      userId,
      participantBigInt,
    );

    if (existingChat !== undefined) {
      return success({
        chat: contactListTransformer.serialize(existingChat as any),
      });
    }

    const createdChat = await contactListRepository.createWithUserInfo(
      userId,
      participantBigInt,
      "accepted",
    );

    if (createdChat === undefined) {
      return failure("INTERNAL", "Failed to create chat");
    }

    return success({
      chat: contactListTransformer.serialize(createdChat as any),
    });
  },

  async deleteChat(
    userIdValue: string | number | bigint | undefined,
    chatIdValue: number,
  ): Promise<ServiceFailure | ServiceSuccess> {
    if (userIdValue === undefined) {
      return failure("UNAUTHORIZED", "Session expired");
    }

    // if (chatIdValue === undefined) {
    //     return failure('BAD_REQUEST', 'Chat ID is required');
    // }

    const userId = BigInt(userIdValue);
    const chatId = BigInt(chatIdValue);

    const chat = await contactListRepository.findByIdAndUserId(chatId, userId);
    if (chat === undefined) {
      return failure("NOT_FOUND", "Chat not found or access denied");
    }

    await contactListRepository.delete(chatId);

    return success({ message: "Chat deleted successfully" });
  },
};
