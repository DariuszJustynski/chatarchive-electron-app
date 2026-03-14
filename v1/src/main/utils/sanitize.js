function slugify(value, fallback = 'chat') {
  const source = String(value || '').toLowerCase().trim();
  const normalized = source
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-_]/g, ' ')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const cleaned = normalized || fallback;
  return cleaned.slice(0, 80);
}

module.exports = {
  slugify,
};
