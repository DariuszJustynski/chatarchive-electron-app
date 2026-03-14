'use strict';

// ---------------------------------------------------------------------------
// statsAggregator.js — computes global statistics from all ChatIndexRecords.
//
// Input:  ChatIndexRecord[] (from chat-index.json)
// Output: ChatStatsReport object (saved to chat-stats.json)
// ---------------------------------------------------------------------------

const { safeAverage, toPercent } = require('../utils/textMetrics');
const { toISODate, getISOWeek, getMonthKey } = require('../utils/dateUtils');

// ---------------------------------------------------------------------------
// Timeline helpers
// ---------------------------------------------------------------------------

// Accumulate one chat record into a timeline bucket map.
function accumulateBucket(map, key, record) {
  if (!key) return; // skip records with no valid date key
  if (!map[key]) {
    map[key] = { chatCount: 0, messageCount: 0, userChars: 0, assistantChars: 0, totalChars: 0 };
  }
  map[key].chatCount += 1;
  map[key].messageCount += record.messageCount || 0;
  map[key].userChars += record.userChars || 0;
  map[key].assistantChars += record.assistantChars || 0;
  map[key].totalChars += record.totalChars || 0;
}

// Build daily timeline sorted chronologically.
function buildDailyTimeline(records) {
  const map = {};
  for (const r of records) {
    accumulateBucket(map, toISODate(r.createdAt), r);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));
}

// Build weekly timeline ("YYYY-WNN") sorted chronologically.
function buildWeeklyTimeline(records) {
  const map = {};
  for (const r of records) {
    accumulateBucket(map, getISOWeek(r.createdAt), r);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({ week, ...data }));
}

// Build monthly timeline ("YYYY-MM") sorted chronologically.
function buildMonthlyTimeline(records) {
  const map = {};
  for (const r of records) {
    accumulateBucket(map, getMonthKey(r.createdAt), r);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

// ---------------------------------------------------------------------------
// Peak detection
// ---------------------------------------------------------------------------

function findPeaks(records, timelines) {
  // Top day by number of chats created.
  let topDayByChats = null;
  for (const entry of timelines.daily) {
    if (!topDayByChats || entry.chatCount > topDayByChats.count) {
      topDayByChats = { date: entry.date, count: entry.chatCount };
    }
  }

  // Top day by total characters generated.
  let topDayByTotalChars = null;
  for (const entry of timelines.daily) {
    if (!topDayByTotalChars || entry.totalChars > topDayByTotalChars.totalChars) {
      topDayByTotalChars = { date: entry.date, totalChars: entry.totalChars };
    }
  }

  // Longest chat by character count.
  let longestChatByChars = null;
  for (const r of records) {
    if (!longestChatByChars || (r.totalChars || 0) > (longestChatByChars.totalChars || 0)) {
      longestChatByChars = { chatId: r.chatId, title: r.title, totalChars: r.totalChars || 0 };
    }
  }

  // Longest chat by message count.
  let longestChatByMessages = null;
  for (const r of records) {
    if (!longestChatByMessages || (r.messageCount || 0) > (longestChatByMessages.messageCount || 0)) {
      longestChatByMessages = { chatId: r.chatId, title: r.title, messageCount: r.messageCount || 0 };
    }
  }

  return { topDayByChats, topDayByTotalChars, longestChatByChars, longestChatByMessages };
}

// ---------------------------------------------------------------------------
// Main aggregation function
// ---------------------------------------------------------------------------

function aggregateStats(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return emptyStats();
  }

  // Accumulate totals.
  const totals = {
    messageCount: 0,
    userMessageCount: 0,
    assistantMessageCount: 0,
    otherMessageCount: 0,
    userChars: 0,
    assistantChars: 0,
    otherChars: 0,
    totalChars: 0,
    userWordsApprox: 0,
    assistantWordsApprox: 0,
    totalWordsApprox: 0,
  };

  let totalDurationMinutes = 0;
  let durationCount = 0;

  for (const r of records) {
    totals.messageCount += r.messageCount || 0;
    totals.userMessageCount += r.userMessageCount || 0;
    totals.assistantMessageCount += r.assistantMessageCount || 0;
    totals.otherMessageCount += r.otherMessageCount || 0;
    totals.userChars += r.userChars || 0;
    totals.assistantChars += r.assistantChars || 0;
    totals.otherChars += r.otherChars || 0;
    totals.totalChars += r.totalChars || 0;
    totals.userWordsApprox += r.userWordsApprox || 0;
    totals.assistantWordsApprox += r.assistantWordsApprox || 0;
    totals.totalWordsApprox += r.totalWordsApprox || 0;
    if (r.durationMinutes != null) {
      totalDurationMinutes += r.durationMinutes;
      durationCount += 1;
    }
  }

  const chatCount = records.length;

  // Build timelines.
  const daily = buildDailyTimeline(records);
  const weekly = buildWeeklyTimeline(records);
  const monthly = buildMonthlyTimeline(records);
  const timelines = { daily, weekly, monthly };

  // Compute per-period chat rates from the number of distinct buckets.
  // This gives "average chats per active day/week/month" rather than calendar span.
  const dayBuckets = daily.length || 1;
  const weekBuckets = weekly.length || 1;
  const monthBuckets = monthly.length || 1;

  const round2 = (n) => Math.round(n * 100) / 100;

  const averages = {
    messagesPerChat: round2(safeAverage(totals.messageCount, chatCount)),
    userMessagesPerChat: round2(safeAverage(totals.userMessageCount, chatCount)),
    assistantMessagesPerChat: round2(safeAverage(totals.assistantMessageCount, chatCount)),
    charsPerChat: round2(safeAverage(totals.totalChars, chatCount)),
    charsPerUserPrompt: round2(safeAverage(totals.userChars, totals.userMessageCount)),
    charsPerAssistantReply: round2(safeAverage(totals.assistantChars, totals.assistantMessageCount)),
    chatsPerDay: round2(chatCount / dayBuckets),
    chatsPerWeek: round2(chatCount / weekBuckets),
    chatsPerMonth: round2(chatCount / monthBuckets),
    chatDurationMinutes: round2(safeAverage(totalDurationMinutes, durationCount)),
  };

  const ratios = {
    userSharePercent: round2(toPercent(totals.userChars, totals.totalChars)),
    assistantSharePercent: round2(toPercent(totals.assistantChars, totals.totalChars)),
  };

  const peaks = findPeaks(records, timelines);

  return { chatCount, totals, averages, ratios, peaks, timelines };
}

// ---------------------------------------------------------------------------
// Empty stats shape (returned when there are no records)
// ---------------------------------------------------------------------------

function emptyStats() {
  return {
    chatCount: 0,
    totals: {
      messageCount: 0,
      userMessageCount: 0,
      assistantMessageCount: 0,
      otherMessageCount: 0,
      userChars: 0,
      assistantChars: 0,
      otherChars: 0,
      totalChars: 0,
      userWordsApprox: 0,
      assistantWordsApprox: 0,
      totalWordsApprox: 0,
    },
    averages: {
      messagesPerChat: 0,
      userMessagesPerChat: 0,
      assistantMessagesPerChat: 0,
      charsPerChat: 0,
      charsPerUserPrompt: 0,
      charsPerAssistantReply: 0,
      chatsPerDay: 0,
      chatsPerWeek: 0,
      chatsPerMonth: 0,
      chatDurationMinutes: 0,
    },
    ratios: { userSharePercent: 0, assistantSharePercent: 0 },
    peaks: {
      topDayByChats: null,
      topDayByTotalChars: null,
      longestChatByChars: null,
      longestChatByMessages: null,
    },
    timelines: { daily: [], weekly: [], monthly: [] },
  };
}

module.exports = {
  aggregateStats,
  buildDailyTimeline,
  buildWeeklyTimeline,
  buildMonthlyTimeline,
  findPeaks,
};
