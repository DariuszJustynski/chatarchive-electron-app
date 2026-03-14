# ChatArchive Electron App

Electron desktop app to archive ChatGPT conversations.
Two versions in one repository — choose the one that fits your needs.

---

## Versions

### v1 — Core archiving

Located in `v1/`

- Embedded browser (BrowserView) — log in to ChatGPT directly inside the app
- Manual queue management — add, select, remove chats
- Export to HTML, PDF, and TXT
- Configurable output directory
- Security-hardened renderer (contextIsolation, sandbox)

### v2 — Core archiving + Statistics

Located in `v2/`

Everything in v1, plus:

- Statistics panel for all exported chats
- Message counts, character metrics, user/assistant split
- Averages: messages per chat, chars per prompt, chars per reply
- Timeline: daily, weekly, monthly activity
- Peak detection: top day, longest chat
- Incremental index with content-hash change detection

---

## Requirements

- Node.js 20.x LTS
- npm

---

## Install and run

Each version is a self-contained app. Install and run independently.

**v1:**
```bash
cd v1
npm install
npm start
```

**v2:**
```bash
cd v2
npm install
npm start
```

**Tests:**
```bash
npm test
```
(run from inside `v1/` or `v2/`)

---

## Repository structure

```
chatarchive-electron-app/
├── v1/                  — basic archiving version
│   ├── src/
│   ├── tests/
│   ├── assets/
│   ├── package.json
│   └── README.md
├── v2/                  — archiving + statistics version
│   ├── src/
│   ├── tests/
│   ├── assets/
│   ├── package.json
│   └── README.md
└── README.md            — this file
```

---

## How to use

1. Launch the app — it opens with `https://chatgpt.com` loaded.
2. Log in manually in the embedded browser.
3. Open a specific chat.
4. Click **Add current chat to queue**.
5. Check the chats you want to export.
6. Select output formats (HTML / PDF / TXT).
7. Click **Export selected**.

Each chat is saved to its own timestamped folder inside `output_chat_store/`.

In v2: after export the stats panel updates automatically. Click **Rebuild Index** to re-scan all previously exported chats.

---

## Notes

- `output_chat_store/` is gitignored — exported chats stay local only.
- App data (queue, settings, index) is stored in the OS user data directory, not in this repo.
- Icon files in `assets/icons/` are placeholders — replace before distributing.
