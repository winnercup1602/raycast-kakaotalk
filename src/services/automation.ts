import { getApplications } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { KakaoChat } from "../types";
import { AutomationSettings } from "../utils/preferences";
import { getAutomationSearchName, isQuietChatFolder } from "../utils/chat";

export const KAKAOTALK_BUNDLE_ID = "com.kakao.KakaoTalkMac";

interface OpenChatOptions extends AutomationSettings {
  shouldSend?: false;
}

interface SendMessageOptions extends AutomationSettings {
  shouldSend: true;
}

export async function openKakaoTalk(): Promise<void> {
  await ensureKakaoTalkInstalled();

  await runAppleScript(
    `
tell application id "${KAKAOTALK_BUNDLE_ID}"
  reopen
  activate
end tell
`,
    { timeout: 10000 },
  );
}

export async function openChat(chat: KakaoChat, options: OpenChatOptions): Promise<string> {
  assertRegularChat(chat);
  return runChatAutomation(chat, "", options);
}

export async function sendMessageToChat(
  chat: KakaoChat,
  message: string,
  options: SendMessageOptions,
): Promise<string> {
  assertRegularChat(chat);
  return runChatAutomation(chat, message, options);
}

export async function importChatNames(options: { delayMs: number; limit: number }): Promise<string[]> {
  await ensureKakaoTalkInstalled();

  const result = await runAppleScript(IMPORT_CHATS_SCRIPT, [String(options.limit), String(options.delayMs / 1000)], {
    timeout: 120000,
  });

  return parseImportedNames(result);
}

function parseImportedNames(result: string): string[] {
  return result
    .split("\u001f")
    .map((name) => name.trim())
    .filter(Boolean);
}

function assertRegularChat(chat: KakaoChat): void {
  if (isQuietChatFolder(chat)) {
    throw new Error("QUIET_CHAT_FOLDER_NOT_CHAT");
  }
}

async function ensureKakaoTalkInstalled(): Promise<void> {
  const applications = await getApplications();
  const hasKakaoTalk = applications.some((application) => application.bundleId === KAKAOTALK_BUNDLE_ID);

  if (!hasKakaoTalk) {
    throw new Error("KAKAOTALK_NOT_INSTALLED");
  }
}

async function runChatAutomation(
  chat: KakaoChat,
  message: string,
  options: OpenChatOptions | SendMessageOptions,
): Promise<string> {
  await ensureKakaoTalkInstalled();

  const searchName = getAutomationSearchName(chat);
  const delaySeconds = String(options.delayMs / 1000);
  const shouldSend = options.shouldSend === true ? "1" : "0";
  const shouldClose = options.closeAfterSend ? "1" : "0";

  const result = await runAppleScript(
    CHAT_AUTOMATION_SCRIPT,
    [searchName, message, shouldSend, shouldClose, delaySeconds],
    {
      timeout: 30000,
    },
  );

  return result.trim();
}

const CHAT_AUTOMATION_SCRIPT = `
on run argv
  set chatName to item 1 of argv
  set messageText to item 2 of argv
  set shouldSend to item 3 of argv is "1"
  set shouldClose to item 4 of argv is "1"
  set delaySeconds to item 5 of argv as real
  set previousClipboard to missing value
  set openedTitle to ""

  try
    set previousClipboard to the clipboard as text
  end try

  try
    if shouldSend and messageText is "" then error "EMPTY_MESSAGE"

    tell application "System Events"
      if UI elements enabled is false then error "ACCESSIBILITY_PERMISSION_REQUIRED"
    end tell

    my ensureKakaoTalkFrontmost()
    my searchAndOpenChat(chatName, delaySeconds)
    set openedTitle to my ensureChatWindowFrontmost(delaySeconds)

    if shouldSend then
      my pasteAndSendMessage(messageText, delaySeconds)

      if shouldClose then
        tell application "System Events"
          my ensureKakaoTalkFrontmost()
          key code 13 using command down
        end tell
      end if
    end if

    my restoreClipboard(previousClipboard)
    return openedTitle
  on error errMsg number errNo
    my restoreClipboard(previousClipboard)
    error errMsg number errNo
  end try
end run

on ensureKakaoTalkFrontmost()
  tell application id "com.kakao.KakaoTalkMac"
    reopen
    activate
  end tell

  tell application "System Events"
    repeat 50 times
      if exists process "KakaoTalk" then
        tell process "KakaoTalk"
          try
            set frontmost to true
          end try
          try
            if exists front window then perform action "AXRaise" of front window
          end try
        end tell

        delay 0.05

        try
          if frontmost of process "KakaoTalk" is true then return
        end try
      end if

      delay 0.1
    end repeat
  end tell

  error "KAKAOTALK_NOT_FRONTMOST"
end ensureKakaoTalkFrontmost

on waitForMainWindow(delaySeconds)
  tell application "System Events"
    repeat 40 times
      try
        if exists process "KakaoTalk" then
          tell process "KakaoTalk"
            if exists window "카카오톡" then return
            if (count of windows) > 0 then return
          end tell
        end if
      end try
      delay delaySeconds
    end repeat
  end tell

  error "NO_CHAT_TABLE"
end waitForMainWindow

on frontWindowTitle()
  tell application "System Events"
    tell process "KakaoTalk"
      if exists front window then
        return name of front window
      end if
    end tell
  end tell
  return ""
end frontWindowTitle

on activateChatSearch(delaySeconds)
  tell application "System Events"
    my ensureKakaoTalkFrontmost()
    key code 19 using command down
  end tell
  delay delaySeconds
end activateChatSearch

on pasteAndSendMessage(messageText, delaySeconds)
  set the clipboard to messageText
  delay 0.05

  tell application "System Events"
    my ensureKakaoTalkFrontmost()
    key code 9 using command down
  end tell
  delay delaySeconds
  tell application "System Events"
    my ensureKakaoTalkFrontmost()
    key code 36
  end tell
end pasteAndSendMessage

on searchAndOpenChat(chatName, delaySeconds)
  my waitForMainWindow(delaySeconds)
  my activateChatSearch(delaySeconds)
  my pasteIntoSearchField(chatName, delaySeconds)

  tell application "System Events"
    my ensureKakaoTalkFrontmost()
    key code 125
    delay 0.08
    key code 36
  end tell
end searchAndOpenChat

on pasteIntoSearchField(chatName, delaySeconds)
  set the clipboard to chatName
  delay 0.05

  tell application "System Events"
    my ensureKakaoTalkFrontmost()
    key code 3 using command down
    delay (delaySeconds / 2)
    key code 0 using command down
    delay 0.05
    key code 51
    delay 0.05
    key code 9 using command down
  end tell
  delay delaySeconds
end pasteIntoSearchField

on ensureChatWindowFrontmost(delaySeconds)
  repeat 50 times
    set currentTitle to my frontWindowTitle()
    if currentTitle is not "" and currentTitle is not "카카오톡" then return currentTitle

    tell application "System Events"
      if not (exists process "KakaoTalk") then error "KAKAOTALK_NOT_RUNNING"
      my ensureKakaoTalkFrontmost()
      key code 36
    end tell

    delay delaySeconds
  end repeat

  error "CHAT_OPEN_FAILED"
end ensureChatWindowFrontmost

on restoreClipboard(previousClipboard)
  try
    if previousClipboard is not missing value then
      set the clipboard to previousClipboard
    end if
  end try
end restoreClipboard
`;

const IMPORT_CHATS_SCRIPT = `
on run argv
  set maxRows to item 1 of argv as integer
  set delaySeconds to item 2 of argv as real
  set importedNames to {}
  set delimiterText to ASCII character 31

  tell application "System Events"
    if UI elements enabled is false then error "ACCESSIBILITY_PERMISSION_REQUIRED"
  end tell

  tell application id "com.kakao.KakaoTalkMac"
    reopen
    activate
  end tell

  delay delaySeconds

  tell application "System Events"
    if not (exists process "KakaoTalk") then error "KAKAOTALK_NOT_RUNNING"
    tell process "KakaoTalk"
      set frontmost to true
      if exists window "카카오톡" then
        set mainWindow to window "카카오톡"
        perform action "AXRaise" of mainWindow
      else
        set mainWindow to front window
      end if
    end tell

    my activateRootChatTab(delaySeconds)
    delay delaySeconds

    tell process "KakaoTalk"
      set mainWindow to window "카카오톡"
      try
        set tableRef to table 1 of scroll area 1 of mainWindow
      on error
        error "NO_CHAT_TABLE"
      end try

      set rowCount to count of rows of tableRef
      set rowsToRead to rowCount
      if rowsToRead > maxRows then set rowsToRead to maxRows

      repeat with i from 1 to rowsToRead
        try
          set cellRef to UI element 1 of row i of tableRef
          set chatName to value of static text 1 of cellRef as text
          if chatName is not "" then set end of importedNames to chatName
        end try
      end repeat
    end tell
  end tell

  set AppleScript's text item delimiters to delimiterText
  set outputText to importedNames as text
  set AppleScript's text item delimiters to ""
  return outputText
end run

on activateRootChatTab(delaySeconds)
  tell application "System Events"
    key code 18 using command down
    delay delaySeconds
    key code 19 using command down
  end tell
end activateRootChatTab
`;
