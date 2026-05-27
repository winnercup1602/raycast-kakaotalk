import { randomUUID } from "node:crypto";
import { KakaoChat } from "../types";

export const QUIET_CHAT_FOLDER_NAME = "조용한 채팅방";

export function parseAliases(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n,]/)
    .map((alias) => alias.trim())
    .filter(Boolean);
}

export function formatAliases(aliases: string[]): string {
  return aliases.join(", ");
}

export function createChatId(): string {
  return randomUUID();
}

export function sortChats(chats: KakaoChat[]): KakaoChat[] {
  return [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    const aTime = a.lastOpened ?? Date.parse(a.updatedAt);
    const bTime = b.lastOpened ?? Date.parse(b.updatedAt);
    return bTime - aTime;
  });
}

export function getChatKeywords(chat: KakaoChat): string[] {
  return [chat.searchName, ...chat.aliases].filter(Boolean);
}

export function getChatSubtitle(chat: KakaoChat): string {
  if (chat.selfChat) {
    return "Self Chat";
  }

  if (chat.quiet) {
    return chat.searchName === chat.name ? "Quiet Chats" : `Quiet Chats · ${chat.searchName}`;
  }

  return chat.searchName === chat.name ? "KakaoTalk" : chat.searchName;
}

export function normalizeQuery(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function getChatCandidates(chat: KakaoChat): string[] {
  return [chat.name, chat.searchName, ...chat.aliases].filter(Boolean);
}

export function isQuietChatFolderName(name: string): boolean {
  return normalizeQuery(name) === normalizeQuery(QUIET_CHAT_FOLDER_NAME);
}

export function isQuietChatFolder(chat: KakaoChat): boolean {
  return getChatCandidates(chat).some(isQuietChatFolderName);
}

export function isRegularChat(chat: KakaoChat): boolean {
  return !isQuietChatFolder(chat);
}

export function isImportableChatName(name: string): boolean {
  return Boolean(name.trim()) && !isQuietChatFolderName(name);
}

export function filterImportableChatNames(names: string[]): string[] {
  return names.filter(isImportableChatName);
}

export function findChatByName(chats: KakaoChat[], name: string): KakaoChat | undefined {
  const query = normalizeQuery(name);
  if (!query) {
    return undefined;
  }

  return (
    chats.find(
      (chat) => isRegularChat(chat) && getChatCandidates(chat).some((candidate) => normalizeQuery(candidate) === query),
    ) ??
    chats.find(
      (chat) =>
        isRegularChat(chat) && getChatCandidates(chat).some((candidate) => normalizeQuery(candidate).includes(query)),
    )
  );
}

export function getAutomationSearchName(chat: KakaoChat): string {
  return chat.selfChat ? "나와의 채팅" : chat.searchName;
}

export function getExpectedWindowTitle(chat: KakaoChat): string {
  return chat.selfChat ? "나와의 채팅" : chat.searchName || chat.name;
}

export function mergeImportedChatNames(
  chats: KakaoChat[],
  names: string[],
  options: { quiet?: boolean } = {},
): { chats: KakaoChat[]; added: number; skipped: number; updated: number } {
  const now = new Date().toISOString();
  const nextChats = [...chats];
  const existingNames = new Map<string, number>();
  let added = 0;
  let skipped = 0;
  let updated = 0;

  nextChats.forEach((chat, index) => {
    for (const candidate of getChatCandidates(chat)) {
      existingNames.set(normalizeQuery(candidate), index);
    }
  });

  for (const name of names) {
    const trimmedName = name.trim();
    const normalizedName = normalizeQuery(trimmedName);

    if (!trimmedName) {
      continue;
    }

    if (!isImportableChatName(trimmedName)) {
      skipped += 1;
      continue;
    }

    const existingIndex = existingNames.get(normalizedName);
    if (existingIndex !== undefined) {
      const existingChat = nextChats[existingIndex];
      if (options.quiet && !existingChat.quiet && !existingChat.selfChat) {
        nextChats[existingIndex] = {
          ...existingChat,
          quiet: true,
          updatedAt: now,
        };
        updated += 1;
      }
      continue;
    }

    const isSelfChat = trimmedName === "나와의 채팅";
    nextChats.push({
      id: createChatId(),
      name: trimmedName,
      searchName: trimmedName,
      aliases: [],
      pinned: false,
      selfChat: isSelfChat,
      quiet: !isSelfChat && Boolean(options.quiet),
      createdAt: now,
      updatedAt: now,
    });
    existingNames.set(normalizedName, nextChats.length - 1);
    added += 1;
  }

  return { chats: nextChats, added, skipped, updated };
}
