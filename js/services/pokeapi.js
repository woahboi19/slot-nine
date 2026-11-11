const PokeApiService = (() => {
  const spriteCache = new Map();
  const ENDPOINT = 'https://pokeapi.co/api/v2/pokemon';

  function extractSlug(cardName) {
    return String(cardName || '')
      .trim()
      .replace(/\s+with\s+.*/i, '')
      .replace(/^(?:[A-Za-z]+'s|Dark|Light|Shining|Radiant|Origin Forme|Alolan|Galarian|Hisuian|Paldean)\s+/i, '')
      .replace(/\s+(?:ex|EX|GX|V|VMAX|VSTAR|V-UNION|LV\.X|Prime|BREAK|Star|δ|Delta Species)\b.*/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
  }

  async function resolvePokemon(cardName, subname = '') {
    const dexMatch = String(subname || '').match(/#0*(\d{1,4})\b/);
    if (dexMatch) {
      const dex = Number(dexMatch[1]);
      return { url: `${POKEAPI_SPRITE_BASE}/${dex}.png`, dex };
    }

    const slug = extractSlug(cardName);
    if (!slug || slug.length < 3) {
      return { url: '', dex: null };
    }

    if (spriteCache.has(slug)) {
      return spriteCache.get(slug);
    }

    try {
      const res = await fetch(`${ENDPOINT}/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        const empty = { url: '', dex: null };
        spriteCache.set(slug, empty);
        return empty;
      }
      const data = await res.json();
      if (data?.id) {
        const result = {
          url: data.sprites?.front_default || `${POKEAPI_SPRITE_BASE}/${data.id}.png`,
          dex: data.id
        };
        spriteCache.set(slug, result);
        return result;
      }
    } catch {
      // Offline or unreachable
    }
    return { url: '', dex: null };
  }

  return {
    extractSlug,
    resolvePokemon
  };
})();
