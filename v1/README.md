# ChatArchive v1

Electron desktop app to manually queue and export ChatGPT conversations.

## Features

- Embedded browser (BrowserView) — log in to ChatGPT directly inside the app
- Queue management — add chats, toggle selection, remove entries
- Export to HTML, PDF, and TXT
- Configurable output directory
- Atomic file storage for queue and settings
- Security-hardened renderer (contextIsolation, sandbox, no nodeIntegration)

## Requirements

- Node.js 20.x LTS
- npm

## Install

```bash
cd chatarchive-v1
npm install
```

## Run

```bash
npm start
```

## Test

```bash
npm test
```

## How to use

1. Launch the app — it opens with `https://chatgpt.com` loaded.
2. Log in manually in the embedded browser.
3. Open a specific chat.
4. Click **Add current chat to queue**.
5. Check the chats you want to export.
6. Select output formats (HTML / PDF / TXT).
7. Click **Export selected**.

Each chat is saved to its own folder:

```
output_chat_store/YYYY-MM-DD_HH-mm-ss__slug-title/
```

## Project structure

```
src/
  main/
    browser/      — BrowserView session and navigation
    export/       — export manager and format writers (HTML, PDF, TXT)
    ipc/          — IPC channel definitions and handlers
    security/     — app hardening
    store/        — queue and settings persistence
    utils/        — fs helpers, sanitize, time
    windows/      — main window factory
    main.js       — entry point
  preload/        — secure bridge between renderer and main
  renderer/       — UI components and logic (vanilla JS)
assets/           — icons and logo
tests/            — unit tests and manual scenarios
```

## Version note

v1 — core archiving only. No statistics. No analytics.
