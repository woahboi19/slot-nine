const AppStorage = (() => {
  let storageWarned = false;

  function warnOnce() {
    if (storageWarned) return;
    storageWarned = true;
    if (typeof showToast === 'function') {
      showToast('Tarayıcı depolaması kullanılamıyor; yedek için JSON indirin.');
    }
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error(`Storage read error (${key}):`, err);
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      warnOnce();
      return false;
    }
  }

  function loadCards() {
    const parsed = readJson(STORAGE_KEYS.cards);
    if (Array.isArray(parsed)) {
      return parsed.map(sanitizeCard).filter(Boolean);
    }
    const defaults = SAMPLE_CARDS.map(sanitizeCard).filter(Boolean);
    writeJson(STORAGE_KEYS.cards, defaults);
    return defaults;
  }

  function saveCards(cards) {
    writeJson(STORAGE_KEYS.cards, cards);
  }

  function loadPlaceholderSettings() {
    const defaults = {
      gapMode: 'zero',
      themeMode: 'color',
      qrProvider: 'none',
      cropMarks: true,
      fillEmptySlots: false
    };
    const parsed = readJson(STORAGE_KEYS.settings);
    if (!parsed || typeof parsed !== 'object') return defaults;

    const merged = { ...defaults, ...parsed };
    if (!['zero', 'small', 'medium'].includes(merged.gapMode)) merged.gapMode = 'zero';
    if (!['color', 'minimal'].includes(merged.themeMode)) merged.themeMode = 'color';
    if (!['none', 'cardmarket', 'pricecharting', 'tcgplayer'].includes(merged.qrProvider)) {
      merged.qrProvider = 'none';
    }
    merged.cropMarks = Boolean(merged.cropMarks);
    merged.fillEmptySlots = Boolean(merged.fillEmptySlots);
    return merged;
  }

  function savePlaceholderSettings(settings) {
    writeJson(STORAGE_KEYS.settings, settings);
  }

  function loadArtSettings() {
    const parsed = readJson(STORAGE_KEYS.artSettings);
    if (!parsed || typeof parsed !== 'object') {
      return {
        colGap: 4,
        rowGap: 5,
        notchDepth: 63,
        showNotchGuides: true,
        showPocketFold: true
      };
    }
    return {
      colGap: clamp(Number(parsed.colGap ?? 4), 0, 12),
      rowGap: clamp(Number(parsed.rowGap ?? 5), 0, 12),
      notchDepth: clamp(Number(parsed.notchDepth ?? 63), 20, 63),
      showNotchGuides: Boolean(parsed.showNotchGuides ?? true),
      showPocketFold: Boolean(parsed.showPocketFold ?? true)
    };
  }

  function saveArtSettings(settings) {
    writeJson(STORAGE_KEYS.artSettings, settings);
  }

  function loadArtQueue() {
    try {
      const sessionRaw = sessionStorage.getItem(STORAGE_KEYS.artQueue);
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => createArtPiece(item));
        }
      }
    } catch {
      // Ignore sessionStorage errors
    }

    const saved = readJson(STORAGE_KEYS.artQueue);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map(item => createArtPiece(item));
    }
    return [createArtPiece()];
  }

  function saveArtQueue(items) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.artQueue, JSON.stringify(items));
    } catch {
      // Large data URLs may exceed quota; keep in memory if so
    }
    try {
      localStorage.setItem(STORAGE_KEYS.artQueue, JSON.stringify(items));
    } catch {
      // Avoid noisy warnings for large temporary image queues
    }
  }

  function loadBinders() {
    const parsed = readJson(STORAGE_KEYS.binders);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const defaults = createDefaultBinders();
    writeJson(STORAGE_KEYS.binders, defaults);
    return defaults;
  }

  function saveBinders(binders) {
    writeJson(STORAGE_KEYS.binders, binders);
  }

  function setFlashToast(message) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.flashToast, message);
    } catch {
      // Ignore
    }
  }

  function popFlashToast() {
    try {
      const msg = sessionStorage.getItem(STORAGE_KEYS.flashToast);
      if (msg) sessionStorage.removeItem(STORAGE_KEYS.flashToast);
      return msg || '';
    } catch {
      return '';
    }
  }

  return {
    loadCards,
    saveCards,
    loadPlaceholderSettings,
    savePlaceholderSettings,
    loadArtSettings,
    saveArtSettings,
    loadArtQueue,
    saveArtQueue,
    loadBinders,
    saveBinders,
    setFlashToast,
    popFlashToast
  };
})();
