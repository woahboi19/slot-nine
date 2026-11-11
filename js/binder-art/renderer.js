const BinderArtRenderer = (() => {
  function renderQueueList({ containerEl, countEl, items, activeId }) {
    countEl.textContent = items.length;
    const fragment = document.createDocumentFragment();

    items.forEach((item, idx) => {
      const row = document.createElement('div');
      const isActive = item.id === activeId;
      row.className = `sidebar-card-item${isActive ? ' editing' : ''}`;
      row.dataset.artId = item.id;

      const tplInfo = ART_TEMPLATES[item.tpl] || ART_TEMPLATES['2x1'];
      const modeLabel = item.cutMode === 'split' ? 'Ayrı kartlar' : 'Tek parça köprü';

      row.innerHTML = `
        <div class="sidebar-card-info" data-art-action="select" title="Düzenlemek için tıklayın">
          <div class="sidebar-card-title">#${idx + 1} · ${escapeHtml(item.title || 'Görsel')}</div>
          <div class="sidebar-card-meta">${escapeHtml(tplInfo.title)} · ${modeLabel}${item.caption ? ` · "${escapeHtml(item.caption)}"` : ''}</div>
        </div>
        <div class="sidebar-card-actions">
          <button type="button" class="icon-btn" data-art-action="dup" title="Bu parçayı çoğalt">Kopya</button>
          <button type="button" class="icon-btn danger" data-art-action="del" title="Sil">Sil</button>
        </div>
      `;
      fragment.appendChild(row);
    });

    containerEl.replaceChildren(fragment);
  }

  function createBridgePieceElement(piece, settings, isSelected) {
    const geo = computeArtGeometry(piece, settings);
    const { cols, rows, colGap, rowGap, spanW, spanH, imgW, imgH, offsetX, offsetY } = geo;
    const { notchDepth, showNotchGuides, showPocketFold } = settings;

    const wrap = document.createElement('div');
    wrap.className = `art-bridge-piece interactive-pan${isSelected ? ' is-selected' : ''}`;
    wrap.dataset.artId = piece.id;
    wrap.style.width = `${spanW}mm`;
    wrap.style.height = `${spanH}mm`;
    wrap.title = 'Kadrajı kaydırmak için fareyle sürükleyin';

    const img = document.createElement('img');
    img.className = 'art-piece-img';
    img.src = piece.imageSrc;
    img.alt = piece.title || 'Binder Art';
    img.style.width = `${imgW}mm`;
    img.style.height = `${imgH}mm`;
    img.style.transform = `translate(${offsetX}mm, ${offsetY}mm)`;
    wrap.appendChild(img);

    if (showPocketFold) {
      for (let c = 1; c < cols; c++) {
        const guide = document.createElement('div');
        guide.className = 'art-pocket-guide';
        guide.style.left = `${c * SLOT_WIDTH_MM + (c - 1) * colGap}mm`;
        guide.style.width = `${colGap}mm`;
        wrap.appendChild(guide);
      }
      for (let r = 1; r < rows; r++) {
        const guideRow = document.createElement('div');
        guideRow.className = 'art-pocket-guide-row';
        guideRow.style.top = `${r * SLOT_HEIGHT_MM + (r - 1) * rowGap}mm`;
        guideRow.style.height = `${rowGap}mm`;
        wrap.appendChild(guideRow);
      }
    }

    if (rows > 1 && showNotchGuides) {
      const depth = clamp(notchDepth, 20, SLOT_WIDTH_MM);
      const notchH = Math.max(2.2, rowGap);
      for (let r = 1; r < rows; r++) {
        const seamCenter = r * SLOT_HEIGHT_MM + (r - 1) * rowGap + rowGap / 2;
        const topMm = seamCenter - notchH / 2;

        const leftNotch = document.createElement('div');
        leftNotch.className = 'art-notch-cutout left-notch';
        leftNotch.style.top = `${topMm}mm`;
        leftNotch.style.width = `${depth}mm`;
        leftNotch.style.height = `${notchH}mm`;
        leftNotch.textContent = `✂ Çentik (${depth} mm)`;

        const rightNotch = document.createElement('div');
        rightNotch.className = 'art-notch-cutout right-notch';
        rightNotch.style.top = `${topMm}mm`;
        rightNotch.style.width = `${depth}mm`;
        rightNotch.style.height = `${notchH}mm`;
        rightNotch.textContent = `✂ Çentik (${depth} mm)`;

        wrap.appendChild(leftNotch);
        wrap.appendChild(rightNotch);
      }
    }

    if (piece.caption && piece.caption.trim()) {
      const badge = document.createElement('div');
      badge.className = `art-caption-badge pos-${piece.captionPos || 'bottom-right'}`;
      badge.textContent = piece.caption.trim();
      wrap.appendChild(badge);
    }

    return wrap;
  }

  function createSplitTileElements(piece, settings) {
    const geo = computeArtGeometry(piece, settings);
    const { cols, rows, colGap, rowGap, imgW, imgH, offsetX, offsetY } = geo;
    const tiles = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = document.createElement('div');
        tile.className = 'art-split-tile art-bridge-piece interactive-pan';
        tile.dataset.artId = piece.id;
        tile.dataset.tileR = String(r);
        tile.dataset.tileC = String(c);
        tile.title = `${piece.title} — Satır ${r + 1}, Sütun ${c + 1} (Sürükleyerek kaydırın)`;

        const slotOriginX = c * (SLOT_WIDTH_MM + colGap);
        const slotOriginY = r * (SLOT_HEIGHT_MM + rowGap);

        const img = document.createElement('img');
        img.className = 'art-piece-img';
        img.src = piece.imageSrc;
        img.alt = '';
        img.style.width = `${imgW}mm`;
        img.style.height = `${imgH}mm`;
        img.style.transform = `translate(${offsetX - slotOriginX}mm, ${offsetY - slotOriginY}mm)`;
        tile.appendChild(img);

        const isCaptionTile =
          (piece.captionPos === 'top-left' && r === 0 && c === 0) ||
          (piece.captionPos === 'bottom-left' && r === rows - 1 && c === 0) ||
          (piece.captionPos === 'bottom-center' && r === rows - 1 && c === Math.floor(cols / 2)) ||
          ((!piece.captionPos || piece.captionPos === 'bottom-right') && r === rows - 1 && c === cols - 1);

        if (piece.caption && piece.caption.trim() && isCaptionTile) {
          const badge = document.createElement('div');
          badge.className = `art-caption-badge pos-${piece.captionPos || 'bottom-right'}`;
          badge.textContent = piece.caption.trim();
          tile.appendChild(badge);
        }

        tiles.push(tile);
      }
    }
    return tiles;
  }

  function renderA4Pages({ containerEl, items, activeId, settings }) {
    containerEl.classList.add('show-crop-marks');

    const pages = [];
    let currentBridgeSheet = [];
    let currentBridgeHeight = 0;
    const splitTilesPool = [];

    items.forEach(piece => {
      if (piece.cutMode === 'split') {
        splitTilesPool.push(...createSplitTileElements(piece, settings));
        return;
      }

      const geo = computeArtGeometry(piece, settings);
      const pieceH = geo.spanH;
      const neededGap = currentBridgeSheet.length > 0 ? 4 : 0;

      if (currentBridgeSheet.length > 0 && currentBridgeHeight + neededGap + pieceH > MAX_A4_STACK_MM) {
        pages.push({ type: 'bridge', items: currentBridgeSheet });
        currentBridgeSheet = [piece];
        currentBridgeHeight = pieceH;
      } else {
        currentBridgeSheet.push(piece);
        currentBridgeHeight += neededGap + pieceH;
      }
    });

    if (currentBridgeSheet.length > 0) {
      pages.push({ type: 'bridge', items: currentBridgeSheet });
    }

    for (let i = 0; i < splitTilesPool.length; i += CARDS_PER_PAGE) {
      pages.push({ type: 'split', tiles: splitTilesPool.slice(i, i + CARDS_PER_PAGE) });
    }

    const totalPages = Math.max(1, pages.length);
    const fragment = document.createDocumentFragment();

    pages.forEach((pageData, pageIdx) => {
      const sheet = document.createElement('div');
      sheet.className = 'a4-sheet';

      if (pageData.type === 'bridge') {
        const tplSummary = pageData.items
          .map(p => `${ART_TEMPLATES[p.tpl]?.title || p.tpl}`)
          .join(' + ');

        sheet.innerHTML = `
          <div class="a4-sheet-header">
            <span>SlotNine · Binder Art (${escapeHtml(tplSummary)}) · Cep arası: ${settings.colGap}mm / ${settings.rowGap}mm</span>
            <span>Sayfa ${pageIdx + 1} / ${totalPages}</span>
          </div>
          <div class="a4-art-stack"></div>
          <div class="a4-sheet-footer">
            <span>Ölçek %100 (Gerçek Boyut) · ✂ işaretli yan çentikleri kesip orta köprüyü tek parça bırakın</span>
            <span>A4 · Köprü / Yatay H</span>
          </div>
        `;

        const stack = sheet.querySelector('.a4-art-stack');
        pageData.items.forEach(piece => {
          const isSelected = items.length > 1 && piece.id === activeId;
          stack.appendChild(createBridgePieceElement(piece, settings, isSelected));
        });
      } else {
        sheet.innerHTML = `
          <div class="a4-sheet-header">
            <span>SlotNine · Binder Art (Ayrı 63 × 88 mm Kartlara Bölünmüş)</span>
            <span>Sayfa ${pageIdx + 1} / ${totalPages}</span>
          </div>
          <div class="tcg-grid gap-small"></div>
          <div class="a4-sheet-footer">
            <span>Ölçek %100 (Gerçek Boyut) · Dikiş payı (${settings.colGap}mm / ${settings.rowGap}mm) hesaba katılmıştır</span>
            <span>A4 · Parçalı Grid</span>
          </div>
        `;

        const grid = sheet.querySelector('.tcg-grid');
        for (let slot = 0; slot < CARDS_PER_PAGE; slot++) {
          if (pageData.tiles[slot]) {
            grid.appendChild(pageData.tiles[slot]);
          } else {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'tcg-card empty-slot invisible-slot';
            grid.appendChild(emptyEl);
          }
        }
      }

      fragment.appendChild(sheet);
    });

    containerEl.replaceChildren(fragment);
  }

  function updatePieceTransform(containerEl, piece, settings) {
    const geo = computeArtGeometry(piece, settings);
    const { colGap, rowGap, imgW, imgH, offsetX, offsetY } = geo;

    containerEl.querySelectorAll('.art-bridge-piece[data-art-id]').forEach(el => {
      if (el.dataset.artId !== piece.id) return;
      const img = el.querySelector('.art-piece-img');
      if (!img) return;
      img.style.width = `${imgW}mm`;
      img.style.height = `${imgH}mm`;

      if (el.classList.contains('art-split-tile')) {
        const r = Number(el.dataset.tileR) || 0;
        const c = Number(el.dataset.tileC) || 0;
        const slotOriginX = c * (SLOT_WIDTH_MM + colGap);
        const slotOriginY = r * (SLOT_HEIGHT_MM + rowGap);
        img.style.transform = `translate(${offsetX - slotOriginX}mm, ${offsetY - slotOriginY}mm)`;
      } else {
        img.style.transform = `translate(${offsetX}mm, ${offsetY}mm)`;
      }
    });
  }

  function updateActiveSelection(queueEl, containerEl, items, activeId) {
    queueEl.querySelectorAll('.sidebar-card-item[data-art-id]').forEach(row => {
      row.classList.toggle('editing', row.dataset.artId === activeId);
    });
    containerEl.querySelectorAll('.art-bridge-piece[data-art-id]').forEach(el => {
      if (!el.classList.contains('art-split-tile')) {
        el.classList.toggle('is-selected', items.length > 1 && el.dataset.artId === activeId);
      }
    });
  }

  function updatePieceCaption(queueEl, containerEl, piece) {
    const tplInfo = ART_TEMPLATES[piece.tpl] || ART_TEMPLATES['2x1'];
    const modeLabel = piece.cutMode === 'split' ? 'Ayrı kartlar' : 'Tek parça köprü';
    queueEl.querySelectorAll('.sidebar-card-item[data-art-id]').forEach(row => {
      if (row.dataset.artId !== piece.id) return;
      const meta = row.querySelector('.sidebar-card-meta');
      if (meta) {
        meta.textContent = `${tplInfo.title} · ${modeLabel}${piece.caption ? ` · "${piece.caption}"` : ''}`;
      }
    });

    const { cols, rows } = tplInfo;
    const text = (piece.caption || '').trim();
    const posClass = `pos-${piece.captionPos || 'bottom-right'}`;

    containerEl.querySelectorAll('.art-bridge-piece[data-art-id]').forEach(el => {
      if (el.dataset.artId !== piece.id) return;
      let shouldHaveBadge = Boolean(text);
      if (shouldHaveBadge && el.classList.contains('art-split-tile')) {
        const r = Number(el.dataset.tileR) || 0;
        const c = Number(el.dataset.tileC) || 0;
        shouldHaveBadge =
          (piece.captionPos === 'top-left' && r === 0 && c === 0) ||
          (piece.captionPos === 'bottom-left' && r === rows - 1 && c === 0) ||
          (piece.captionPos === 'bottom-center' && r === rows - 1 && c === Math.floor(cols / 2)) ||
          ((!piece.captionPos || piece.captionPos === 'bottom-right') && r === rows - 1 && c === cols - 1);
      }

      let badge = el.querySelector('.art-caption-badge');
      if (shouldHaveBadge) {
        if (!badge) {
          badge = document.createElement('div');
          el.appendChild(badge);
        }
        badge.className = `art-caption-badge ${posClass}`;
        badge.textContent = text;
      } else if (badge) {
        badge.remove();
      }
    });
  }

  return {
    renderQueueList,
    renderA4Pages,
    updatePieceTransform,
    updateActiveSelection,
    updatePieceCaption
  };
})();
