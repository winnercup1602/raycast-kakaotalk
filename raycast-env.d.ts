/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Confirm Before Sending - When enabled, Raycast asks for confirmation before command-based message sending. AI tools always request confirmation. */
  "confirmBeforeSend": boolean,
  /** Close Chat Window - Close the active KakaoTalk chat window after a message is sent. */
  "closeChatWindowAfterSend": boolean,
  /** Automation Delay - Delay in milliseconds between KakaoTalk UI automation steps. Increase this if your Mac opens chats slowly. */
  "automationDelayMs": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `open-chat` command */
  export type OpenChat = ExtensionPreferences & {}
  /** Preferences accessible in the `add-chat` command */
  export type AddChat = ExtensionPreferences & {}
  /** Preferences accessible in the `send-message` command */
  export type SendMessage = ExtensionPreferences & {}
  /** Preferences accessible in the `open-kakaotalk` command */
  export type OpenKakaotalk = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `open-chat` command */
  export type OpenChat = {}
  /** Arguments passed to the `add-chat` command */
  export type AddChat = {}
  /** Arguments passed to the `send-message` command */
  export type SendMessage = {}
  /** Arguments passed to the `open-kakaotalk` command */
  export type OpenKakaotalk = {}
}

