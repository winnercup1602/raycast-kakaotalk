import { randomUUID } from "node:crypto";
import { KakaoChat } from "../types";

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

  return chat.searchName === chat.name ? "KakaoTalk" : chat.searchName;
}

export function normalizeQuery(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function getChatCandidates(chat: KakaoChat): string[] {
  return [chat.name, chat.searchName, ...chat.aliases].filter(Boolean);
}

export function findChatByName(chats: KakaoChat[], name: string): KakaoChat | undefined {
  const query = normalizeQuery(name);
  if (!query) {
    return undefined;
  }

  return (
    chats.find((chat) => getChatCandidates(chat).some((candidate) => normalizeQuery(candidate) === query)) ??
    chats.find((chat) => getChatCandidates(chat).some((candidate) => normalizeQuery(candidate).includes(query)))
  );
}

export function getAutomationSearchName(chat: KakaoChat): string {
  return chat.selfChat ? "나와의 채팅" : chat.searchName;
}

export function getExpectedWindowTitle(chat: KakaoChat): string {
  return chat.selfChat ? "나와의 채팅" : chat.searchName || chat.name;
}

export function mergeImportedChatNames(chats: KakaoChat[], names: string[]): { chats: KakaoChat[]; added: number } {
  const now = new Date().toISOString();
  const existingNames = new Set(chats.flatMap((chat) => getChatCandidates(chat).map(normalizeQuery)));
  const nextChats = [...chats];
  let added = 0;

  for (const name of names) {
    const trimmedName = name.trim();
    const normalizedName = normalizeQuery(trimmedName);

    if (!trimmedName || existingNames.has(normalizedName)) {
      continue;
    }

    nextChats.push({
      id: createChatId(),
      name: trimmedName,
      searchName: trimmedName,
      aliases: [],
      pinned: false,
      selfChat: trimmedName === "나와의 채팅",
      createdAt: now,
      updatedAt: now,
    });
    existingNames.add(normalizedName);
    added += 1;
  }

  return { chats: nextChats, added };
}
