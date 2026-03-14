'use strict';

// ---------------------------------------------------------------------------
// chatMapper.js — maps a single export folder to a ChatIndexRecord.
//
// Data source: each exported chat is a folder in output_chat_store/ containing:
//   - manifest.json  : metadata (title, url, savedAt, files[])
//   - chat.txt       : conversation text (only if txt format was exported)
//
// Limitations and fallbacks:
//   - createdAt      : mapped from savedAt (export time, not chat creation time)
//                      → createdAtSource = "first_seen"
//                      ChatGPT does not expose the original creation timestamp
//                      in exported data, so this is the most honest available value.
//   - firstMessageAt / lastMessageAt: set to savedAt — no per-message timestamps
//                      exist in the txt export format.
//   - durationSeconds / durationMinutes: null — cannot be computed without
//                      per-message timestamps.
//   - messageCount   : only available when chat.txt was exported and strategy 1
//                      or 2 was used (ChatGPT-specific DOM selectors).
//                      Folders exported as MHTML/PDF only will have 0 counts.
// ---------------------------------------------------------------------------

const fs = require('fs/promises');
const path = require('path');
const { countChars, estimateWords, safeAverage, toPercent } = require('../utils/textMetrics');
const { isValidDate } = require('../utils/dateUtils');
const { createHash } = require('../utils/hashUtils');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Extract chatId from a ChatGPT conversation URL: https://chatgpt.com/c/<id>
// Falls back to the folder name so every record always has an id.
function extractChatId(url, folderName) {
  if (url) {
    const m = url.match(/\/c\/([a-zA-Z0-9_-]+)/);
    if (m && m[1]) return m[1];
  }
  return folderName || 'unknown';
}

// Parse chat.txt produced by txtExporter.js into an array of message objects.
//
// Expected format:
//   Title: ...
//   URL: ...
//   SavedAt: ...
//   <blank line>
//   [USER]
//   message text
//
//   ---
//
//   [ASSISTANT]
//   reply text
//   ...
//
// Strategy 1/2 output uses [USER] / [ASSISTANT] markers separated by \n\n---\n\n.
// Strategies 3-5 produce unmarked text that is counted as "other".
function parseTxtMessages(content) {
  if (!content || typeof content !== 'string') return [];

  // Skip header block (Title:, URL:, SavedAt:) by finding the first blank line.
  const lines = content.split('\n');
  let bodyStartLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      bodyStartLine = i + 1;
      break;
    }
  }
  const body = lines.slice(bodyStartLine).join('\n').trim();
  if (!body) return [];

  // Split on the separator used by txtExporter: \n\n---\n\n
  const segments = body.split(/\n\n---\n\n/);
  const messages = [];

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    // Match role marker at the start of the segment: [USER] or [ASSISTANT]
    const roleMatch = trimmed.match(/^\[([A-Z]+)\]\n?([\s\S]*)/);
    if (roleMatch) {
      const rawRole = roleMatch[1].toLowerCase();
      const role =
        rawRole === 'user' ? 'user'
        : rawRole === 'assistant' ? 'assistant'
        : 'other';
      const text = roleMatch[2].trim();
      messages.push({ role, text });
    } else {
      // No role marker — strategies 3-5 produce unmarked text.
      messages.push({ role: 'other', text: trimmed });
    }
  }

  return messages;
}

// ---------------------------------------------------------------------------
// Main mapping function
// ---------------------------------------------------------------------------

// Map a single export folder to a ChatIndexRecord.
// Returns null if the folder has no manifest.json (i.e. not a valid export folder).
async function mapFromFolder(folderPath) {
  const folderName = path.basename(folderPath);
  const manifestPath = path.join(folderPath, 'manifest.json');
  const txtPath = path.join(folderPath, 'chat.txt');

  // 1. Read manifest — required; skip folder if missing.
  let manifest = null;
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    manifest = JSON.parse(raw);
  } catch {
    return null;
  }

  const savedAt = manifest.savedAt || null;
  const title = manifest.source?.title || folderName;
  const url = manifest.source?.url || null;
  const chatId = extractChatId(url, folderName);

  // Derive sourceType from the list of exported file types.
  const fileTypes = (manifest.files || []).map((f) => f.type).filter(Boolean);
  const sourceType = fileTypes.length ? fileTypes.join('+') : 'unknown';

  // 2. Read chat.txt if it was exported; gracefully skip if absent.
  let txtContent = '';
  try {
    txtContent = await fs.readFile(txtPath, 'utf8');
  } catch {
    // txt was not exported — char/message counts will be 0.
  }

  const messages = parseTxtMessages(txtContent);

  // 3. Partition messages by role and count characters / words.
  const userMessages = messages.filter((m) => m.role === 'user');
  const assistantMessages = messages.filter((m) => m.role === 'assistant');
  const otherMessages = messages.filter((m) => m.role === 'other');

  const userChars = userMessages.reduce((s, m) => s + countChars(m.text), 0);
  const assistantChars = assistantMessages.reduce((s, m) => s + countChars(m.text), 0);
  const otherChars = otherMessages.reduce((s, m) => s + countChars(m.text), 0);
  const totalChars = userChars + assistantChars + otherChars;

  const messageCount = messages.length;
  const userMessageCount = userMessages.length;
  const assistantMessageCount = assistantMessages.length;
  const otherMessageCount = otherMessages.length;

  const userWordsApprox = userMessages.reduce((s, m) => s + estimateWords(m.text), 0);
  const assistantWordsApprox = assistantMessages.reduce((s, m) => s + estimateWords(m.text), 0);
  const otherWordsApprox = otherMessages.reduce((s, m) => s + estimateWords(m.text), 0);
  const totalWordsApprox = userWordsApprox + assistantWordsApprox + otherWordsApprox;

  const avgUserPromptChars = safeAverage(userChars, userMessageCount);
  const avgAssistantReplyChars = safeAverage(assistantChars, assistantMessageCount);
  const avgMessageChars = safeAverage(totalChars, messageCount);

  const userSharePercent = toPercent(userChars, totalChars);
  const assistantSharePercent = toPercent(assistantChars, totalChars);

  // 4. Determine createdAt.
  //    The only reliable timestamp we have is savedAt (export time).
  //    createdAtSource = "first_seen" because this is when the program first
  //    saw the chat, not when it was originally created on ChatGPT.
  const createdAt = isValidDate(savedAt) ? savedAt : null;
  const createdAtSource = 'first_seen';

  // firstMessageAt / lastMessageAt: fallback to savedAt (no per-message timestamps).
  const firstMessageAt = isValidDate(savedAt) ? savedAt : null;
  const lastMessageAt = isValidDate(savedAt) ? savedAt : null;

  // durationSeconds / durationMinutes: cannot be determined without message timestamps.
  const durationSeconds = null;
  const durationMinutes = null;

  // 5. Compute content hash for change detection.
  //    Include manifest and txt so any re-export with different content is detected.
  const hashInput = JSON.stringify({ manifest, txtContent });
  const hash = createHash(hashInput);

  // 6. Build and return the record.
  return {
    chatId,
    title,
    sourceFile: folderName,
    sourceType,
    sourceUrl: url,

    createdAt,
    createdAtSource,
    updatedAt: isValidDate(savedAt) ? savedAt : null,
    firstMessageAt,
    lastMessageAt,

    messageCount,
    userMessageCount,
    assistantMessageCount,
    otherMessageCount,

    userChars,
    assistantChars,
    otherChars,
    totalChars,

    avgUserPromptChars: Math.round(avgUserPromptChars * 100) / 100,
    avgAssistantReplyChars: Math.round(avgAssistantReplyChars * 100) / 100,
    avgMessageChars: Math.round(avgMessageChars * 100) / 100,

    userWordsApprox,
    assistantWordsApprox,
    totalWordsApprox,

    durationSeconds,
    durationMinutes,

    userSharePercent: Math.round(userSharePercent * 100) / 100,
    assistantSharePercent: Math.round(assistantSharePercent * 100) / 100,

    status: 'indexed',
    version: 1,
    hash,
    lastIndexedAt: new Date().toISOString(),
  };
}

module.exports = { mapFromFolder };
