'use strict';

// ---------------------------------------------------------------------------
// indexManager.js — manages chat-index.json and chat-stats.json.
//
// Storage location: app.getPath('userData') — same directory as queue.json
// and settings.json, consistent with the rest of the app's persistence layer.
//
// Two operations:
//   rebuildIndex(outputDir)         — full scan of all export folders
//   updateIndexWithFolder(folder)   — incremental update after a single export
// ---------------------------------------------------------------------------

const fs = require('fs/promises');
const path = require('path');
const { app } = require('electron');
const { writeJsonAtomic, readJsonOrDefault, ensureDir } = require('../utils/fsSafe');
const { mapFromFolder } = require('../mapper/chatMapper');
const { aggregateStats } = require('./statsAggregator');

const INDEX_VERSION = 1;

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

function getIndexPath() {
  return path.join(app.getPath('userData'), 'chat-index.json');
}

function getStatsPath() {
  return path.join(app.getPath('userData'), 'chat-stats.json');
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function emptyIndex() {
  return {
    generatedAt: new Date().toISOString(),
    version: INDEX_VERSION,
    chatCount: 0,
    records: [],
  };
}

async function loadIndex() {
  return readJsonOrDefault(getIndexPath(), emptyIndex());
}

async function saveIndex(records) {
  const index = {
    generatedAt: new Date().toISOString(),
    version: INDEX_VERSION,
    chatCount: records.length,
    records,
  };
  await writeJsonAtomic(getIndexPath(), index);
  return index;
}

async function saveStats(records) {
  const statsData = aggregateStats(records);
  const stats = {
    generatedAt: new Date().toISOString(),
    indexVersion: INDEX_VERSION,
    ...statsData,
  };
  await writeJsonAtomic(getStatsPath(), stats);
  return stats;
}

// ---------------------------------------------------------------------------
// Full rebuild — scans all folders in outputDir and rewrites both JSON files.
//
// Deduplication: if the same chatId appears in multiple export folders
// (e.g. same chat exported twice), only the most recently exported version
// is kept (determined by folder name, which starts with YYYY-MM-DD_HH-MM-SS).
// ---------------------------------------------------------------------------

async function rebuildIndex(outputDir) {
  await ensureDir(outputDir);

  let entries = [];
  try {
    entries = await fs.readdir(outputDir, { withFileTypes: true });
  } catch {
    // outputDir does not exist or is unreadable — treat as empty.
  }

  // Sort folders by name descending so the newest export of each chat wins.
  const folders = entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(outputDir, e.name))
    .sort((a, b) => path.basename(b).localeCompare(path.basename(a)));

  // Map each folder, skip failures silently.
  const allRecords = [];
  for (const folderPath of folders) {
    const record = await mapFromFolder(folderPath);
    if (record) allRecords.push(record);
  }

  // Deduplicate by chatId — keep the first occurrence (newest export, due to sort above).
  const seen = new Set();
  const records = [];
  for (const r of allRecords) {
    if (!seen.has(r.chatId)) {
      seen.add(r.chatId);
      records.push(r);
    }
  }

  // Re-sort by createdAt ascending for a natural reading order.
  records.sort((a, b) => {
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const index = await saveIndex(records);
  const stats = await saveStats(records);

  printSummary(index, stats);
  return { index, stats };
}

// ---------------------------------------------------------------------------
// Incremental update — maps one export folder and merges it into the index.
//
// If the chatId already exists and the hash is unchanged, no write is done.
// If the hash changed, version is bumped and the record is replaced.
// If the chatId is new, the record is appended.
// ---------------------------------------------------------------------------

async function updateIndexWithFolder(folderPath) {
  const record = await mapFromFolder(folderPath);
  if (!record) return null;

  const index = await loadIndex();
  const existingIdx = index.records.findIndex((r) => r.chatId === record.chatId);

  if (existingIdx >= 0) {
    const existing = index.records[existingIdx];
    if (existing.hash === record.hash) {
      // Content unchanged — no update needed.
      return null;
    }
    // Content changed — bump version and replace.
    record.version = (existing.version || 1) + 1;
    index.records[existingIdx] = record;
  } else {
    index.records.push(record);
  }

  const savedIndex = await saveIndex(index.records);
  const stats = await saveStats(index.records);

  return { record, index: savedIndex, stats };
}

// ---------------------------------------------------------------------------
// Read stats (for IPC handler)
// ---------------------------------------------------------------------------

async function getStats() {
  return readJsonOrDefault(getStatsPath(), null);
}

// ---------------------------------------------------------------------------
// Console summary printed after each rebuild
// ---------------------------------------------------------------------------

function printSummary(index, stats) {
  const n = index.chatCount;
  const totalChars = stats.totals?.totalChars ?? 0;
  const avgPrompt = stats.averages?.charsPerUserPrompt ?? 0;
  const topDay = stats.peaks?.topDayByChats;

  console.log('\n--- Chat Archive Index Summary ---');
  console.log(`  Indexed chats  : ${n}`);
  console.log(`  Total chars    : ${totalChars.toLocaleString()}`);
  console.log(`  Avg prompt len : ${Math.round(avgPrompt)} chars`);
  console.log(`  Top active day : ${topDay ? `${topDay.date} (${topDay.count} chats)` : 'n/a'}`);
  console.log('----------------------------------\n');
}

module.exports = { rebuildIndex, updateIndexWithFolder, getStats, loadIndex };
