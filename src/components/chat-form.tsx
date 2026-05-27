import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { upsertChat } from "../storage";
import { ChatFormValues, KakaoChat } from "../types";
import { createChatId, formatAliases, isQuietChatFolderName, parseAliases } from "../utils/chat";
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
      const searchName = (values.searchName || values.name).trim();

      if (!name) {
        throw new Error("Display name is required.");
      }

      if (!searchName) {
        throw new Error("KakaoTalk search name is required.");
      }

      if (isQuietChatFolderName(searchName)) {
        throw new Error("Quiet Chats is a folder row, not an individual chat. Add the actual chat name instead.");
      }

      const now = new Date().toISOString();
      const isSelfChat = Boolean(values.selfChat);
      const nextChat: KakaoChat = {
        id: chat?.id ?? createChatId(),
        name,
        searchName,
        aliases: parseAliases(values.aliases),
        pinned: values.pinned,
        selfChat: isSelfChat,
        lastOpened: chat?.lastOpened,
        createdAt: chat?.createdAt ?? now,
        updatedAt: now,
      };

      await upsertChat(nextChat);
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
        info="Use the exact name shown in KakaoTalk chat search."
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
