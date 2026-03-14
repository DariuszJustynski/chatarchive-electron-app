const { formatLocalTimestamp } = require('../utils/time');
const { slugify } = require('../utils/sanitize');

function makeFolderName(title, now = new Date()) {
  const stamp = formatLocalTimestamp(now);
  const slug = slugify(title || 'chat', 'chat');
  return `${stamp}__${slug}`;
}

module.exports = {
  makeFolderName,
};
