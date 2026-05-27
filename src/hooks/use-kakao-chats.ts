import { useCallback, useEffect, useState } from "react";
import { getChats, saveChats } from "../storage";
import { KakaoChat } from "../types";

type ChatsUpdater = KakaoChat[] | ((currentChats: KakaoChat[]) => KakaoChat[]);

export function useKakaoChats() {
  const [chats, setChatsState] = useState<KakaoChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const storedChats = await getChats();
    setChatsState(storedChats);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setChats = useCallback(
    async (updater: ChatsUpdater) => {
      const nextChats = typeof updater === "function" ? updater(chats) : updater;
      setChatsState(nextChats);
      await saveChats(nextChats);
    },
    [chats],
  );

  return { chats, isLoading, reload, setChats };
}
