export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return normalizeAutomationError(error.message);
  }

  if (typeof error === "string") {
    return normalizeAutomationError(error);
  }

  return "Unknown error";
}

function normalizeAutomationError(message: string): string {
  for (const [errorCode, userMessage] of AUTOMATION_ERROR_MESSAGES) {
    if (message.includes(errorCode)) {
      return userMessage;
    }
  }

  const chatNotFound = message.match(/CHAT_NOT_FOUND:([\s\S]*)/);
  if (chatNotFound) {
    const chatName = chatNotFound[1]?.trim();
    return chatName
      ? `Could not find "${chatName}" in KakaoTalk chat search results. Try importing chats again or edit the saved search name.`
      : "Could not find the chat in KakaoTalk search results.";
  }

  return message.replace(/^Error: /, "").trim();
}

const AUTOMATION_ERROR_MESSAGES = [
  [
    "ACCESSIBILITY_PERMISSION_REQUIRED",
    "Raycast needs Accessibility permission to control KakaoTalk. Open System Settings > Privacy & Security > Accessibility and enable Raycast.",
  ],
  ["KAKAOTALK_NOT_INSTALLED", "KakaoTalk is not installed on this Mac."],
  ["KAKAOTALK_NOT_RUNNING", "KakaoTalk did not start correctly."],
  [
    "KAKAOTALK_NOT_FRONTMOST",
    "KakaoTalk did not become the active app, so no keyboard input was sent. If KakaoTalk is on a different desktop (Space), switch to that desktop once and try again.",
  ],
  ["EMPTY_MESSAGE", "Message cannot be empty."],
  [
    "QUIET_CHAT_FOLDER_NOT_CHAT",
    "Quiet Chats is a folder row, not an individual chat. Search for the actual chat name instead.",
  ],
  [
    "NO_CHAT_TABLE",
    "Could not find the KakaoTalk chat list. Open KakaoTalk, make sure you are signed in, and try again.",
  ],
  [
    "CHAT_OPEN_FAILED",
    "KakaoTalk searched the chat, but did not open the first result. Try increasing the automation delay in extension preferences.",
  ],
] as const;
