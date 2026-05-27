import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import AddChat from "./add-chat";
import ImportChats from "./import-chats";
import { SendMessageForm } from "./components/send-message-form";
import { useKakaoChats } from "./hooks/use-kakao-chats";
import { openChat } from "./services/automation";
import { touchChat } from "./storage";
import { KakaoChat } from "./types";
import { getChatKeywords, getChatSubtitle, sortChats } from "./utils/chat";
import { getErrorMessage } from "./utils/errors";
import { getAutomationSettings } from "./utils/preferences";

export default function OpenChat() {
  const { chats, isLoading, setChats, reload } = useKakaoChats();
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const sortedChats = sortChats(chats);

  async function handleOpen(chat: KakaoChat) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Opening Chat",
      message: chat.name,
    });

    try {
      await openChat(chat, { ...getAutomationSettings(), shouldSend: false });
      await touchChat(chat.id);
      await reload();
      toast.style = Toast.Style.Success;
      toast.title = "Chat Opened";
      toast.message = chat.name;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Could Not Open Chat";
      toast.message = getErrorMessage(error);
    }
  }

  async function handlePin(chat: KakaoChat) {
    await setChats((currentChats) =>
      currentChats.map((item) =>
        item.id === chat.id ? { ...item, pinned: !item.pinned, updatedAt: new Date().toISOString() } : item,
      ),
    );
    setSelectedItemId(chat.id);
  }

  async function handleDelete(chat: KakaoChat) {
    const confirmed = await confirmAlert({
      title: `Delete ${chat.name}?`,
      message: "This removes the saved Raycast chat entry. It does not modify KakaoTalk.",
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) {
      return;
    }

    await setChats((currentChats) => currentChats.filter((item) => item.id !== chat.id));
  }

  return (
    <List
      isLoading={isLoading}
      selectedItemId={selectedItemId}
      searchBarPlaceholder="Search saved KakaoTalk chats..."
      filtering
    >
      <List.EmptyView
        icon={Icon.Message}
        title="No Saved Chats"
        description="Import existing KakaoTalk chats or add one manually."
        actions={
          <ActionPanel>
            <Action.Push title="Import Chats" icon={Icon.Download} target={<ImportChats />} />
            <Action.Push title="Add Chat" icon={Icon.Plus} target={<AddChat />} />
          </ActionPanel>
        }
      />
      {sortedChats.map((chat) => (
        <ChatListItem key={chat.id} chat={chat} onOpen={handleOpen} onPin={handlePin} onDelete={handleDelete} />
      ))}
    </List>
  );
}

interface ChatListItemProps {
  chat: KakaoChat;
  onOpen: (chat: KakaoChat) => void;
  onPin: (chat: KakaoChat) => void;
  onDelete: (chat: KakaoChat) => void;
}

function ChatListItem({ chat, onOpen, onPin, onDelete }: ChatListItemProps) {
  return (
    <List.Item
      id={chat.id}
      title={chat.name}
      subtitle={getChatSubtitle(chat)}
      icon={chat.selfChat ? Icon.Person : Icon.Message}
      keywords={getChatKeywords(chat)}
      accessories={[
        ...(chat.pinned ? [{ icon: Icon.Pin, tooltip: "Pinned" }] : []),
        ...(chat.lastOpened ? [{ text: new Date(chat.lastOpened).toLocaleDateString(), tooltip: "Last opened" }] : []),
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action title="Open Chat" icon={Icon.ArrowRight} onAction={() => onOpen(chat)} />
            <Action.Push
              title="Send Message"
              icon={Icon.Message}
              target={<SendMessageForm defaultChatId={chat.id} />}
              shortcut={{ modifiers: ["cmd"], key: "return" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title={chat.pinned ? "Unpin Chat" : "Pin Chat"}
              icon={Icon.Pin}
              shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
              onAction={() => onPin(chat)}
            />
            <Action.Push
              title="Edit Chat"
              icon={Icon.Pencil}
              target={<AddChat chat={chat} />}
              shortcut={Keyboard.Shortcut.Common.Edit}
            />
            <Action
              title="Delete Chat"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={Keyboard.Shortcut.Common.Remove}
              onAction={() => onDelete(chat)}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard title="Copy Display Name" content={chat.name} />
            <Action.CopyToClipboard title="Copy Search Name" content={chat.searchName} />
            <Action.Push title="Import Chats" icon={Icon.Download} target={<ImportChats />} />
            <Action.Push title="Add Chat" icon={Icon.Plus} target={<AddChat />} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
