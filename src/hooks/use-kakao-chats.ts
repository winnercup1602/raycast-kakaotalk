import { useCallback, useEffect, useRef, useState } from "react";
import { getChats, saveChats } from "../storage";
import { KakaoChat } from "../types";

type ChatsUpdater = KakaoChat[] | ((currentChats: KakaoChat[]) => KakaoChat[]);

export function useKakaoChats() {
  const [chats, setChatsState] = useState<KakaoChat[]>([]);
  const chatsRef = useRef<KakaoChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);

    try {
      const storedChats = await getChats();
      chatsRef.current = storedChats;
      setChatsState(storedChats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const setChats = useCallback(async (updater: ChatsUpdater) => {
    const nextChats = typeof updater === "function" ? updater(chatsRef.current) : updater;
    chatsRef.current = nextChats;
    setChatsState(nextChats);
    await saveChats(nextChats);
  }, []);

  return { chats, isLoading, reload, setChats };
}
