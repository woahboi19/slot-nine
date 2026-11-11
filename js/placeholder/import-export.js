const PlaceholderIO = (() => {
  function parseBulkText(rawText) {
    const raw = String(rawText || '').trim();
    if (!raw) {
      return { cards: [], error: 'Lütfen en az bir satır girin.' };
    }

    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const grouped = new Map();

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split('|').map(p => p.trim());
      if (parts.length < 4 || !parts[0] || !parts[1] || !parts[2] || !parts[3]) {
        return {
          cards: [],
          error: `${i + 1}. satır eksik. Format: Kart Adı | Set | Numara | Fiyat | Dil (ops.) | Baskı (ops.)`
        };
      }
      const [name, set, number, price, lang = 'EN', edition = ''] = parts;
      const key = name.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, { name, variants: [] });
      }
      grouped.get(key).variants.push({
        lang: lang.toUpperCase() || 'EN',
        set,
        number,
        price,
        edition
      });
    }

    const cards = Array.from(grouped.values()).map(sanitizeCard).filter(Boolean);
    return { cards, error: '' };
  }

  function parseFileContent(fileName, content) {
    const lowerName = String(fileName || '').toLowerCase();
    if (lowerName.endsWith('.json')) {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        return { error: 'Geçersiz JSON formatı.' };
      }
      const cards = parsed.map(c => sanitizeCard({ ...c, id: '' })).filter(Boolean);
      if (cards.length === 0) {
        return { error: 'Dosyada geçerli kart bulunamadı.' };
      }
      return { cards, mode: 'replace', error: '' };
    }

    if (lowerName.endsWith('.csv')) {
      const rows = parseCsvText(content);
      const byName = new Map();
      rows.forEach((parts, idx) => {
        const cells = parts.map(p => p.trim());
        const headerToken = cells[0]?.toLowerCase().replace(/[^a-z]/g, '');
        if (idx === 0 && (headerToken === 'name' || cells[0]?.toLowerCase() === 'ad')) return;
        if (cells.length < 4 || !cells[0]) return;
        const key = cells[0].toLowerCase();
        if (!byName.has(key)) byName.set(key, { name: cells[0], variants: [] });
        byName.get(key).variants.push({
          lang: cells[4] || 'EN',
          set: cells[1],
          number: cells[2],
          price: cells[3],
          edition: cells[5] || ''
        });
      });

      const cards = Array.from(byName.values()).map(c => sanitizeCard({ ...c, id: '' })).filter(Boolean);
      if (cards.length === 0) {
        return { error: 'CSV dosyasından geçerli satır okunamadı.' };
      }
      return { cards, mode: 'append', error: '' };
    }

    return { error: 'Desteklenmeyen dosya türü.' };
  }

  function copyShareableLink(cards) {
    if (cards.length === 0) {
      showToast('Paylaşmak için önce en az 1 kart ekleyin.');
      return;
    }
    try {
      const token = encodeCardsToHash(cards);
      const baseUrl = window.location.href.split('#')[0];
      const url = `${baseUrl}#list=${token}`;
      window.history.replaceState(null, '', `#list=${token}`);

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => showToast('Paylaşılabilir liste bağlantısı panoya kopyalandı.'))
          .catch(() => prompt('Bağlantıyı kopyalayın:', url));
      } else {
        prompt('Bağlantıyı kopyalayın:', url);
      }
    } catch {
      showToast('Bağlantı oluşturulamadı.');
    }
  }

  function consumeUrlHashCards(currentCardCount) {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#list=')) return null;
    try {
      const sharedCards = decodeCardsFromHash(hash.slice(6));
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      if (sharedCards.length > 0) {
        if (currentCardCount === 0 || confirm(`Bağlantıdaki ${sharedCards.length} kartlık liste yüklensin mi?`)) {
          return sharedCards;
        }
      }
    } catch (err) {
      console.error('Invalid share link:', err);
    }
    return null;
  }

  return {
    parseBulkText,
    parseFileContent,
    copyShareableLink,
    consumeUrlHashCards
  };
})();
