(() => {
  const state = {
    binders: [],
    activeBinderId: '',
    viewMode: 'spread',
    pageIndex: 0,
    selectedPageId: '',
    selectedSlotIndex: 0,
    slotEditMode: 'card',
    draftArtSrc: createSampleLandscapeDataUrl(),
    draftArtAspect: 1600 / 900,
    draftArtTitle: 'Manzara Görseli',
    draftArtPanX: 0.5,
    draftArtPanY: 0.5,
    panDrag: null,
    dragSource: null,
    lookupController: null
  };

  const els = {
    binderSelect: document.getElementById('binderSelect'),
    btnNewBinder: document.getElementById('btnNewBinder'),
    btnRenameBinder: document.getElementById('btnRenameBinder'),
    btnDeleteBinder: document.getElementById('btnDeleteBinder'),
    binderGridSize: document.getElementById('binderGridSize'),
    binderMissingStyle: document.getElementById('binderMissingStyle'),
    binderSlotEditorTitle: document.getElementById('binderSlotEditorTitle'),
    btnClearBinderSlot: document.getElementById('btnClearBinderSlot'),
    slotModeBtns: document.querySelectorAll('.slot-mode-btn[data-slot-mode]'),
    binderCardFormBox: document.getElementById('binderCardFormBox'),
    binderArtFormBox: document.getElementById('binderArtFormBox'),
    binderCardName: document.getElementById('binderCardName'),
    btnBinderLookup: document.getElementById('btnBinderLookup'),
    binderLookupDropdown: document.getElementById('binderLookupDropdown'),
    binderCardArtUrl: document.getElementById('binderCardArtUrl'),
    binderCardFileInput: document.getElementById('binderCardFileInput'),
    binderCardSet: document.getElementById('binderCardSet'),
    binderCardNumber: document.getElementById('binderCardNumber'),
    binderCardPrice: document.getElementById('binderCardPrice'),
    binderCardLang: document.getElementById('binderCardLang'),
    binderCardType: document.getElementById('binderCardType'),
    binderCardStatus: document.getElementById('binderCardStatus'),
    btnSaveBinderCard: document.getElementById('btnSaveBinderCard'),
    binderArtFileInput: document.getElementById('binderArtFileInput'),
    btnBinderSampleArt: document.getElementById('btnBinderSampleArt'),
    binderArtSpan: document.getElementById('binderArtSpan'),
    binderArtZoom: document.getElementById('binderArtZoom'),
    binderArtZoomVal: document.getElementById('binderArtZoomVal'),
    btnBinderArtCenter: document.getElementById('btnBinderArtCenter'),
    binderArtCaption: document.getElementById('binderArtCaption'),
    btnSaveBinderArt: document.getElementById('btnSaveBinderArt'),
    btnSendMissingToPlaceholder: document.getElementById('btnSendMissingToPlaceholder'),
    btnSendPageArtToPrint: document.getElementById('btnSendPageArtToPrint'),
    btnExportBinderJson: document.getElementById('btnExportBinderJson'),
    inputImportBinderJson: document.getElementById('inputImportBinderJson'),
    binderViewBtns: document.querySelectorAll('[data-binder-view]'),
    btnPrevBinderPage: document.getElementById('btnPrevBinderPage'),
    binderPageIndicator: document.getElementById('binderPageIndicator'),
    btnNextBinderPage: document.getElementById('btnNextBinderPage'),
    btnAddBinderPage: document.getElementById('btnAddBinderPage'),
    btnDeleteBinderPage: document.getElementById('btnDeleteBinderPage'),
    binderStatsSummary: document.getElementById('binderStatsSummary'),
    binderSpreadViewport: document.getElementById('binderSpreadViewport')
  };

  function getActiveBinder() {
    if (state.binders.length === 0) {
      state.binders = createDefaultBinders();
    }
    let binder = state.binders.find(b => b.id === state.activeBinderId);
    if (!binder) {
      binder = state.binders[0];
      state.activeBinderId = binder.id;
    }
    if (!Array.isArray(binder.pages) || binder.pages.length === 0) {
      binder.pages = [{ id: createId('bpage'), title: 'Sayfa 1', items: [] }];
    }
    return binder;
  }

  function getSelectedBinderPageAndSlot() {
    const binder = getActiveBinder();
    const spec = BinderModel.getGridSpec(binder);
    let page = binder.pages.find(p => p.id === state.selectedPageId);
    if (!page) {
      const fallbackIdx = clamp(state.pageIndex, 0, binder.pages.length - 1);
      page = binder.pages[fallbackIdx] || binder.pages[0];
      state.selectedPageId = page.id;
    }
    const slotIndex = clamp(state.selectedSlotIndex, 0, spec.totalSlots - 1);
    state.selectedSlotIndex = slotIndex;
    const pageIdx = binder.pages.findIndex(p => p.id === page.id);
    const cellMap = BinderModel.buildPageOccupancy(page, spec.cols, spec.rows);
    const hit = cellMap.get(slotIndex) || null;
    return { binder, spec, page, pageIdx, slotIndex, item: hit?.item || null };
  }

  function setBinderSlotMode(mode) {
    state.slotEditMode = mode === 'art' ? 'art' : 'card';
    els.slotModeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.slotMode === state.slotEditMode);
    });
    els.binderCardFormBox.classList.toggle('hidden', state.slotEditMode !== 'card');
    els.binderArtFormBox.classList.toggle('hidden', state.slotEditMode !== 'art');
  }

  function syncBinderSlotEditor() {
    const { pageIdx, slotIndex, item } = getSelectedBinderPageAndSlot();
    els.binderSlotEditorTitle.textContent = `Seçili cep: Sayfa ${pageIdx + 1} · Cep #${slotIndex + 1}`;
    els.btnClearBinderSlot.classList.toggle('hidden', !item);

    if (item && item.kind === 'art') {
      setBinderSlotMode('art');
      state.draftArtSrc = item.imageSrc || createSampleLandscapeDataUrl();
      state.draftArtAspect = item.aspectRatio || (1600 / 900);
      state.draftArtTitle = item.title || 'Manzara Görseli';
      state.draftArtPanX = typeof item.panX === 'number' ? item.panX : 0.5;
      state.draftArtPanY = typeof item.panY === 'number' ? item.panY : 0.5;
      els.binderArtSpan.value = BINDER_ART_SPANS[item.tpl] ? item.tpl : '3x1';
      els.binderArtZoom.value = item.zoom || 100;
      els.binderArtZoomVal.textContent = `${item.zoom || 100}%`;
      els.binderArtCaption.value = item.caption || '';
    } else if (item && item.kind === 'card') {
      setBinderSlotMode('card');
      els.binderCardName.value = item.name || '';
      els.binderCardArtUrl.value = item.cardArtUrl || '';
      els.binderCardSet.value = item.set || '';
      els.binderCardNumber.value = item.number || '';
      els.binderCardPrice.value = item.price || '';
      els.binderCardLang.value = item.lang || 'EN';
      els.binderCardType.value = TYPE_LABELS[item.type] ? item.type : 'colorless';
      els.binderCardStatus.value = item.owned === false ? 'missing' : 'owned';
    } else if (state.slotEditMode === 'card') {
      els.binderCardName.value = '';
      els.binderCardArtUrl.value = '';
      els.binderCardNumber.value = '';
      els.binderCardPrice.value = '';
      els.binderCardStatus.value = 'owned';
    }
  }

  function syncBinderControls() {
    const binder = getActiveBinder();
    els.binderSelect.innerHTML = state.binders
      .map(b => `<option value="${escapeHtml(b.id)}" ${b.id === binder.id ? 'selected' : ''}>${escapeHtml(b.name)}</option>`)
      .join('');

    els.binderGridSize.value = BINDER_GRID_PRESETS[binder.gridSize] ? binder.gridSize : '3x3';
    els.binderMissingStyle.value = binder.missingStyle === 'placeholder' ? 'placeholder' : 'dimmed';

    els.binderViewBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.binderView === state.viewMode);
    });

    syncBinderSlotEditor();
  }

  function renderDigitalBinder() {
    const binder = getActiveBinder();
    const totalPages = binder.pages.length;

    if (state.viewMode === 'spread') {
      state.pageIndex = Math.floor(clamp(state.pageIndex, 0, totalPages - 1) / 2) * 2;
    } else {
      state.pageIndex = clamp(state.pageIndex, 0, totalPages - 1);
    }

    DigitalBinderRenderer.renderBinderStage({
      viewportEl: els.binderSpreadViewport,
      indicatorEl: els.binderPageIndicator,
      prevBtn: els.btnPrevBinderPage,
      nextBtn: els.btnNextBinderPage,
      statsEl: els.binderStatsSummary,
      binder,
      viewState: state
    });
  }

  async function saveCardToSelectedBinderPocket() {
    const { spec, page, slotIndex, item } = getSelectedBinderPageAndSlot();
    const name = els.binderCardName.value.trim();
    if (!name) {
      showToast('Lütfen cepte yer alacak kartın adını girin.');
      els.binderCardName.focus();
      return;
    }

    let cardArtUrl = els.binderCardArtUrl.value.trim();
    const resolved = await PokeApiService.resolvePokemon(name, '');
    const spriteUrl = resolved.url;
    if (!cardArtUrl && spriteUrl) {
      cardArtUrl = spriteUrl;
    }

    const cardItem = {
      id: item?.kind === 'card' ? item.id : createId('bitem'),
      kind: 'card',
      slotIndex,
      colSpan: 1,
      rowSpan: 1,
      name,
      set: els.binderCardSet.value.trim() || 'Pokémon TCG',
      number: els.binderCardNumber.value.trim() || '',
      price: els.binderCardPrice.value.trim() || '',
      lang: els.binderCardLang.value.trim() || 'EN',
      type: els.binderCardType.value || 'colorless',
      rarity: item?.rarity || '',
      cardArtUrl,
      spriteUrl: spriteUrl || item?.spriteUrl || '',
      owned: els.binderCardStatus.value !== 'missing'
    };

    BinderModel.placeItemInPage(page, cardItem, spec.cols, spec.rows);
    AppStorage.saveBinders(state.binders);
    syncBinderSlotEditor();
    renderDigitalBinder();
    showToast(`${name} cebe yerleştirildi.`);
  }

  function saveArtToSelectedBinderPocket() {
    const { spec, page, slotIndex, item } = getSelectedBinderPageAndSlot();
    const tplKey = BINDER_ART_SPANS[els.binderArtSpan.value] ? els.binderArtSpan.value : '3x1';
    const spanSpec = BINDER_ART_SPANS[tplKey];
    const colSpan = Math.min(spec.cols, spanSpec.cols);
    const rowSpan = Math.min(spec.rows, spanSpec.rows);

    const originIdx = item?.kind === 'art' ? item.slotIndex : slotIndex;
    const artItem = {
      id: item?.kind === 'art' ? item.id : createId('bart'),
      kind: 'art',
      slotIndex: originIdx,
      colSpan,
      rowSpan,
      tpl: `${colSpan}x${rowSpan}`,
      title: state.draftArtTitle || 'Binder Art',
      imageSrc: state.draftArtSrc || createSampleLandscapeDataUrl(),
      aspectRatio: state.draftArtAspect || (1600 / 900),
      zoom: clamp(Number(els.binderArtZoom.value) || 100, 100, 260),
      panX: clamp(state.draftArtPanX, 0, 1),
      panY: clamp(state.draftArtPanY, 0, 1),
      caption: els.binderArtCaption.value.trim()
    };

    BinderModel.placeItemInPage(page, artItem, spec.cols, spec.rows);
    state.selectedSlotIndex = artItem.slotIndex;
    AppStorage.saveBinders(state.binders);
    syncBinderSlotEditor();
    renderDigitalBinder();
    showToast(`${colSpan}×${rowSpan} Binder Art sayfaya yerleştirildi.`);
  }

  async function searchBinderTcgdexCards() {
    const query = els.binderCardName.value.trim();
    if (query.length < 2) {
      showToast('Kart araması için en az 2 harf yazın.');
      els.binderCardName.focus();
      return;
    }

    els.binderLookupDropdown.classList.remove('hidden');
    els.binderLookupDropdown.innerHTML = `<div class="lookup-status">"${escapeHtml(query)}" kart görselleri aranıyor...</div>`;

    if (state.lookupController) state.lookupController.abort();
    state.lookupController = new AbortController();

    try {
      const results = await TcgdexService.searchByName(query, {
        signal: state.lookupController.signal,
        preferWithImage: true,
        limit: 20
      });

      if (results.length === 0) {
        els.binderLookupDropdown.innerHTML = '<div class="lookup-status">Kart bulunamadı.</div>';
        return;
      }

      const fragment = document.createDocumentFragment();
      results.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lookup-item';
        btn.dataset.binderCardId = item.id;
        btn.innerHTML = `
          <span class="lookup-item-left">
            ${item.thumbUrl ? `<img class="lookup-thumb" src="${escapeHtml(item.thumbUrl)}" alt="" loading="lazy" />` : ''}
            <span class="lookup-item-name">${escapeHtml(item.name)}</span>
          </span>
          <span class="lookup-item-meta">${escapeHtml(item.id)} · #${escapeHtml(item.localId)}</span>
        `;
        fragment.appendChild(btn);
      });
      els.binderLookupDropdown.replaceChildren(fragment);
    } catch (err) {
      if (err.name !== 'AbortError') {
        els.binderLookupDropdown.innerHTML = '<div class="lookup-status">TCGdex bağlantısı kurulamadı.</div>';
      }
    }
  }

  async function applyBinderTcgdexCard(cardApiId) {
    els.binderLookupDropdown.innerHTML = '<div class="lookup-status">Kart görseli ve bilgileri alınıyor...</div>';
    try {
      const detail = await TcgdexService.fetchCardDetails(cardApiId);
      if (detail.name) els.binderCardName.value = detail.name;
      if (detail.lowResArtUrl) els.binderCardArtUrl.value = detail.lowResArtUrl;
      if (detail.setName) els.binderCardSet.value = detail.setName;
      if (detail.formattedNumber) els.binderCardNumber.value = detail.formattedNumber;
      els.binderCardType.value = detail.typeKey;

      if (detail.mappedRarity) {
        const abbrev = detail.mappedRarity.split(' ').map(w => w[0]).join('');
        els.binderCardLang.value = `EN · ${abbrev}`;
      }

      els.binderLookupDropdown.classList.add('hidden');
      await saveCardToSelectedBinderPocket();
    } catch {
      els.binderLookupDropdown.classList.add('hidden');
      showToast('Kart detayı alınamadı.');
    }
  }

  function addNewPageToActiveBinder() {
    const binder = getActiveBinder();
    const newPageNum = binder.pages.length + 1;
    const newPage = {
      id: `${createId('bpage')}-${newPageNum}`,
      title: `Sayfa ${newPageNum}`,
      items: []
    };
    binder.pages.push(newPage);
    state.pageIndex = binder.pages.length - 1;
    state.selectedPageId = newPage.id;
    state.selectedSlotIndex = 0;
    AppStorage.saveBinders(state.binders);
    syncBinderSlotEditor();
    renderDigitalBinder();
    showToast(`Sayfa ${newPageNum} eklendi.`);
  }

  function bindEvents() {
    els.binderSelect.addEventListener('change', () => {
      state.activeBinderId = els.binderSelect.value;
      const binder = getActiveBinder();
      state.pageIndex = 0;
      state.selectedPageId = binder.pages[0]?.id || '';
      state.selectedSlotIndex = 0;
      syncBinderControls();
      renderDigitalBinder();
    });

    els.btnNewBinder.addEventListener('click', () => {
      const name = prompt('Yeni binder adı:', `Koleksiyon #${state.binders.length + 1}`);
      if (!name || !name.trim()) return;
      const pageId = `${createId('bpage')}-1`;
      const pageId2 = `${createId('bpage')}-2`;
      const newBinder = {
        id: createId('binder'),
        name: name.trim(),
        gridSize: '3x3',
        missingStyle: 'dimmed',
        pages: [
          { id: pageId, title: 'Sayfa 1', items: [] },
          { id: pageId2, title: 'Sayfa 2', items: [] }
        ]
      };
      state.binders.push(newBinder);
      state.activeBinderId = newBinder.id;
      state.pageIndex = 0;
      state.selectedPageId = pageId;
      state.selectedSlotIndex = 0;
      AppStorage.saveBinders(state.binders);
      syncBinderControls();
      renderDigitalBinder();
      showToast(`"${newBinder.name}" oluşturuldu.`);
    });

    els.btnRenameBinder.addEventListener('click', () => {
      const binder = getActiveBinder();
      const nextName = prompt('Binder adını düzenle:', binder.name);
      if (!nextName || !nextName.trim()) return;
      binder.name = nextName.trim();
      AppStorage.saveBinders(state.binders);
      syncBinderControls();
      renderDigitalBinder();
    });

    els.btnDeleteBinder.addEventListener('click', () => {
      if (state.binders.length <= 1) {
        showToast('En az 1 dijital binder bulunmalıdır.');
        return;
      }
      const binder = getActiveBinder();
      if (!confirm(`"${binder.name}" adlı binder'ı ve içindeki tüm sayfaları silmek istediğinize emin misiniz?`)) return;
      state.binders = state.binders.filter(b => b.id !== binder.id);
      const first = getActiveBinder();
      state.activeBinderId = first.id;
      state.pageIndex = 0;
      state.selectedPageId = first.pages[0]?.id || '';
      state.selectedSlotIndex = 0;
      AppStorage.saveBinders(state.binders);
      syncBinderControls();
      renderDigitalBinder();
      showToast('Binder silindi.');
    });

    els.binderGridSize.addEventListener('change', () => {
      const binder = getActiveBinder();
      if (BINDER_GRID_PRESETS[els.binderGridSize.value]) {
        binder.gridSize = els.binderGridSize.value;
        state.selectedSlotIndex = 0;
        AppStorage.saveBinders(state.binders);
        syncBinderSlotEditor();
        renderDigitalBinder();
      }
    });

    els.binderMissingStyle.addEventListener('change', () => {
      const binder = getActiveBinder();
      binder.missingStyle = els.binderMissingStyle.value === 'placeholder' ? 'placeholder' : 'dimmed';
      AppStorage.saveBinders(state.binders);
      renderDigitalBinder();
    });

    els.slotModeBtns.forEach(btn => {
      btn.addEventListener('click', () => setBinderSlotMode(btn.dataset.slotMode));
    });

    els.btnClearBinderSlot.addEventListener('click', () => {
      const { page, item } = getSelectedBinderPageAndSlot();
      if (!item) return;
      page.items = (page.items || []).filter(it => it.id !== item.id);
      AppStorage.saveBinders(state.binders);
      syncBinderSlotEditor();
      renderDigitalBinder();
      showToast('Seçili cep boşaltıldı.');
    });

    els.btnBinderLookup.addEventListener('click', searchBinderTcgdexCards);
    els.binderCardName.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchBinderTcgdexCards();
      }
    });

    els.binderLookupDropdown.addEventListener('click', e => {
      const btn = e.target.closest('.lookup-item[data-binder-card-id]');
      if (btn?.dataset.binderCardId) applyBinderTcgdexCard(btn.dataset.binderCardId);
    });

    els.binderCardFileInput.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      els.binderCardFileInput.value = '';
      if (!file) return;
      try {
        const { dataUrl } = await readAndCompressImage(file, 720);
        els.binderCardArtUrl.value = dataUrl;
        if (!els.binderCardName.value.trim()) {
          els.binderCardName.value = file.name.replace(/\.[^.]+$/, '');
        }
        showToast('Kart görseli yüklendi.');
      } catch {
        showToast('Görsel yüklenemedi.');
      }
    });

    els.btnSaveBinderCard.addEventListener('click', saveCardToSelectedBinderPocket);

    els.binderArtFileInput.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      els.binderArtFileInput.value = '';
      if (!file) return;
      try {
        const { dataUrl, aspectRatio } = await readAndCompressImage(file, 1100);
        state.draftArtSrc = dataUrl;
        state.draftArtAspect = aspectRatio;
        state.draftArtTitle = file.name.replace(/\.[^.]+$/, '') || 'Binder Art';
        state.draftArtPanX = 0.5;
        state.draftArtPanY = 0.5;
        saveArtToSelectedBinderPocket();
      } catch {
        showToast('Görsel yüklenemedi.');
      }
    });

    els.btnBinderSampleArt.addEventListener('click', () => {
      state.draftArtSrc = createSampleLandscapeDataUrl();
      state.draftArtAspect = 1600 / 900;
      state.draftArtTitle = 'Kanto Manzara';
      state.draftArtPanX = 0.5;
      state.draftArtPanY = 0.5;
      saveArtToSelectedBinderPocket();
    });

    els.binderArtZoom.addEventListener('input', () => {
      const z = Number(els.binderArtZoom.value) || 100;
      els.binderArtZoomVal.textContent = `${z}%`;
      const { item } = getSelectedBinderPageAndSlot();
      if (item && item.kind === 'art') {
        item.zoom = z;
        AppStorage.saveBinders(state.binders);
        DigitalBinderRenderer.updateArtSlotTransform(els.binderSpreadViewport, item);
      }
    });

    els.btnBinderArtCenter.addEventListener('click', () => {
      state.draftArtPanX = 0.5;
      state.draftArtPanY = 0.5;
      els.binderArtZoom.value = 100;
      els.binderArtZoomVal.textContent = '100%';
      const { item } = getSelectedBinderPageAndSlot();
      if (item && item.kind === 'art') {
        item.panX = 0.5;
        item.panY = 0.5;
        item.zoom = 100;
        AppStorage.saveBinders(state.binders);
        DigitalBinderRenderer.updateArtSlotTransform(els.binderSpreadViewport, item);
      }
    });

    els.btnSaveBinderArt.addEventListener('click', saveArtToSelectedBinderPocket);

    els.binderViewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.viewMode = btn.dataset.binderView === 'single' ? 'single' : 'spread';
        els.binderViewBtns.forEach(b => b.classList.toggle('active', b.dataset.binderView === state.viewMode));
        renderDigitalBinder();
      });
    });

    els.btnPrevBinderPage.addEventListener('click', () => {
      const step = state.viewMode === 'spread' ? 2 : 1;
      state.pageIndex = Math.max(0, state.pageIndex - step);
      const binder = getActiveBinder();
      const targetPage = binder.pages[state.pageIndex];
      if (targetPage) {
        state.selectedPageId = targetPage.id;
        state.selectedSlotIndex = 0;
        syncBinderSlotEditor();
      }
      renderDigitalBinder();
    });

    els.btnNextBinderPage.addEventListener('click', () => {
      const binder = getActiveBinder();
      const step = state.viewMode === 'spread' ? 2 : 1;
      if (state.pageIndex + step < binder.pages.length) {
        state.pageIndex += step;
        const targetPage = binder.pages[state.pageIndex];
        if (targetPage) {
          state.selectedPageId = targetPage.id;
          state.selectedSlotIndex = 0;
          syncBinderSlotEditor();
        }
        renderDigitalBinder();
      }
    });

    els.btnAddBinderPage.addEventListener('click', addNewPageToActiveBinder);

    els.btnDeleteBinderPage.addEventListener('click', () => {
      const binder = getActiveBinder();
      if (binder.pages.length <= 1) {
        showToast('Binder içinde en az 1 sayfa bulunmalıdır.');
        return;
      }
      const { page, pageIdx } = getSelectedBinderPageAndSlot();
      if (!confirm(`Sayfa ${pageIdx + 1} ("${page.title}") silinsin mi?`)) return;
      binder.pages = binder.pages.filter(p => p.id !== page.id);
      state.pageIndex = clamp(state.pageIndex, 0, binder.pages.length - 1);
      state.selectedPageId = binder.pages[state.pageIndex].id;
      state.selectedSlotIndex = 0;
      AppStorage.saveBinders(state.binders);
      syncBinderSlotEditor();
      renderDigitalBinder();
      showToast('Sayfa silindi.');
    });

    els.binderSpreadViewport.addEventListener('input', e => {
      const titleInput = e.target.closest('.binder-page-title-input[data-page-title-id]');
      if (!titleInput) return;
      const binder = getActiveBinder();
      const page = binder.pages.find(p => p.id === titleInput.dataset.pageTitleId);
      if (page) {
        page.title = titleInput.value;
        AppStorage.saveBinders(state.binders);
      }
    });

    els.binderSpreadViewport.addEventListener('click', e => {
      if (e.target.closest('[data-quick-add-page]')) {
        addNewPageToActiveBinder();
        return;
      }

      const toggleBadge = e.target.closest('[data-toggle-owned]');
      if (toggleBadge) {
        e.stopPropagation();
        const itemId = toggleBadge.dataset.toggleOwned;
        const binder = getActiveBinder();
        for (const p of binder.pages) {
          const found = (p.items || []).find(it => it.id === itemId);
          if (found) {
            found.owned = found.owned === false;
            state.selectedPageId = p.id;
            state.selectedSlotIndex = found.slotIndex;
            AppStorage.saveBinders(state.binders);
            syncBinderSlotEditor();

            if (binder.missingStyle === 'placeholder') {
              renderDigitalBinder();
            } else {
              const isMissing = found.owned === false;
              const slotWrap = toggleBadge.closest('.binder-card-slot');
              slotWrap?.classList.toggle('is-missing', isMissing);
              toggleBadge.className = `binder-status-badge ${isMissing ? 'status-missing' : 'status-owned'}`;
              toggleBadge.textContent = isMissing ? 'EKSİK' : 'VAR';
              DigitalBinderRenderer.updateSelectedPocket(els.binderSpreadViewport, state);
              DigitalBinderRenderer.updateStatsBar(els.binderStatsSummary, binder);
            }
            break;
          }
        }
        return;
      }

      const pocket = e.target.closest('.binder-pocket[data-page-id]');
      if (pocket) {
        state.selectedPageId = pocket.dataset.pageId;
        state.selectedSlotIndex = Number(pocket.dataset.slotIndex) || 0;
        els.binderLookupDropdown.classList.add('hidden');
        syncBinderSlotEditor();
        DigitalBinderRenderer.updateSelectedPocket(els.binderSpreadViewport, state);
      }
    });

    els.binderSpreadViewport.addEventListener('pointerdown', e => {
      const artBox = e.target.closest('.binder-art-slot[data-pan-art-id]');
      if (!artBox) return;

      const pageId = artBox.dataset.panPageId;
      const artId = artBox.dataset.panArtId;
      const binder = getActiveBinder();
      const page = binder.pages.find(p => p.id === pageId);
      const artItem = page?.items?.find(it => it.id === artId);
      if (!artItem) return;

      e.preventDefault();
      artBox.setPointerCapture?.(e.pointerId);

      state.selectedPageId = pageId;
      state.selectedSlotIndex = artItem.slotIndex;
      syncBinderSlotEditor();
      DigitalBinderRenderer.updateSelectedPocket(els.binderSpreadViewport, state);

      state.panDrag = {
        pointerId: e.pointerId,
        pageId,
        artId,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: artItem.panX ?? 0.5,
        startPanY: artItem.panY ?? 0.5,
        maxOffX: Number(artBox.dataset.maxOffX) || 0,
        maxOffY: Number(artBox.dataset.maxOffY) || 0
      };
    });

    window.addEventListener('pointermove', e => {
      const pd = state.panDrag;
      if (!pd || e.pointerId !== pd.pointerId) return;
      const binder = getActiveBinder();
      const page = binder.pages.find(p => p.id === pd.pageId);
      const artItem = page?.items?.find(it => it.id === pd.artId);
      if (!artItem) return;

      const dx = e.clientX - pd.startX;
      const dy = e.clientY - pd.startY;
      if (pd.maxOffX > 1) {
        artItem.panX = clamp(pd.startPanX - dx / pd.maxOffX, 0, 1);
        state.draftArtPanX = artItem.panX;
      }
      if (pd.maxOffY > 1) {
        artItem.panY = clamp(pd.startPanY - dy / pd.maxOffY, 0, 1);
        state.draftArtPanY = artItem.panY;
      }
      DigitalBinderRenderer.updateArtSlotTransform(els.binderSpreadViewport, artItem);
    });

    const endBinderPan = e => {
      if (state.panDrag && e.pointerId === state.panDrag.pointerId) {
        state.panDrag = null;
        AppStorage.saveBinders(state.binders);
      }
    };
    window.addEventListener('pointerup', endBinderPan);
    window.addEventListener('pointercancel', endBinderPan);

    els.binderSpreadViewport.addEventListener('dragstart', e => {
      const pocket = e.target.closest('.binder-pocket[data-item-id]');
      if (!pocket) return;
      state.dragSource = {
        pageId: pocket.dataset.pageId,
        slotIndex: Number(pocket.dataset.slotIndex) || 0,
        itemId: pocket.dataset.itemId
      };
      e.dataTransfer?.setData('text/plain', pocket.dataset.itemId);
    });

    els.binderSpreadViewport.addEventListener('dragover', e => {
      if (!state.dragSource) return;
      const pocket = e.target.closest('.binder-pocket[data-page-id]');
      if (!pocket) return;
      e.preventDefault();
      pocket.classList.add('drag-over-pocket');
    });

    els.binderSpreadViewport.addEventListener('dragleave', e => {
      const pocket = e.target.closest('.binder-pocket[data-page-id]');
      pocket?.classList.remove('drag-over-pocket');
    });

    els.binderSpreadViewport.addEventListener('drop', e => {
      const src = state.dragSource;
      state.dragSource = null;
      const targetPocket = e.target.closest('.binder-pocket[data-page-id]');
      if (!src || !targetPocket) return;
      e.preventDefault();
      targetPocket.classList.remove('drag-over-pocket');

      const targetPageId = targetPocket.dataset.pageId;
      const targetSlotIndex = Number(targetPocket.dataset.slotIndex) || 0;
      const binder = getActiveBinder();

      if (BinderModel.swapOrMovePocketItem(binder, src, targetPageId, targetSlotIndex)) {
        state.selectedPageId = targetPageId;
        state.selectedSlotIndex = targetSlotIndex;
        AppStorage.saveBinders(state.binders);
        syncBinderSlotEditor();
        renderDigitalBinder();
      }
    });

    els.btnSendMissingToPlaceholder.addEventListener('click', () => {
      const binder = getActiveBinder();
      const missingCards = BinderModel.extractMissingCardsForPlaceholder(binder);
      if (missingCards.length === 0) {
        showToast('Bu binder içinde "Eksik" olarak işaretlenmiş kart bulunmuyor.');
        return;
      }
      const cards = AppStorage.loadCards();
      cards.push(...missingCards);
      AppStorage.saveCards(cards);
      AppStorage.setFlashToast(`${missingCards.length} eksik kart Yer Tutucu baskı sayfasına aktarıldı.`);
      window.location.href = 'index.html';
    });

    els.btnSendPageArtToPrint.addEventListener('click', () => {
      const binder = getActiveBinder();
      const artPieces = BinderModel.extractPageArtForPrint(binder, state.pageIndex, state.viewMode);
      if (artPieces.length === 0) {
        showToast('Açık olan sayfada aktarılacak Binder Art görseli bulunamadı.');
        return;
      }
      AppStorage.saveArtQueue(artPieces);
      AppStorage.setFlashToast(`${artPieces.length} görsel A4 Binder Art baskı kuyruğuna gönderildi.`);
      window.location.href = 'binder-art.html';
    });

    els.btnExportBinderJson.addEventListener('click', () => {
      downloadJson('slotnine-dijital-binder', state.binders);
    });

    els.inputImportBinderJson.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(String(ev.target?.result || ''));
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].pages) {
            state.binders = parsed;
            state.activeBinderId = parsed[0].id;
            state.pageIndex = 0;
            state.selectedPageId = parsed[0].pages[0]?.id || '';
            state.selectedSlotIndex = 0;
            AppStorage.saveBinders(state.binders);
            syncBinderControls();
            renderDigitalBinder();
            showToast(`${parsed.length} dijital binder yüklendi.`);
          } else {
            showToast('Geçersiz dijital binder JSON dosyası.');
          }
        } catch {
          showToast('Binder JSON dosyası okunamadı.');
        }
        els.inputImportBinderJson.value = '';
      };
      reader.readAsText(file);
    });

    document.addEventListener('click', e => {
      if (!els.binderLookupDropdown.classList.contains('hidden')) {
        if (
          !els.binderLookupDropdown.contains(e.target) &&
          e.target !== els.btnBinderLookup &&
          e.target !== els.binderCardName
        ) {
          els.binderLookupDropdown.classList.add('hidden');
        }
      }
    });
  }

  function init() {
    state.binders = AppStorage.loadBinders();
    const firstBinder = getActiveBinder();
    state.activeBinderId = firstBinder.id;
    state.selectedPageId = firstBinder.pages[0]?.id || '';
    state.selectedSlotIndex = 0;
    syncBinderControls();
    bindEvents();
    renderDigitalBinder();
    consumeFlashToast();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
