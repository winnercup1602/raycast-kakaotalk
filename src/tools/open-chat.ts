import { openChat } from "../services/automation";
import { getChats, touchChat } from "../storage";
import { findChatByName } from "../utils/chat";
import { getErrorMessage } from "../utils/errors";
import { getAutomationSettings } from "../utils/preferences";

type Input = {
  /**
   * Saved chat name, exact KakaoTalk search name, or alias.
   */
  name: string;
};

export default async function OpenChatTool(input: Input) {
  try {
    const chats = await getChats();
    const chat = findChatByName(chats, input.name);

    if (!chat) {
      throw new Error(`No saved KakaoTalk chat matches "${input.name}".`);
    }

    await openChat(chat, { ...getAutomationSettings(), shouldSend: false });
    await touchChat(chat.id);

    return {
      message: `Opened KakaoTalk chat with ${chat.name}.`,
    };
  } catch (error) {
    return {
      error: getErrorMessage(error),
    };
  }
}
