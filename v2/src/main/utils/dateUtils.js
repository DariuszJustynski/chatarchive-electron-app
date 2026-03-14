'use strict';

// Returns "YYYY-MM-DD" from a Date, ISO string, or timestamp number.
// Returns null if the value is not a valid date.
function toISODate(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

// Returns ISO week key "YYYY-WNN" (e.g. "2026-W10").
// Uses the Thursday-rule for ISO 8601 week numbering.
function getISOWeek(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    // Shift to nearest Thursday (ISO weeks start on Monday, Thursday defines the year)
    const thursday = new Date(d);
    thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
    const yearStart = new Date(thursday.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
    return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

// Returns "YYYY-MM" from a Date or ISO string.
function getMonthKey(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 7);
  } catch {
    return null;
  }
}

// Returns difference in whole seconds between two date values (b - a).
// Returns null if either value is not a valid date.
function diffInSeconds(a, b) {
  try {
    const ta = new Date(a).getTime();
    const tb = new Date(b).getTime();
    if (isNaN(ta) || isNaN(tb)) return null;
    return Math.round((tb - ta) / 1000);
  } catch {
    return null;
  }
}

// Returns true if the value can be parsed as a valid date.
function isValidDate(value) {
  if (!value) return false;
  return !isNaN(new Date(value).getTime());
}

module.exports = { toISODate, getISOWeek, getMonthKey, diffInSeconds, isValidDate };
