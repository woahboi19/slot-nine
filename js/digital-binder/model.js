const BinderModel = (() => {
  function getGridSpec(binder) {
    const preset = BINDER_GRID_PRESETS[binder?.gridSize] || BINDER_GRID_PRESETS['3x3'];
    return {
      cols: preset.cols,
      rows: preset.rows,
      totalSlots: preset.cols * preset.rows
    };
  }

  function getItemBounds(item, cols, rows) {
    const colSpan = clamp(Number(item.colSpan) || 1, 1, cols);
    const rowSpan = clamp(Number(item.rowSpan) || 1, 1, rows);
    const maxSlot = cols * rows - 1;
    const idx = clamp(Number(item.slotIndex) || 0, 0, maxSlot);
    const startCol = clamp(idx % cols, 0, cols - colSpan);
    const startRow = clamp(Math.floor(idx / cols), 0, rows - rowSpan);
    return {
      startCol,
      startRow,
      colSpan,
      rowSpan,
      originIndex: startRow * cols + startCol
    };
  }

  function buildPageOccupancy(page, cols, rows) {
    const cellMap = new Map();
    const items = Array.isArray(page?.items) ? page.items : [];
    items.forEach(item => {
      const b = getItemBounds(item, cols, rows);
      item.slotIndex = b.originIndex;
      item.colSpan = b.colSpan;
      item.rowSpan = b.rowSpan;
      for (let r = b.startRow; r < b.startRow + b.rowSpan; r++) {
        for (let c = b.startCol; c < b.startCol + b.colSpan; c++) {
          cellMap.set(r * cols + c, {
            item,
            isOrigin: r === b.startRow && c === b.startCol,
            bounds: b
          });
        }
      }
    });
    return cellMap;
  }

  function placeItemInPage(page, newItem, cols, rows) {
    const b = getItemBounds(newItem, cols, rows);
    newItem.slotIndex = b.originIndex;
    newItem.colSpan = b.colSpan;
    newItem.rowSpan = b.rowSpan;

    const targetCells = new Set();
    for (let r = b.startRow; r < b.startRow + b.rowSpan; r++) {
      for (let c = b.startCol; c < b.startCol + b.colSpan; c++) {
        targetCells.add(r * cols + c);
      }
    }

    page.items = (page.items || []).filter(existing => {
      if (existing.id === newItem.id) return false;
      const eb = getItemBounds(existing, cols, rows);
      for (let r = eb.startRow; r < eb.startRow + eb.rowSpan; r++) {
        for (let c = eb.startCol; c < eb.startCol + eb.colSpan; c++) {
          if (targetCells.has(r * cols + c)) return false;
        }
      }
      return true;
    });

    page.items.push(newItem);
  }

  function swapOrMovePocketItem(binder, src, targetPageId, targetSlotIndex) {
    if (src.pageId === targetPageId && src.slotIndex === targetSlotIndex) return false;

    const spec = getGridSpec(binder);
    const srcPage = binder.pages.find(p => p.id === src.pageId);
    const dstPage = binder.pages.find(p => p.id === targetPageId);
    if (!srcPage || !dstPage) return false;

    const srcItemIdx = (srcPage.items || []).findIndex(it => it.id === src.itemId);
    if (srcItemIdx === -1) return false;
    const movingItem = srcPage.items[srcItemIdx];

    const dstMap = buildPageOccupancy(dstPage, spec.cols, spec.rows);
    const dstHit = dstMap.get(targetSlotIndex);

    if (dstHit && dstHit.item.kind === 'card' && dstHit.item.id !== movingItem.id) {
      const targetCard = dstHit.item;
      if (srcPage.id === dstPage.id) {
        targetCard.slotIndex = src.slotIndex;
        movingItem.slotIndex = targetSlotIndex;
      } else {
        srcPage.items.splice(srcItemIdx, 1);
        const dstIdx = dstPage.items.findIndex(it => it.id === targetCard.id);
        if (dstIdx !== -1) dstPage.items.splice(dstIdx, 1);
        targetCard.slotIndex = src.slotIndex;
        movingItem.slotIndex = targetSlotIndex;
        srcPage.items.push(targetCard);
        dstPage.items.push(movingItem);
      }
      return true;
    }

    if (!dstHit) {
      srcPage.items.splice(srcItemIdx, 1);
      movingItem.slotIndex = targetSlotIndex;
      dstPage.items.push(movingItem);
      return true;
    }

    return false;
  }

  function computeBinderStats(binder) {
    let totalCards = 0;
    let ownedCards = 0;
    let missingCards = 0;
    let totalArt = 0;

    binder.pages.forEach(p => {
      (p.items || []).forEach(it => {
        if (it.kind === 'card') {
          totalCards++;
          if (it.owned === false) missingCards++;
          else ownedCards++;
        } else if (it.kind === 'art') {
          totalArt++;
        }
      });
    });

    return { totalCards, ownedCards, missingCards, totalArt };
  }

  function extractMissingCardsForPlaceholder(binder) {
    const cards = [];
    binder.pages.forEach((p, pIdx) => {
      (p.items || []).forEach(it => {
        if (it.kind !== 'card' || it.owned !== false) return;
        const rawLangParts = String(it.lang || 'EN').split('·').map(s => s.trim());
        const langCode = (rawLangParts[0] || 'EN').toUpperCase();
        const edition = rawLangParts[1] || '';

        const card = sanitizeCard({
          name: it.name,
          subname: `${binder.name} · Sayfa ${pIdx + 1}`,
          type: it.type || 'colorless',
          rarity: it.rarity || '',
          imageUrl: it.spriteUrl || '',
          note: `Cep #${(it.slotIndex || 0) + 1}`,
          variants: [
            {
              lang: langCode,
              set: it.set || 'Pokémon TCG',
              number: it.number || '-',
              price: it.price || '-',
              edition
            }
          ]
        });

        if (card) cards.push(card);
      });
    });
    return cards;
  }

  function extractPageArtForPrint(binder, pageIndex, viewMode) {
    const visiblePages = viewMode === 'spread'
      ? [binder.pages[pageIndex], binder.pages[pageIndex + 1]].filter(Boolean)
      : [binder.pages[pageIndex]].filter(Boolean);

    const artPieces = [];
    visiblePages.forEach(p => {
      (p.items || []).forEach(it => {
        if (it.kind !== 'art') return;
        const tplKey = ART_TEMPLATES[it.tpl] ? it.tpl : '2x1';
        artPieces.push(createArtPiece({
          title: it.title || p.title || 'Binder Art',
          imageSrc: it.imageSrc,
          aspectRatio: it.aspectRatio,
          tpl: tplKey,
          cutMode: it.tpl === '1x1' ? 'split' : 'bridge',
          zoom: it.zoom || 100,
          panX: it.panX ?? 0.5,
          panY: it.panY ?? 0.5,
          caption: it.caption || ''
        }));
      });
    });
    return artPieces;
  }

  return {
    getGridSpec,
    getItemBounds,
    buildPageOccupancy,
    placeItemInPage,
    swapOrMovePocketItem,
    computeBinderStats,
    extractMissingCardsForPlaceholder,
    extractPageArtForPrint
  };
})();
