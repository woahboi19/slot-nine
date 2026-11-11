function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function createId(prefix = 'card') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanRarity(raw) {
  return String(raw || '').replace(/[^A-Za-z0-9 ]/g, '').trim();
}

function normalizeSpriteUrl(raw) {
  const val = String(raw || '').trim();
  if (/^#?\d{1,4}$/.test(val)) {
    const dex = parseInt(val.replace('#', ''), 10);
    return dex > 0 ? `${POKEAPI_SPRITE_BASE}/${dex}.png` : '';
  }
  return /^https?:\/\//i.test(val) ? val : '';
}

function sanitizeCard(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const cleanStr = v => String(v ?? '').trim();
  const name = cleanStr(raw.name);
  const variants = (Array.isArray(raw.variants) ? raw.variants : [])
    .map(v => ({
      lang: cleanStr(v?.lang).toUpperCase() || 'EN',
      set: cleanStr(v?.set),
      number: cleanStr(v?.number),
      price: cleanStr(v?.price),
      edition: cleanStr(v?.edition)
    }))
    .filter(v => v.set || v.number || v.price);

  if (!name || variants.length === 0) return null;

  return {
    id: cleanStr(raw.id) || createId('card'),
    name,
    subname: cleanStr(raw.subname),
    type: TYPE_LABELS[raw.type] ? raw.type : 'colorless',
    rarity: cleanRarity(raw.rarity),
    imageUrl: normalizeSpriteUrl(raw.imageUrl),
    note: cleanStr(raw.note),
    variants: variants.slice(0, MAX_VARIANTS)
  };
}
