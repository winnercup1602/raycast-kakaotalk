import { getApplications } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { KakaoChat } from "../types";
import { AutomationSettings } from "../utils/preferences";
import { getAutomationSearchName, getExpectedWindowTitle, isQuietChatFolder } from "../utils/chat";

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
  const expectedTitle = getExpectedWindowTitle(chat);
  const delaySeconds = String(options.delayMs / 1000);
  const shouldSend = options.shouldSend === true ? "1" : "0";
  const shouldClose = options.closeAfterSend ? "1" : "0";

  const result = await runAppleScript(
    CHAT_AUTOMATION_SCRIPT,
    [searchName, message, shouldSend, shouldClose, delaySeconds, expectedTitle],
    { timeout: 30000 },
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
  set expectedTitle to item 6 of argv
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
          perform action "AXRaise" of window "카카오톡"
        end if
      end tell
    end tell

    delay delaySeconds

    my activateRootChatTab(delaySeconds)

    my searchAndOpenChat(chatName, delaySeconds)

    delay (delaySeconds * 2)
    set openedTitle to my frontWindowTitle()

    if my titleDoesNotMatch(openedTitle, expectedTitle) then
      error "CHAT_TITLE_MISMATCH:" & openedTitle
    end if

    if shouldSend then
      my pasteAndSendMessage(messageText, delaySeconds)
      delay delaySeconds

      if shouldClose then
        tell application "System Events"
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

on titleDoesNotMatch(openedTitle, expectedTitle)
  if expectedTitle is "" then return false
  if openedTitle is "" then return true
  if openedTitle contains expectedTitle then return false
  if expectedTitle contains openedTitle then return false
  return true
end titleDoesNotMatch

on activateRootChatTab(delaySeconds)
  tell application "System Events"
    key code 18 using command down
    delay delaySeconds
    key code 19 using command down
  end tell
end activateRootChatTab

on pasteAndSendMessage(messageText, delaySeconds)
  set the clipboard to messageText

  tell application "System Events"
    set inputArea to my focusMessageInput()
    delay (delaySeconds / 2)
    keystroke "v" using command down
    delay delaySeconds

    set couldReadPastedText to false
    set pastedText to ""
    try
      set pastedText to value of inputArea as text
      set couldReadPastedText to true
    end try
    if couldReadPastedText and pastedText does not contain messageText then error "MESSAGE_PASTE_FAILED"

    key code 36
  end tell
end pasteAndSendMessage

on focusMessageInput()
  tell application "System Events"
    tell process "KakaoTalk"
      if not (exists front window) then error "CHAT_NOT_SENDABLE"
      set chatWindow to front window
      set inputCandidates to {}

      try
        repeat with candidateInput in text areas of chatWindow
          set end of inputCandidates to candidateInput
        end repeat
      end try

      try
        repeat with candidateInput in entire contents of chatWindow
          try
            if role of candidateInput is "AXTextArea" then set end of inputCandidates to candidateInput
          end try
        end repeat
      end try

      repeat with candidateInput in inputCandidates
        try
          set inputEnabled to true
          try
            if enabled of candidateInput is false then set inputEnabled to false
          end try
          if inputEnabled then
            set focused of candidateInput to true
            delay 0.1
            if focused of candidateInput is true then return candidateInput
          end if
        end try
      end repeat
    end tell
  end tell

  error "CHAT_NOT_SENDABLE"
end focusMessageInput

on searchAndOpenChat(chatName, delaySeconds)
  tell application "System Events"
    tell process "KakaoTalk"
      if not (exists window "카카오톡") then error "NO_CHAT_TABLE"
      set mainWindow to window "카카오톡"
      try
        set searchField to text field 1 of mainWindow
      on error
        error "NO_CHAT_SEARCH_FIELD"
      end try

      set focused of searchField to true
      set value of searchField to ""
      delay (delaySeconds / 2)
      set value of searchField to chatName
    end tell

    delay (delaySeconds * 2)

    tell process "KakaoTalk"
      try
        set tableRef to table 1 of scroll area 1 of window "카카오톡"
      on error
        error "NO_CHAT_TABLE"
      end try

      set rowCount to count of rows of tableRef
      set rowsToCheck to rowCount
      if rowsToCheck > 25 then set rowsToCheck to 25

      set matchedIndex to 0
      repeat with i from 1 to rowsToCheck
        try
          set cellRef to UI element 1 of row i of tableRef
          set rowName to value of static text 1 of cellRef as text
          if rowName is chatName or rowName contains chatName or chatName contains rowName then
            set matchedIndex to i
            exit repeat
          end if
        end try
      end repeat

      if matchedIndex is 0 then error "CHAT_NOT_FOUND:" & chatName
      set focused of text field 1 of window "카카오톡" to true
    end tell

    repeat matchedIndex times
      key code 125
      delay 0.05
    end repeat
    delay (delaySeconds / 2)
    key code 36
  end tell
end searchAndOpenChat

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
