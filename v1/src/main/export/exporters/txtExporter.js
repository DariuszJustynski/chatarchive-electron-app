const fs = require('fs/promises');

// ---------------------------------------------------------------------------
// Conversation extraction script (injected into the page via executeJavaScript).
//
// Multi-strategy cascade — from most specific to most generic:
//   1. data-message-author-role  (ChatGPT 2024-2026)
//   2. data-testid conversation turns
//   3. <main> content only
//   4. body minus nav / sidebar / header / footer
//   5. raw body fallback
//
// Strategies 1-2 label each message with [USER] / [ASSISTANT].
// ---------------------------------------------------------------------------
const EXTRACT_CONVERSATION = `(function() {
  var NL = '\\n';
  var SEP = NL + NL + '---' + NL + NL;

  /* --- Strategy 1: data-message-author-role --- */
  var msgEls = document.querySelectorAll('[data-message-author-role]');
  if (msgEls.length >= 2) {
    var parts1 = [];
    for (var i = 0; i < msgEls.length; i++) {
      var role = msgEls[i].getAttribute('data-message-author-role');
      var label = role === 'user' ? 'USER'
               : role === 'assistant' ? 'ASSISTANT'
               : role.toUpperCase();
      var text = msgEls[i].innerText.trim();
      if (text) parts1.push('[' + label + ']' + NL + text);
    }
    if (parts1.length >= 2) return parts1.join(SEP);
  }

  /* --- Strategy 2: conversation-turn data-testid --- */
  var turns = document.querySelectorAll('[data-testid^="conversation-turn-"]');
  if (turns.length >= 2) {
    var parts2 = [];
    for (var j = 0; j < turns.length; j++) {
      var t = turns[j].innerText.trim();
      if (t) parts2.push(t);
    }
    if (parts2.length >= 2) return parts2.join(SEP);
  }

  /* --- Strategy 3: <main> content only --- */
  var main = document.querySelector('main') || document.querySelector('[role="main"]');
  if (main) {
    var mt = main.innerText.trim();
    if (mt.length > 100) return mt;
  }

  /* --- Strategy 4: body minus nav/sidebar elements --- */
  var clone = document.body.cloneNode(true);
  var toRemove = clone.querySelectorAll(
    'nav, aside, header, footer, ' +
    '[role="navigation"], [role="complementary"], [role="banner"]'
  );
  for (var k = 0; k < toRemove.length; k++) toRemove[k].remove();
  var cleaned = clone.innerText.trim();
  if (cleaned.length > 100) return cleaned;

  /* --- Strategy 5: raw fallback --- */
  return document.body ? document.body.innerText.trim() : '';
})()`;

async function exportTxt(webContents, filePath) {
  const title = webContents.getTitle();
  const url = webContents.getURL();
  let body = '';

  try {
    body = await webContents.executeJavaScript(EXTRACT_CONVERSATION, true);
  } catch {
    // If the conversation extractor fails entirely, try raw body as last resort.
    try {
      body = await webContents.executeJavaScript(
        'document.body ? document.body.innerText : ""',
        true,
      );
    } catch {
      body = '';
    }
  }

  const content = [
    `Title: ${title}`,
    `URL: ${url}`,
    `SavedAt: ${new Date().toISOString()}`,
    '',
    body,
  ].join('\n');

  await fs.writeFile(filePath, content, 'utf8');
  return { type: 'txt', path: 'chat.txt' };
}

module.exports = {
  exportTxt,
};
