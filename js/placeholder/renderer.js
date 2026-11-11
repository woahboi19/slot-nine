const PlaceholderRenderer = (() => {
  function createVariantRow(variant = { lang: 'EN', set: '', number: '', price: '', edition: '' }) {
    const row = document.createElement('div');
    row.className = 'variant-item';

    const codes = PRINTED_LANGUAGES.map(l => l.code);
    if (variant.lang && !codes.includes(variant.lang)) codes.push(variant.lang);

    const optionsHtml = codes.map(code => {
      const selected = code === variant.lang ? 'selected' : '';
      const label = PRINTED_LANGUAGES.find(l => l.code === code)?.label || code;
      return `<option value="${escapeHtml(code)}" title="${escapeHtml(label)}" ${selected}>${escapeHtml(code)}</option>`;
    }).join('');

    row.innerHTML = `
      <select class="v-lang" aria-label="Dil">${optionsHtml}</select>
      <input type="text" class="v-set vi-set" placeholder="Set adı (Paldean Fates)" aria-label="Set adı" value="${escapeHtml(variant.set || '')}" required />
      <button type="button" class="btn-remove-variant" title="Satırı kaldır" aria-label="Satırı kaldır">&times;</button>
      <div class="vi-second">
        <input type="text" class="v-number" placeholder="No (234/091)" aria-label="Set numarası" value="${escapeHtml(variant.number || '')}" required />
        <input type="text" class="v-price" placeholder="Fiyat ($115)" aria-label="Fiyat" value="${escapeHtml(variant.price || '')}" required />
        <input type="text" class="v-edition" list="editionSuggestions" placeholder="Baskı (ops.)" aria-label="Baskı veya kondisyon" value="${escapeHtml(variant.edition || '')}" />
      </div>
    `;
    return row;
  }

  function renderSidebarList({ containerEl, cardCountEl, pageCountEl, cards, editingId }) {
    const totalPages = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));
    cardCountEl.textContent = cards.length;
    pageCountEl.textContent = totalPages;

    if (cards.length === 0) {
      containerEl.innerHTML = `
        <div class="empty-sidebar-msg">
          Henüz placeholder kart eklenmedi.<br/>Yukarıdaki formdan yeni bir kart ekleyebilir veya <strong>"Örnek kartları yükle"</strong> seçeneğini kullanabilirsiniz.
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    cards.forEach(card => {
      const item = document.createElement('div');
      item.className = `sidebar-card-item${card.id === editingId ? ' editing' : ''}`;
      item.dataset.cardId = card.id;

      const summary = (card.variants || [])
        .map(v => `${v.lang}: ${v.set} (${v.number}) · ${v.price}${v.edition ? ` [${v.edition}]` : ''}`)
        .join(' | ');

      item.innerHTML = `
        <div class="sidebar-card-info" data-action="edit" title="Düzenlemek için tıklayın">
          <div class="sidebar-card-title">${escapeHtml(card.name)}</div>
          <div class="sidebar-card-meta" title="${escapeHtml(summary)}">${escapeHtml(summary)}</div>
        </div>
        <div class="sidebar-card-actions">
          <button type="button" class="icon-btn" data-action="edit" title="Düzenle">Düzenle</button>
          <button type="button" class="icon-btn" data-action="dup" title="Kopyala">Kopya</button>
          <button type="button" class="icon-btn danger" data-action="del" title="Sil">Sil</button>
        </div>
      `;
      fragment.appendChild(item);
    });

    containerEl.replaceChildren(fragment);
  }

  function createCardElement(card, qrProvider) {
    const cardEl = document.createElement('div');
    cardEl.className = 'tcg-card';
    cardEl.dataset.type = card.type || 'colorless';
    cardEl.dataset.cardId = card.id;
    cardEl.title = 'Bu kartı düzenlemek için tıklayın';

    const typeLabel = TYPE_LABELS[card.type] || TYPE_LABELS.colorless;
    const variants = card.variants || [];

    const densityClass = variants.length === 1
      ? 'density-1'
      : variants.length === 2
        ? 'density-2'
        : variants.length === 3
          ? 'density-3'
          : 'density-many';

    const variantsHtml = variants.map(v => `
      <div class="card-variant-block">
        <div class="cv-top-line">
          <div class="cv-lang-set">
            <span class="cv-lang-tag">${escapeHtml(v.lang || 'EN')}</span>
            <span class="cv-set-name">${escapeHtml(v.set)}</span>
          </div>
          ${v.edition ? `<span class="cv-edition-tag">${escapeHtml(v.edition)}</span>` : ''}
        </div>
        <div class="cv-bottom-line">
          <span class="cv-number">${escapeHtml(v.number)}</span>
          <span class="cv-price">${escapeHtml(v.price)}</span>
        </div>
      </div>
    `).join('');

    let qrBoxHtml = '';
    let qrCaptionHtml = '';
    if (MARKET_PROVIDERS[qrProvider]) {
      const url = QrCodeService.buildMarketUrl(card, qrProvider);
      const svg = QrCodeService.getSvg(url);
      if (svg) {
        qrBoxHtml = `<div class="card-qr-box">${svg}</div>`;
        qrCaptionHtml = `<span class="card-qr-caption">QR: ${MARKET_PROVIDERS[qrProvider].label}</span>`;
      }
    }

    const noteHtml = card.note ? `<span class="card-note-label">${escapeHtml(card.note)}</span>` : '';
    const hasFooter = Boolean(noteHtml || qrBoxHtml);

    cardEl.innerHTML = `
      <div class="tcg-card-inner">
        <div class="card-top-section">
          <div class="card-top-meta">
            <span class="card-type-pill">${escapeHtml(typeLabel)}</span>
            ${card.rarity ? `<span class="card-rarity-top">${escapeHtml(card.rarity)}</span>` : ''}
          </div>
          <div class="card-header-main">
            <div class="card-title-group">
              <div class="card-pokemon-name${card.name.length > 18 ? ' long-name' : ''}">${escapeHtml(card.name)}</div>
              ${card.subname ? `<div class="card-subname">${escapeHtml(card.subname)}</div>` : ''}
            </div>
            ${card.imageUrl ? `<div class="card-thumb-box"><img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.name)}" decoding="async" data-hide-on-error="parent" /></div>` : ''}
          </div>
        </div>

        <div class="card-variants-body ${densityClass}">
          ${variantsHtml}
        </div>

        ${hasFooter ? `
          <div class="card-footer-section">
            <div class="card-footer-text">
              ${noteHtml}
              ${qrCaptionHtml}
            </div>
            ${qrBoxHtml}
          </div>
        ` : ''}
      </div>
    `;

    bindImageFallbacks(cardEl);
    return cardEl;
  }

  function renderA4Pages(containerEl, cards, settings) {
    containerEl.classList.toggle('theme-minimal', settings.themeMode === 'minimal');
    containerEl.classList.toggle('show-crop-marks', settings.cropMarks);

    if (cards.length === 0) {
      containerEl.innerHTML = '<div class="preview-empty">Henüz kart yok. Soldaki formdan kart ekleyin veya "Daha fazla" menüsünden örnek kartları yükleyin.</div>';
      return;
    }

    const totalPages = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));
    const fragment = document.createDocumentFragment();

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageCards = cards.slice(pageIdx * CARDS_PER_PAGE, (pageIdx + 1) * CARDS_PER_PAGE);
      const sheet = document.createElement('div');
      sheet.className = 'a4-sheet';

      sheet.innerHTML = `
        <div class="a4-sheet-header">
          <span>SlotNine · 63 × 88 mm TCG Binder Placeholder</span>
          <span>Sayfa ${pageIdx + 1} / ${totalPages}</span>
        </div>
        <div class="tcg-grid gap-${settings.gapMode}"></div>
        <div class="a4-sheet-footer">
          <span>Ölçek %100 (Gerçek Boyut), kenar boşluğu yok</span>
          <span>A4 · 3 × 3</span>
        </div>
      `;

      const grid = sheet.querySelector('.tcg-grid');
      for (let slot = 0; slot < CARDS_PER_PAGE; slot++) {
        const cardData = pageCards[slot];
        if (cardData) {
          grid.appendChild(createCardElement(cardData, settings.qrProvider));
        } else {
          const emptyEl = document.createElement('div');
          emptyEl.className = `tcg-card empty-slot${settings.fillEmptySlots ? '' : ' invisible-slot'}`;
          if (settings.fillEmptySlots) {
            emptyEl.innerHTML = '<span class="empty-slot-label">Boş</span>';
          }
          grid.appendChild(emptyEl);
        }
      }

      fragment.appendChild(sheet);
    }

    containerEl.replaceChildren(fragment);
  }

  function updateEditingState(sidebarEl, editingId) {
    sidebarEl.querySelectorAll('.sidebar-card-item[data-card-id]').forEach(item => {
      item.classList.toggle('editing', item.dataset.cardId === editingId);
    });
  }

  function applyVisualSettings(containerEl, settings) {
    containerEl.classList.toggle('theme-minimal', settings.themeMode === 'minimal');
    containerEl.classList.toggle('show-crop-marks', settings.cropMarks);

    containerEl.querySelectorAll('.tcg-grid').forEach(grid => {
      grid.className = `tcg-grid gap-${settings.gapMode}`;
    });

    containerEl.querySelectorAll('.tcg-card.empty-slot').forEach(slot => {
      slot.classList.toggle('invisible-slot', !settings.fillEmptySlots);
      slot.innerHTML = settings.fillEmptySlots ? '<span class="empty-slot-label">Boş</span>' : '';
    });
  }

  return {
    createVariantRow,
    renderSidebarList,
    renderA4Pages,
    updateEditingState,
    applyVisualSettings
  };
})();
