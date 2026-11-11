function encodeCardsToHash(cardList) {
  const compact = cardList.map(c => ({
    n: c.name,
    s: c.subname || undefined,
    t: c.type !== 'colorless' ? c.type : undefined,
    r: c.rarity || undefined,
    i: c.imageUrl || undefined,
    o: c.note || undefined,
    v: (c.variants || []).map(v => [v.lang, v.set, v.number, v.price, v.edition || ''])
  }));
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeCardsFromHash(token) {
  const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base64);
  const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
  const compact = JSON.parse(new TextDecoder().decode(bytes));
  if (!Array.isArray(compact)) return [];

  return compact.map(item => sanitizeCard({
    name: item.n,
    subname: item.s || '',
    type: item.t || 'colorless',
    rarity: item.r || '',
    imageUrl: item.i || '',
    note: item.o || '',
    variants: Array.isArray(item.v) ? item.v.map(arr => ({
      lang: arr[0],
      set: arr[1],
      number: arr[2],
      price: arr[3],
      edition: arr[4] || ''
    })) : []
  })).filter(Boolean);
}
