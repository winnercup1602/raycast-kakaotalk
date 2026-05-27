import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { useKakaoChats } from "../hooks/use-kakao-chats";
import { importChatNames, importQuietChatNames } from "../services/automation";
import {
  filterImportableChatNames,
  getChatCandidates,
  isRegularChat,
  mergeImportedChatNames,
  normalizeQuery,
  sortChats,
} from "../utils/chat";
import { getErrorMessage } from "../utils/errors";
import { getImportSettings } from "../utils/preferences";

export function ImportChatsView() {
  const { chats, isLoading, setChats, reload } = useKakaoChats();
  const [importedNames, setImportedNames] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const existingNames = new Set(chats.flatMap((chat) => getChatCandidates(chat).map(normalizeQuery)));

  async function handleImport(source: "recent" | "quiet") {
    setIsImporting(true);
    const settings = getImportSettings();
    const isQuietImport = source === "quiet";
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: isQuietImport ? "Importing Quiet Chats" : "Importing KakaoTalk Chats",
      message: `Reading up to ${settings.limit} ${isQuietImport ? "quiet" : "recent"} chats`,
    });

    try {
      const names = isQuietImport ? await importQuietChatNames(settings) : await importChatNames(settings);
      const merged = mergeImportedChatNames(chats, names, { quiet: isQuietImport });

      await setChats(merged.chats);
      await reload();
      setImportedNames(names);

      toast.style = Toast.Style.Success;
      toast.title = isQuietImport ? "Quiet Chats Imported" : "Chats Imported";
      toast.message = `${merged.added} new, ${filterImportableChatNames(names).length} chats found${
        merged.updated ? `, ${merged.updated} updated` : ""
      }${merged.skipped ? `, ${merged.skipped} folder skipped` : ""}`;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Could Not Import Chats";
      toast.message = getErrorMessage(error);
    } finally {
      setIsImporting(false);
    }
  }

  const visibleNames =
    importedNames.length > 0
      ? filterImportableChatNames(importedNames)
      : sortChats(chats)
          .filter(isRegularChat)
          .map((chat) => chat.name);

  return (
    <List isLoading={isLoading || isImporting} searchBarPlaceholder="Search imported KakaoTalk chats...">
      <List.EmptyView
        icon={Icon.Download}
        title="Import Existing Chats"
        description="Read recent chat names from the KakaoTalk app without reading message history."
        actions={
          <ActionPanel>
            <Action title="Import Recent Chats" icon={Icon.Download} onAction={() => handleImport("recent")} />
            <Action title="Import Quiet Chats" icon={Icon.BellDisabled} onAction={() => handleImport("quiet")} />
          </ActionPanel>
        }
      />
      {visibleNames.map((name) => {
        const exists = existingNames.has(normalizeQuery(name));

        return (
          <List.Item
            key={name}
            title={name}
            icon={exists ? Icon.CheckCircle : Icon.Message}
            accessories={[{ text: exists ? "Saved" : "New" }]}
            actions={
              <ActionPanel>
                <Action title="Import Recent Chats" icon={Icon.Download} onAction={() => handleImport("recent")} />
                <Action title="Import Quiet Chats" icon={Icon.BellDisabled} onAction={() => handleImport("quiet")} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
