import { ChatForm } from "./components/chat-form";
import { KakaoChat } from "./types";

interface AddChatProps {
  chat?: KakaoChat;
}

export default function AddChat({ chat }: AddChatProps = {}) {
  return <ChatForm chat={chat} />;
}
