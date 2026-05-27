export interface KakaoChat {
  id: string;
  name: string;
  searchName: string;
  aliases: string[];
  pinned: boolean;
  selfChat: boolean;
  quiet?: boolean;
  lastOpened?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatFormValues {
  name: string;
  searchName: string;
  aliases?: string;
  pinned: boolean;
  selfChat: boolean;
  quiet: boolean;
}

export interface SendMessageFormValues {
  chatId: string;
  message: string;
}

export interface Preferences {
  confirmBeforeSend: boolean;
  closeChatWindowAfterSend: boolean;
  automationDelayMs?: string;
  importChatLimit?: string;
}
