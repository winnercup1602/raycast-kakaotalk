import { getPreferenceValues } from "@raycast/api";
import { Preferences } from "../types";

export interface AutomationSettings {
  delayMs: number;
  closeAfterSend: boolean;
}

export function getAutomationSettings(): AutomationSettings {
  const preferences = getPreferenceValues<Preferences>();
  const parsedDelay = Number.parseInt(preferences.automationDelayMs ?? "500", 10);

  return {
    delayMs: Number.isFinite(parsedDelay) ? clamp(parsedDelay, 100, 3000) : 500,
    closeAfterSend: Boolean(preferences.closeChatWindowAfterSend),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
