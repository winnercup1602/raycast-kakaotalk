import { randomUUID } from "node:crypto";
import { KakaoChat } from "../types";

export const QUIET_CHAT_FOLDER_NAME = "조용한 채팅방";
export const SELF_CHAT_NAME = "나와의 채팅";

export function parseAliases(value?: string): string[] {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();

  return value
    .split(/[\n,]/)
    .map((alias) => alias.trim())
    .filter((alias) => {
      if (!alias) {
        return false;
      }

      const normalizedAlias = normalizeQuery(alias);
      if (seen.has(normalizedAlias)) {
        return false;
      }

      seen.add(normalizedAlias);
      return true;
    });
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

export function getRegularChats(chats: KakaoChat[]): KakaoChat[] {
  return chats.filter(isRegularChat);
}

export function getSortedRegularChats(chats: KakaoChat[]): KakaoChat[] {
  return sortChats(chats).filter(isRegularChat);
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

  const candidates = getRegularChats(chats).map((chat) => ({
    chat,
    names: getChatCandidates(chat).map(normalizeQuery),
  }));

  return (
    candidates.find((candidate) => candidate.names.some((nameCandidate) => nameCandidate === query))?.chat ??
    candidates.find((candidate) => candidate.names.some((nameCandidate) => nameCandidate.includes(query)))?.chat
  );
}

export function requireChatByName(chats: KakaoChat[], name: string): KakaoChat {
  const query = name.trim();
  if (!query) {
    throw new Error("Chat name cannot be empty.");
  }

  const chat = findChatByName(chats, query);
  if (!chat) {
    throw new Error(`No saved KakaoTalk chat matches "${name}".`);
  }

  return chat;
}

export function getAutomationSearchName(chat: KakaoChat): string {
  return chat.searchName || chat.name;
}

export function mergeImportedChatNames(
  chats: KakaoChat[],
  names: string[],
): { chats: KakaoChat[]; added: number; skipped: number } {
  const now = new Date().toISOString();
  const nextChats = [...chats];
  const existingNames = new Set<string>();
  let added = 0;
  let skipped = 0;

  nextChats.forEach((chat) => {
    for (const candidate of getChatCandidates(chat)) {
      existingNames.add(normalizeQuery(candidate));
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

    if (existingNames.has(normalizedName)) {
      continue;
    }

    nextChats.push(createImportedChat(trimmedName, now));
    existingNames.add(normalizedName);
    added += 1;
  }

  return { chats: nextChats, added, skipped };
}

function createImportedChat(name: string, timestamp: string): KakaoChat {
  return {
    id: createChatId(),
    name,
    searchName: name,
    aliases: [],
    pinned: false,
    selfChat: name === SELF_CHAT_NAME,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
