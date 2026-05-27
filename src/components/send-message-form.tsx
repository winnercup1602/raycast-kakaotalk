import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Detail,
  Form,
  Icon,
  showToast,
  Toast,
  useNavigation,
  getPreferenceValues,
} from "@raycast/api";
import { useState } from "react";
import { ChatForm } from "./chat-form";
import { sendMessageToChat } from "../services/automation";
import { touchChat } from "../storage";
import { SendMessageFormValues, Preferences } from "../types";
import { getChatSubtitle, isRegularChat, sortChats } from "../utils/chat";
import { getErrorMessage } from "../utils/errors";
import { getAutomationSettings } from "../utils/preferences";
import { useKakaoChats } from "../hooks/use-kakao-chats";

interface SendMessageFormProps {
  defaultChatId?: string;
}

export function SendMessageForm({ defaultChatId }: SendMessageFormProps) {
  const { chats, isLoading } = useKakaoChats();
  const { pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(defaultChatId ?? "");
  const sortedChats = sortChats(chats).filter(isRegularChat);

  async function handleSubmit(values: SendMessageFormValues) {
    const chat = chats.find((item) => item.id === values.chatId);
    const message = values.message.trim();

    if (!chat) {
      await showToast({ style: Toast.Style.Failure, title: "Select a Chat" });
      return;
    }

    if (!message) {
      await showToast({ style: Toast.Style.Failure, title: "Message Cannot Be Empty" });
      return;
    }

    const preferences = getPreferenceValues<Preferences>();
    if (preferences.confirmBeforeSend) {
      const confirmed = await confirmAlert({
        title: `Send Message to ${chat.name}?`,
        message,
        primaryAction: {
          title: "Send Message",
          style: Alert.ActionStyle.Default,
        },
      });

      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Sending Message",
      message: chat.name,
    });

    try {
      await sendMessageToChat(chat, message, { ...getAutomationSettings(), shouldSend: true });
      await touchChat(chat.id);
      toast.style = Toast.Style.Success;
      toast.title = "Message Sent";
      toast.message = chat.name;
      pop();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Could Not Send Message";
      toast.message = getErrorMessage(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoading && chats.length === 0) {
    return (
      <Detail
        markdown="No saved KakaoTalk chats yet."
        actions={
          <ActionPanel>
            <Action.Push title="Add Chat" icon={Icon.Plus} target={<ChatForm />} />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Form
      isLoading={isLoading || isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send Message" icon={Icon.Message} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="chatId" title="Chat" defaultValue={defaultChatId ?? ""} onChange={setSelectedChatId}>
        {!defaultChatId ? <Form.Dropdown.Item value="" title="Select a chat..." icon={Icon.Circle} /> : null}
        {sortedChats.map((chat) => (
          <Form.Dropdown.Item key={chat.id} value={chat.id} title={chat.name} icon={Icon.Message} />
        ))}
      </Form.Dropdown>
      <Form.Description text={getSelectedChatDescription(sortedChats, selectedChatId)} />
      <Form.TextArea id="message" title="Message" placeholder="Type a message to send..." />
    </Form>
  );
}

function getSelectedChatDescription(chats: ReturnType<typeof sortChats>, selectedChatId: string): string {
  const chat = chats.find((item) => item.id === selectedChatId);
  return chat ? `Target: ${chat.name} (${getChatSubtitle(chat)})` : "Select a chat before writing the message.";
}
