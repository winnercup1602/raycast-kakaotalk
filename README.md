# KakaoTalk Raycast Extension

[![CI](https://github.com/winnercup1602/raycast-kakaotalk/actions/workflows/ci.yml/badge.svg)](https://github.com/winnercup1602/raycast-kakaotalk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An unofficial Raycast extension for opening saved KakaoTalk chats and sending messages through the native macOS KakaoTalk app.

## Overview

KakaoTalk does not provide a public desktop API for arbitrary chat access, so this extension intentionally avoids private databases, unofficial messaging protocols, and message-history scraping. It stores only user-managed chat metadata in Raycast local storage and uses local macOS UI automation to open chats and send messages.

## Commands

- `Open Chat`: search saved chats, open them in KakaoTalk, pin favorites, edit metadata, or start a message.
- `Add Chat`: save a chat by display name and exact KakaoTalk search name.
- `Send Message`: choose a saved chat and send a message through KakaoTalk UI automation.
- `Open KakaoTalk`: open or activate the native app.

## AI Tools

- `open-chat`: opens a saved KakaoTalk chat by display name, search name, or alias.
- `send-message`: sends a message to a saved chat after Raycast tool confirmation.

## Setup

1. Install KakaoTalk for macOS and sign in.
2. Add chats with the same name KakaoTalk can find in its chat search.
3. Grant Raycast Accessibility permission when macOS asks. This is required because the extension automates the KakaoTalk UI locally.

## Development

```bash
npm install
npm run dev
```

Before submitting changes:

```bash
npm run lint
npm run build
```

## Privacy

This extension stores only the chat names and aliases you add in Raycast local storage. It does not read KakaoTalk databases, scrape message history, use unofficial KakaoTalk protocols, or send data to external servers.

## Notes

Message sending uses the KakaoTalk desktop UI. If a chat cannot be opened or the active chat window title does not match the saved chat name, the extension stops before sending.

## License

MIT
