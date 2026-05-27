import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { useKakaoChats } from "../hooks/use-kakao-chats";
import { importChatNames } from "../services/automation";
import { mergeImportedChatNames, normalizeQuery, sortChats } from "../utils/chat";
import { getErrorMessage } from "../utils/errors";
import { getImportSettings } from "../utils/preferences";

export function ImportChatsView() {
  const { chats, isLoading, setChats, reload } = useKakaoChats();
  const [importedNames, setImportedNames] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const existingNames = new Set(chats.map((chat) => normalizeQuery(chat.searchName)));

  async function handleImport() {
    setIsImporting(true);
    const settings = getImportSettings();
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Importing KakaoTalk Chats",
      message: `Reading up to ${settings.limit} recent chats`,
    });

    try {
      const names = await importChatNames(settings);
      const merged = mergeImportedChatNames(chats, names);

      await setChats(merged.chats);
      await reload();
      setImportedNames(names);

      toast.style = Toast.Style.Success;
      toast.title = "Chats Imported";
      toast.message = `${merged.added} new, ${names.length} found`;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Could Not Import Chats";
      toast.message = getErrorMessage(error);
    } finally {
      setIsImporting(false);
    }
  }

  const visibleNames = importedNames.length > 0 ? importedNames : sortChats(chats).map((chat) => chat.name);

  return (
    <List isLoading={isLoading || isImporting} searchBarPlaceholder="Search imported KakaoTalk chats...">
      <List.EmptyView
        icon={Icon.Download}
        title="Import Existing Chats"
        description="Read recent chat names from the KakaoTalk app without reading message history."
        actions={
          <ActionPanel>
            <Action title="Import Recent Chats" icon={Icon.Download} onAction={handleImport} />
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
                <Action title="Import Recent Chats" icon={Icon.Download} onAction={handleImport} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
