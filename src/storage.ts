import { LocalStorage } from "@raycast/api";
import { KakaoChat } from "./types";

export const STORAGE_KEY = "kakaotalk-chats-v1";

export async function getChats(): Promise<KakaoChat[]> {
  const rawValue = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeChat).filter((chat): chat is KakaoChat => Boolean(chat));
  } catch {
    return [];
  }
}

export async function saveChats(chats: KakaoChat[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export async function upsertChat(nextChat: KakaoChat): Promise<void> {
  await updateChats((chats) => {
    const hasExistingChat = chats.some((chat) => chat.id === nextChat.id);

    if (hasExistingChat) {
      return chats.map((chat) => (chat.id === nextChat.id ? nextChat : chat));
    }

    return [...chats, nextChat];
  });
}

export async function touchChat(chatId: string): Promise<KakaoChat | undefined> {
  const now = new Date().toISOString();
  let touchedChat: KakaoChat | undefined;

  await updateChats((chats) =>
    chats.map((chat) => {
      if (chat.id !== chatId) {
        return chat;
      }

      touchedChat = {
        ...chat,
        lastOpened: Date.now(),
        updatedAt: now,
      };
      return touchedChat;
    }),
  );

  return touchedChat;
}

async function updateChats(updater: (chats: KakaoChat[]) => KakaoChat[]): Promise<void> {
  const chats = await getChats();
  const nextChats = updater(chats);
  await saveChats(nextChats);
}

function normalizeChat(value: unknown): KakaoChat | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const chat = value as Partial<KakaoChat>;
  if (!chat.id || !chat.name) {
    return undefined;
  }

  const now = new Date().toISOString();

  return {
    id: String(chat.id),
    name: String(chat.name),
    searchName: String(chat.searchName || chat.name),
    aliases: Array.isArray(chat.aliases) ? chat.aliases.map(String).filter(Boolean) : [],
    pinned: Boolean(chat.pinned),
    selfChat: Boolean(chat.selfChat),
    lastOpened: typeof chat.lastOpened === "number" ? chat.lastOpened : undefined,
    createdAt: chat.createdAt || now,
    updatedAt: chat.updatedAt || now,
  };
}
