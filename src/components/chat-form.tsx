import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { getChats, saveChats } from "../storage";
import { ChatFormValues, KakaoChat } from "../types";
import { createChatId, formatAliases, parseAliases } from "../utils/chat";
import { getErrorMessage } from "../utils/errors";

interface ChatFormProps {
  chat?: KakaoChat;
}

export function ChatForm({ chat }: ChatFormProps) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = Boolean(chat);

  async function handleSubmit(values: ChatFormValues) {
    setIsLoading(true);

    try {
      const name = values.name.trim();
      const searchName = values.selfChat ? "나와의 채팅" : (values.searchName || values.name).trim();

      if (!name) {
        throw new Error("Display name is required.");
      }

      if (!searchName) {
        throw new Error("KakaoTalk search name is required.");
      }

      const now = new Date().toISOString();
      const nextChat: KakaoChat = {
        id: chat?.id ?? createChatId(),
        name,
        searchName,
        aliases: parseAliases(values.aliases),
        pinned: values.pinned,
        selfChat: values.selfChat,
        lastOpened: chat?.lastOpened,
        createdAt: chat?.createdAt ?? now,
        updatedAt: now,
      };

      const chats = await getChats();
      const nextChats = isEditing
        ? chats.map((item) => (item.id === nextChat.id ? nextChat : item))
        : [...chats, nextChat];

      await saveChats(nextChats);
      await showToast({
        style: Toast.Style.Success,
        title: isEditing ? "Chat Updated" : "Chat Added",
        message: nextChat.name,
      });
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: isEditing ? "Could Not Update Chat" : "Could Not Add Chat",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isEditing ? "Save Chat" : "Add Chat"}
            icon={isEditing ? Icon.CheckCircle : Icon.Plus}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Display Name" placeholder="Jisoo" defaultValue={chat?.name} autoFocus />
      <Form.TextField
        id="searchName"
        title="KakaoTalk Search Name"
        placeholder="Exact chat name KakaoTalk can find"
        defaultValue={chat?.searchName}
        info="Use the exact name that appears in KakaoTalk search. The extension stops before sending if the opened chat title does not match this value."
      />
      <Form.TextArea
        id="aliases"
        title="Aliases"
        placeholder="Comma-separated aliases"
        defaultValue={chat ? formatAliases(chat.aliases) : undefined}
      />
      <Form.Checkbox id="pinned" title="Options" label="Pin Chat" defaultValue={chat?.pinned ?? false} />
      <Form.Checkbox id="selfChat" title="" label="This is my self-chat" defaultValue={chat?.selfChat ?? false} />
    </Form>
  );
}
