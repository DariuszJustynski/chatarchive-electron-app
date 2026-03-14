function pad(value) {
  return String(value).padStart(2, '0');
}

function formatLocalTimestamp(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

module.exports = {
  formatLocalTimestamp,
};
