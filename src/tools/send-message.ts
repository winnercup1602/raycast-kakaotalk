import { Tool } from "@raycast/api";
import { sendMessageToChat } from "../services/automation";
import { getChats, touchChat } from "../storage";
import { findChatByName } from "../utils/chat";
import { getErrorMessage } from "../utils/errors";
import { getAutomationSettings } from "../utils/preferences";

type Input = {
  /**
   * Saved chat name, exact KakaoTalk search name, or alias.
   */
  name: string;
  /**
   * Message text to send.
   */
  message: string;
};

export default async function SendMessageTool(input: Input) {
  try {
    const message = input.message?.trim();
    if (!message) {
      throw new Error("Message cannot be empty.");
    }

    const chats = await getChats();
    const chat = findChatByName(chats, input.name);

    if (!chat) {
      throw new Error(`No saved KakaoTalk chat matches "${input.name}".`);
    }

    await sendMessageToChat(chat, message, { ...getAutomationSettings(), shouldSend: true });
    await touchChat(chat.id);

    return {
      message: `Sent message to ${chat.name}.`,
    };
  } catch (error) {
    return {
      error: getErrorMessage(error),
    };
  }
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const chats = await getChats();
  const chat = findChatByName(chats, input.name);

  return {
    message: "Send this KakaoTalk message?",
    info: [
      { name: "To", value: chat?.name ?? input.name },
      { name: "Message", value: input.message },
      { name: "Delivery", value: "Native KakaoTalk UI automation" },
    ],
  };
};
