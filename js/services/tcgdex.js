const TcgdexService = (() => {
  const API_BASE = 'https://api.tcgdex.net/v2/en/cards';

  function mapRarity(rawRarity) {
    if (!rawRarity) return '';
    const r = rawRarity.toLowerCase();
    if (r.includes('special illustration')) return 'Special Illustration Rare';
    if (r.includes('illustration')) return 'Illustration Rare';
    if (r.includes('hyper')) return 'Hyper Rare';
    if (r.includes('double')) return 'Double Rare';
    if (r.includes('ultra') || r.includes('super') || r.includes('full art')) return 'Ultra Rare';
    if (r.includes('secret')) return 'Secret Rare';
    if (r.includes('promo')) return 'Promo';
    if (r.includes('uncommon')) return 'Uncommon';
    if (r.includes('common')) return 'Common';
    if (r.includes('rare')) return 'Rare';
    return '';
  }

  async function searchByName(query, { signal, preferWithImage = false, limit = 18 } = {}) {
    const res = await fetch(`${API_BASE}?name=${encodeURIComponent(query)}`, { signal });
    if (!res.ok) throw new Error('TCGdex search request failed');
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return [];

    let pool = list;
    if (preferWithImage) {
      const withImages = list.filter(item => item.image);
      if (withImages.length > 0) pool = withImages;
    }

    return pool.slice(-limit).reverse().map(item => ({
      id: item.id || '',
      name: item.name || '',
      localId: item.localId || '',
      thumbUrl: item.image ? `${item.image}/low.webp` : ''
    }));
  }

  async function fetchCardDetails(cardApiId) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(cardApiId)}`);
    if (!res.ok) throw new Error('TCGdex detail request failed');
    const detail = await res.json();

    const dexNum = Array.isArray(detail.dexId) && detail.dexId.length > 0 ? detail.dexId[0] : null;
    let typeKey = 'colorless';
    if (detail.category === 'Trainer') {
      typeKey = 'trainer';
    } else if (Array.isArray(detail.types) && detail.types.length > 0) {
      const candidate = String(detail.types[0]).toLowerCase();
      if (TYPE_LABELS[candidate]) typeKey = candidate;
    }

    const setName = detail.set?.name || '';
    const officialCount = detail.set?.cardCount?.official;
    const localId = detail.localId || '';
    const formattedNumber = localId && officialCount
      ? `${localId}/${String(officialCount).padStart(3, '0')}`
      : localId;

    return {
      name: detail.name || '',
      category: detail.category || 'Pokemon',
      dexNum,
      rawRarity: detail.rarity || '',
      mappedRarity: mapRarity(detail.rarity),
      typeKey,
      setName,
      formattedNumber,
      lowResArtUrl: detail.image ? `${detail.image}/low.webp` : ''
    };
  }

  return {
    mapRarity,
    searchByName,
    fetchCardDetails
  };
})();
