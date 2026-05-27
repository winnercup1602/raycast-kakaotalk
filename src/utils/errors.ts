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
  if (message.includes("ACCESSIBILITY_PERMISSION_REQUIRED")) {
    return "Raycast needs Accessibility permission to control KakaoTalk. Open System Settings > Privacy & Security > Accessibility and enable Raycast.";
  }

  if (message.includes("KAKAOTALK_NOT_INSTALLED")) {
    return "KakaoTalk is not installed on this Mac.";
  }

  if (message.includes("KAKAOTALK_NOT_RUNNING")) {
    return "KakaoTalk did not start correctly.";
  }

  if (message.includes("EMPTY_MESSAGE")) {
    return "Message cannot be empty.";
  }

  if (message.includes("NO_CHAT_TABLE")) {
    return "Could not find the KakaoTalk chat list. Open KakaoTalk, make sure you are signed in, and try again.";
  }

  const titleMismatch = message.match(/CHAT_TITLE_MISMATCH:([\s\S]*)/);
  if (titleMismatch) {
    const activeTitle = titleMismatch[1]?.trim();
    return activeTitle
      ? `The active KakaoTalk chat looked like "${activeTitle}", so the message was not sent. Update the saved search name to match the chat title.`
      : "Could not verify the active KakaoTalk chat, so the message was not sent.";
  }

  return message.replace(/^Error: /, "").trim();
}
