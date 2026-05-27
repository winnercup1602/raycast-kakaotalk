import { showHUD } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { openQuietChats } from "./services/automation";
import { getAutomationSettings } from "./utils/preferences";

export default async function OpenQuietChats() {
  try {
    await openQuietChats(getAutomationSettings());
    await showHUD("Quiet Chats opened");
  } catch (error) {
    await showFailureToast(error, { title: "Could Not Open Quiet Chats" });
  }
}
