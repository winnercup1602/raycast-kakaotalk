import { getPreferenceValues } from "@raycast/api";
import { Preferences } from "../types";

export interface AutomationSettings {
  delayMs: number;
  closeAfterSend: boolean;
}

export interface ImportSettings {
  delayMs: number;
  limit: number;
}

export function getAutomationSettings(): AutomationSettings {
  const preferences = getPreferenceValues<Preferences>();
  const parsedDelay = Number.parseInt(preferences.automationDelayMs ?? "500", 10);

  return {
    delayMs: Number.isFinite(parsedDelay) ? clamp(parsedDelay, 100, 3000) : 500,
    closeAfterSend: Boolean(preferences.closeChatWindowAfterSend),
  };
}

export function getImportSettings(): ImportSettings {
  const preferences = getPreferenceValues<Preferences>();
  const parsedDelay = Number.parseInt(preferences.automationDelayMs ?? "500", 10);
  const parsedLimit = Number.parseInt(preferences.importChatLimit ?? "80", 10);

  return {
    delayMs: Number.isFinite(parsedDelay) ? clamp(parsedDelay, 100, 3000) : 500,
    limit: Number.isFinite(parsedLimit) ? clamp(parsedLimit, 10, 500) : 80,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
