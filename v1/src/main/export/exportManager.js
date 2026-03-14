const path = require('path');
const { IPC_CHANNELS } = require('../ipc/ipcChannels');
const { ensureDir } = require('../utils/fsSafe');
const { makeFolderName } = require('./namePolicy');
const { exportHtml } = require('./exporters/htmlExporter');
const { exportPdf } = require('./exporters/pdfExporter');
const { exportTxt } = require('./exporters/txtExporter');
const { writeManifest } = require('./exporters/manifestWriter');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Content-readiness check (injected into the BrowserView page context).
// The old check used document.body.innerText.length > 200, which triggered
// on sidebar text alone.  This version looks for actual conversation elements.
// ---------------------------------------------------------------------------
const CHECK_CONTENT_READY = `(function() {
  /* ChatGPT: message role attributes */
  var msgs = document.querySelectorAll('[data-message-author-role]');
  if (msgs.length >= 2) return true;

  /* ChatGPT: conversation-turn test-ids */
  var turns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
  if (turns.length >= 2) return true;

  /* Generic SPA: <main> has substantial text beyond sidebar chrome */
  var main = document.querySelector('main') || document.querySelector('[role="main"]');
  if (main && main.innerText.trim().length > 300) return true;

  /* Non-ChatGPT pages: large body text (> 1000 to avoid sidebar false-positive) */
  if (document.body && document.body.innerText.trim().length > 1000) return true;

  return false;
})()`;

// ---------------------------------------------------------------------------
// Scroll-through script: scrolls the conversation container to its bottom
// to force lazy / virtualised content to render in the DOM.
// ---------------------------------------------------------------------------
const SCROLL_TO_BOTTOM = `(function() {
  var el = document.querySelector('[class*="react-scroll-to-bottom"]')
        || document.querySelector('main [role="presentation"]')
        || document.querySelector('main')
        || document.documentElement;
  if (!el) return 0;
  el.scrollTop = el.scrollHeight;
  return el.scrollHeight;
})()`;

const SCROLL_TO_TOP = `(function() {
  var el = document.querySelector('[class*="react-scroll-to-bottom"]')
        || document.querySelector('main [role="presentation"]')
        || document.querySelector('main')
        || document.documentElement;
  if (el) el.scrollTop = 0;
})()`;

/**
 * Waits until conversation-specific DOM content is present.
 * The sidebar / nav text loads almost immediately, but conversation messages
 * arrive asynchronously via ChatGPT's API and React rendering pipeline.
 */
async function waitForContentReady(webContents, timeoutMs = 30000) {
  // Phase 1: bootstrap time for JS framework + initial API calls.
  await delay(3000);

  // Phase 2: poll for conversation elements.
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const ready = await webContents.executeJavaScript(CHECK_CONTENT_READY, true);
      if (ready) {
        // Phase 3: settle time for final rendering (images, fonts, LaTeX).
        await delay(2000);
        return true;
      }
    } catch {
      // JS context may not be ready yet.
    }
    await delay(1000);
  }

  return false;
}

/**
 * Scrolls the conversation to the bottom and back to trigger lazy rendering.
 * Some SPAs only mount message nodes that are near the viewport.
 */
async function scrollToRenderAll(webContents) {
  try {
    await webContents.executeJavaScript(SCROLL_TO_BOTTOM, true);
    await delay(2000);
    await webContents.executeJavaScript(SCROLL_TO_TOP, true);
    await delay(500);
  } catch {
    // Non-critical — save whatever is available.
  }
}

function sendProgress(mainWindow, step, total, itemId, message) {
  mainWindow.webContents.send(IPC_CHANNELS.EXPORT_PROGRESS, {
    step,
    total,
    itemId,
    message,
  });
}

async function runExport({ mainWindow, items, formats, outputDir, viewManager }) {
  const results = [];
  await ensureDir(outputDir);

  const webContents = viewManager.getWebContents();

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const dirName = makeFolderName(item.title, new Date());
    const dirPath = path.join(outputDir, dirName);

    try {
      await ensureDir(dirPath);

      // --- 1. Load the page ------------------------------------------------
      sendProgress(mainWindow, i + 1, items.length, item.id, `Loading: ${item.url}`);
      await webContents.loadURL(item.url);

      // --- 2. Wait for conversation content to render ----------------------
      sendProgress(mainWindow, i + 1, items.length, item.id, 'Waiting for conversation to render\u2026');
      const ready = await waitForContentReady(webContents);
      if (!ready) {
        sendProgress(mainWindow, i + 1, items.length, item.id, 'Content readiness timeout \u2013 saving anyway');
      }

      // --- 3. Scroll through to force lazy / virtualized messages ----------
      sendProgress(mainWindow, i + 1, items.length, item.id, 'Scrolling to render all messages\u2026');
      await scrollToRenderAll(webContents);

      // Capture metadata after full render.
      const pageTitle = webContents.getTitle() || item.title;
      const pageUrl = webContents.getURL() || item.url;

      // --- 4. Save in requested formats ------------------------------------
      sendProgress(mainWindow, i + 1, items.length, item.id, 'Saving page\u2026');
      const files = [];

      if (formats.html) {
        files.push(await exportHtml(webContents, path.join(dirPath, 'chat.mhtml')));
      }
      if (formats.pdf) {
        files.push(await exportPdf(webContents, path.join(dirPath, 'chat.pdf')));
      }
      if (formats.txt) {
        files.push(await exportTxt(webContents, path.join(dirPath, 'chat.txt')));
      }

      // --- 5. Write manifest -----------------------------------------------
      await writeManifest(dirPath, { url: pageUrl, title: pageTitle }, files);

      results.push({ id: item.id, ok: true, dirName, files });
    } catch (error) {
      results.push({ id: item.id, ok: false, error: error.message });
    }
  }

  mainWindow.webContents.send(IPC_CHANNELS.EXPORT_DONE, { results });
  return results;
}

module.exports = {
  runExport,
};
