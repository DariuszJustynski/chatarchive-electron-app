# ChatArchive v2

Electron desktop app to queue, export, and analyze ChatGPT conversations.

Includes all features from v1 plus a statistics module for already-exported chats.

## Features

**Core (same as v1)**
- Embedded browser (BrowserView) — log in to ChatGPT directly inside the app
- Queue management — add chats, toggle selection, remove entries
- Export to HTML, PDF, and TXT
- Configurable output directory
- Atomic file storage for queue and settings
- Security-hardened renderer (contextIsolation, sandbox, no nodeIntegration)

**Statistics (v2 only)**
- Builds an index of all exported chats from the output directory
- Computes per-chat message counts and character metrics (user vs. assistant split)
- Aggregates totals: messages, characters, estimated words
- Computes averages: messages per chat, chars per prompt, chars per reply
- Timeline analysis: daily, weekly, monthly activity
- Peak detection: top day by chat count, longest chat by chars and messages
- Incremental index updates with re-export detection via content hash
- Index and stats stored as JSON in the app user data directory

## Requirements

- Node.js 20.x LTS
- npm

## Install

```bash
cd chatarchive-v2
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

**Archiving:**
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

**Statistics:**
- After each export, the stats panel updates automatically.
- To rebuild the index from all previously exported chats, click **Rebuild Index** in the stats panel.
- Stats require at least one exported chat with TXT format enabled (message parsing depends on chat.txt).

## Project structure

```
src/
  main/
    analytics/    — index manager and stats aggregator (v2 only)
    browser/      — BrowserView session and navigation
    export/       — export manager and format writers (HTML, PDF, TXT)
    ipc/          — IPC channel definitions and handlers
    mapper/       — maps export folders to index records (v2 only)
    security/     — app hardening
    store/        — queue and settings persistence
    utils/        — fs helpers, sanitize, time, date, hash, text metrics
    windows/      — main window factory
    main.js       — entry point
  preload/        — secure bridge between renderer and main
  renderer/       — UI components and logic (vanilla JS)
assets/           — icons and logo
tests/            — unit tests and manual scenarios
```

## Version note

v2 — core archiving + statistics module. The statistics module is self-contained
in `src/main/analytics/` and `src/main/mapper/`. It does not affect the export pipeline.
