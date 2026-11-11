(() => {
  const state = {
    cards: [],
    settings: {
      gapMode: 'zero',
      themeMode: 'color',
      qrProvider: 'none',
      cropMarks: true,
      fillEmptySlots: false
    },
    spriteTimer: null,
    lookupController: null
  };

  const els = {
    cardForm: document.getElementById('cardForm'),
    editingCardId: document.getElementById('editingCardId'),
    formTitle: document.getElementById('formTitle'),
    btnCancelEdit: document.getElementById('btnCancelEdit'),
    btnSubmitCard: document.getElementById('btnSubmitCard'),
    cardName: document.getElementById('cardName'),
    btnLookupCard: document.getElementById('btnLookupCard'),
    lookupDropdown: document.getElementById('lookupDropdown'),
    cardSubname: document.getElementById('cardSubname'),
    cardType: document.getElementById('cardType'),
    cardRarity: document.getElementById('cardRarity'),
    cardImageUrl: document.getElementById('cardImageUrl'),
    spritePreviewBadge: document.getElementById('spritePreviewBadge'),
    spritePreviewImg: document.getElementById('spritePreviewImg'),
    cardNote: document.getElementById('cardNote'),
    variantsContainer: document.getElementById('variantsContainer'),
    btnAddVariant: document.getElementById('btnAddVariant'),
    keepSetTemplate: document.getElementById('keepSetTemplate'),
    formError: document.getElementById('formError'),

    settingGapMode: document.getElementById('settingGapMode'),
    settingThemeMode: document.getElementById('settingThemeMode'),
    settingQrProvider: document.getElementById('settingQrProvider'),
    settingCropMarks: document.getElementById('settingCropMarks'),
    settingFillEmptySlots: document.getElementById('settingFillEmptySlots'),

    cardListSidebar: document.getElementById('cardListSidebar'),
    cardCountBadge: document.getElementById('cardCountBadge'),
    pageCountBadge: document.getElementById('pageCountBadge'),
    a4PagesContainer: document.getElementById('a4PagesContainer'),

    zoomRange: document.getElementById('zoomRange'),
    zoomValue: document.getElementById('zoomValue'),
    btnShareLink: document.getElementById('btnShareLink'),
    moreMenu: document.getElementById('moreMenu'),
    btnOpenBulk: document.getElementById('btnOpenBulk'),
    btnQuickBulk: document.getElementById('btnQuickBulk'),
    btnLoadSamples: document.getElementById('btnLoadSamples'),
    btnExportJson: document.getElementById('btnExportJson'),
    inputImportFile: document.getElementById('inputImportFile'),
    btnClearAll: document.getElementById('btnClearAll'),
    btnPrint: document.getElementById('btnPrint'),

    bulkModal: document.getElementById('bulkModal'),
    bulkTextarea: document.getElementById('bulkTextarea'),
    bulkError: document.getElementById('bulkError'),
    btnCloseBulk: document.getElementById('btnCloseBulk'),
    btnCancelBulk: document.getElementById('btnCancelBulk'),
    btnConfirmBulk: document.getElementById('btnConfirmBulk')
  };

  function showFormError(message) {
    els.formError.textContent = message;
    els.formError.classList.remove('hidden');
  }

  function hideFormError() {
    els.formError.textContent = '';
    els.formError.classList.add('hidden');
  }

  function updateSpritePreview(url) {
    const clean = normalizeSpriteUrl(url);
    els.cardImageUrl.value = clean;
    if (clean) {
      els.spritePreviewImg.src = clean;
      els.spritePreviewBadge.classList.remove('hidden');
    } else {
      els.spritePreviewImg.removeAttribute('src');
      els.spritePreviewBadge.classList.add('hidden');
    }
  }

  function scheduleSpriteDetection() {
    clearTimeout(state.spriteTimer);
    state.spriteTimer = setTimeout(async () => {
      if (els.cardType.value === 'trainer') {
        updateSpritePreview('');
        return;
      }

      const nameVal = els.cardName.value.trim();
      const subVal = els.cardSubname.value.trim();
      if (!nameVal && !subVal) {
        updateSpritePreview('');
        return;
      }

      const targetSlug = PokeApiService.extractSlug(nameVal);
      const { url, dex } = await PokeApiService.resolvePokemon(nameVal, subVal);

      if (PokeApiService.extractSlug(els.cardName.value.trim()) === targetSlug) {
        if (dex && !els.cardSubname.value.trim()) {
          els.cardSubname.value = `#${String(dex).padStart(3, '0')}`;
        }
        updateSpritePreview(url);
      }
    }, 360);
  }

  async function searchTcgdexCards() {
    const query = els.cardName.value.trim();
    if (query.length < 2) {
      showFormError('Otomatik arama için en az 2 harf girin (örn: Charizard, Pikachu).');
      els.cardName.focus();
      return;
    }

    hideFormError();
    els.lookupDropdown.classList.remove('hidden');
    els.lookupDropdown.innerHTML = `<div class="lookup-status">"${escapeHtml(query)}" aranıyor...</div>`;

    if (state.lookupController) state.lookupController.abort();
    state.lookupController = new AbortController();

    try {
      const results = await TcgdexService.searchByName(query, {
        signal: state.lookupController.signal,
        limit: 18
      });

      if (results.length === 0) {
        els.lookupDropdown.innerHTML = '<div class="lookup-status">Sonuç bulunamadı.</div>';
        return;
      }

      const fragment = document.createDocumentFragment();
      results.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lookup-item';
        btn.dataset.cardId = item.id;
        btn.innerHTML = `
          <span class="lookup-item-name">${escapeHtml(item.name)}</span>
          <span class="lookup-item-meta">${escapeHtml(item.id)} · #${escapeHtml(item.localId)}</span>
        `;
        fragment.appendChild(btn);
      });

      els.lookupDropdown.replaceChildren(fragment);
    } catch (err) {
      if (err.name !== 'AbortError') {
        els.lookupDropdown.innerHTML = '<div class="lookup-status">Arama yapılamadı (çevrimdışı olabilirsiniz).</div>';
      }
    }
  }

  async function applyTcgdexCard(cardApiId) {
    els.lookupDropdown.innerHTML = '<div class="lookup-status">Kart detayları alınıyor...</div>';
    try {
      const detail = await TcgdexService.fetchCardDetails(cardApiId);
      if (detail.name) els.cardName.value = detail.name;

      const subParts = [];
      if (detail.dexNum) {
        subParts.push(`#${String(detail.dexNum).padStart(3, '0')}`);
        updateSpritePreview(`${POKEAPI_SPRITE_BASE}/${detail.dexNum}.png`);
      } else if (detail.category && detail.category !== 'Pokemon') {
        subParts.push(detail.category);
        updateSpritePreview('');
      } else {
        const fallback = await PokeApiService.resolvePokemon(detail.name, '');
        updateSpritePreview(fallback.url);
      }

      if (detail.rawRarity) subParts.push(detail.rawRarity);
      if (subParts.length > 0) {
        els.cardSubname.value = subParts.join(' · ');
      }

      els.cardType.value = detail.typeKey;
      if (detail.mappedRarity) els.cardRarity.value = detail.mappedRarity;

      const firstRow = els.variantsContainer.querySelector('.variant-item');
      if (firstRow) {
        if (detail.setName) firstRow.querySelector('.v-set').value = detail.setName;
        if (detail.formattedNumber) firstRow.querySelector('.v-number').value = detail.formattedNumber;
        firstRow.querySelector('.v-price')?.focus();
      }

      els.lookupDropdown.classList.add('hidden');
      showToast(`${detail.name} bilgileri dolduruldu.`);
    } catch {
      els.lookupDropdown.classList.add('hidden');
      showToast('Kart detayı alınamadı.');
    }
  }

  function updateVariantControlsState() {
    const rows = els.variantsContainer.querySelectorAll('.variant-item');
    rows.forEach(row => {
      const btn = row.querySelector('.btn-remove-variant');
      if (btn) btn.disabled = rows.length <= 1;
    });
    els.btnAddVariant.disabled = rows.length >= MAX_VARIANTS;
    els.btnAddVariant.title = rows.length >= MAX_VARIANTS
      ? `Kart üzerine en fazla ${MAX_VARIANTS} dil satırı sığar`
      : '';
  }

  function addVariantRow(variantData) {
    if (els.variantsContainer.children.length >= MAX_VARIANTS) return;
    if (!variantData) {
      const used = Array.from(els.variantsContainer.querySelectorAll('.v-lang')).map(s => s.value);
      const nextLang = PRINTED_LANGUAGES.find(l => !used.includes(l.code)) || PRINTED_LANGUAGES[0];
      variantData = { lang: nextLang.code, set: '', number: '', price: '', edition: '' };
    }
    els.variantsContainer.appendChild(PlaceholderRenderer.createVariantRow(variantData));
    updateVariantControlsState();
  }

  function renderSidebar() {
    PlaceholderRenderer.renderSidebarList({
      containerEl: els.cardListSidebar,
      cardCountEl: els.cardCountBadge,
      pageCountEl: els.pageCountBadge,
      cards: state.cards,
      editingId: els.editingCardId.value
    });
  }

  function renderAll() {
    renderSidebar();
    PlaceholderRenderer.renderA4Pages(els.a4PagesContainer, state.cards, state.settings);
  }

  function resetForm(preserveTemplate = false) {
    let templateRows = [{ lang: 'EN', set: '', number: '', price: '', edition: '' }];
    if (preserveTemplate && els.keepSetTemplate.checked) {
      const currentRows = Array.from(els.variantsContainer.querySelectorAll('.variant-item'));
      if (currentRows.length > 0) {
        templateRows = currentRows.map(item => ({
          lang: item.querySelector('.v-lang').value || 'EN',
          set: item.querySelector('.v-set').value.trim(),
          number: '',
          price: '',
          edition: item.querySelector('.v-edition').value.trim()
        }));
      }
    }

    const keepChecked = els.keepSetTemplate.checked;
    els.cardForm.reset?.();
    els.keepSetTemplate.checked = keepChecked;

    els.editingCardId.value = '';
    updateSpritePreview('');
    els.formTitle.textContent = 'Yeni kart';
    els.btnSubmitCard.textContent = 'Kartı ekle';
    els.btnCancelEdit.classList.add('hidden');
    els.lookupDropdown.classList.add('hidden');
    hideFormError();

    els.variantsContainer.replaceChildren();
    templateRows.forEach(r => addVariantRow(r));
    renderSidebar();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    hideFormError();

    const name = els.cardName.value.trim();
    let subname = els.cardSubname.value.trim();
    const type = els.cardType.value;
    const rarity = els.cardRarity.value;
    let imageUrl = normalizeSpriteUrl(els.cardImageUrl.value);
    const note = els.cardNote.value.trim();

    if (!name) {
      showFormError('Lütfen Pokémon / Kart adını girin.');
      els.cardName.focus();
      return;
    }

    const variantNodes = Array.from(els.variantsContainer.querySelectorAll('.variant-item'));
    const variants = [];

    for (let i = 0; i < variantNodes.length; i++) {
      const node = variantNodes[i];
      const lang = node.querySelector('.v-lang').value.trim() || 'EN';
      const set = node.querySelector('.v-set').value.trim();
      const number = node.querySelector('.v-number').value.trim();
      const price = node.querySelector('.v-price').value.trim();
      const edition = node.querySelector('.v-edition').value.trim();

      if (!set || !number || !price) {
        showFormError(`Lütfen #${i + 1}. dil satırındaki Set Adı, Set Numarası ve Fiyat alanlarını doldurun.`);
        return;
      }
      variants.push({ lang, set, number, price, edition });
    }

    if (!imageUrl && type !== 'trainer') {
      const resolved = await PokeApiService.resolvePokemon(name, subname);
      imageUrl = resolved.url;
      if (resolved.dex && !subname) {
        subname = `#${String(resolved.dex).padStart(3, '0')}`;
      }
    }

    const editingId = els.editingCardId.value;
    if (editingId) {
      const index = state.cards.findIndex(c => c.id === editingId);
      if (index !== -1) {
        state.cards[index] = {
          ...state.cards[index],
          name,
          subname,
          type,
          rarity,
          imageUrl,
          note,
          variants
        };
      }
    } else {
      state.cards.push({
        id: createId('card'),
        name,
        subname,
        type,
        rarity,
        imageUrl,
        note,
        variants
      });
    }

    AppStorage.saveCards(state.cards);
    resetForm(!editingId);
    renderAll();
    els.cardName.focus();
  }

  function startEditingCard(cardId) {
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    hideFormError();
    els.lookupDropdown.classList.add('hidden');
    els.editingCardId.value = card.id;
    els.cardName.value = card.name || '';
    els.cardSubname.value = card.subname || '';
    els.cardType.value = card.type || 'colorless';
    els.cardRarity.value = card.rarity || '';
    updateSpritePreview(card.imageUrl || '');
    els.cardNote.value = card.note || '';

    els.variantsContainer.replaceChildren();
    const list = Array.isArray(card.variants) && card.variants.length > 0
      ? card.variants
      : [{ lang: 'EN', set: '', number: '', price: '', edition: '' }];

    list.forEach(v => els.variantsContainer.appendChild(PlaceholderRenderer.createVariantRow(v)));
    updateVariantControlsState();

    els.formTitle.textContent = 'Kartı düzenle';
    els.btnSubmitCard.textContent = 'Değişiklikleri kaydet';
    els.btnCancelEdit.classList.remove('hidden');

    renderSidebar();
    els.cardName.focus();
  }

  function syncSettingsControls() {
    els.settingGapMode.value = state.settings.gapMode;
    els.settingThemeMode.value = state.settings.themeMode;
    els.settingQrProvider.value = state.settings.qrProvider;
    els.settingCropMarks.checked = state.settings.cropMarks;
    els.settingFillEmptySlots.checked = state.settings.fillEmptySlots;
  }

  function bindEvents() {
    els.btnAddVariant.addEventListener('click', () => {
      hideFormError();
      addVariantRow();
    });

    els.variantsContainer.addEventListener('click', e => {
      const removeBtn = e.target.closest('.btn-remove-variant');
      if (!removeBtn) return;
      if (els.variantsContainer.children.length <= 1) {
        showFormError('En az 1 adet Set, Set Numarası ve Fiyat girişi bulunmak zorundadır.');
        return;
      }
      removeBtn.closest('.variant-item')?.remove();
      updateVariantControlsState();
    });

    els.cardForm.addEventListener('submit', handleFormSubmit);
    els.btnCancelEdit.addEventListener('click', () => resetForm(false));

    els.btnLookupCard.addEventListener('click', searchTcgdexCards);
    els.lookupDropdown.addEventListener('click', e => {
      const item = e.target.closest('.lookup-item[data-card-id]');
      if (item?.dataset.cardId) applyTcgdexCard(item.dataset.cardId);
    });

    els.cardName.addEventListener('input', scheduleSpriteDetection);
    els.cardSubname.addEventListener('input', scheduleSpriteDetection);
    els.cardType.addEventListener('change', () => {
      if (els.cardType.value === 'trainer') updateSpritePreview('');
      else scheduleSpriteDetection();
    });

    els.cardName.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        searchTcgdexCards();
      }
    });

    els.cardListSidebar.addEventListener('click', e => {
      const actionEl = e.target.closest('[data-action]');
      const cardItem = e.target.closest('[data-card-id]');
      if (!actionEl || !cardItem) return;

      const id = cardItem.dataset.cardId;
      const action = actionEl.dataset.action;
      if (action === 'edit') {
        startEditingCard(id);
      } else if (action === 'dup') {
        const idx = state.cards.findIndex(c => c.id === id);
        if (idx !== -1) {
          const copy = structuredClone(state.cards[idx]);
          copy.id = createId('card');
          state.cards.splice(idx + 1, 0, copy);
          AppStorage.saveCards(state.cards);
          renderAll();
        }
      } else if (action === 'del') {
        state.cards = state.cards.filter(c => c.id !== id);
        if (els.editingCardId.value === id) resetForm(false);
        AppStorage.saveCards(state.cards);
        renderAll();
      }
    });

    els.a4PagesContainer.addEventListener('click', e => {
      const cardEl = e.target.closest('.tcg-card[data-card-id]');
      if (cardEl?.dataset.cardId) startEditingCard(cardEl.dataset.cardId);
    });

    const handleSettingChange = () => {
      state.settings.gapMode = els.settingGapMode.value;
      state.settings.themeMode = els.settingThemeMode.value;
      state.settings.qrProvider = els.settingQrProvider.value;
      state.settings.cropMarks = els.settingCropMarks.checked;
      state.settings.fillEmptySlots = els.settingFillEmptySlots.checked;
      AppStorage.savePlaceholderSettings(state.settings);
      PlaceholderRenderer.renderA4Pages(els.a4PagesContainer, state.cards, state.settings);
    };

    els.settingGapMode.addEventListener('change', handleSettingChange);
    els.settingThemeMode.addEventListener('change', handleSettingChange);
    els.settingQrProvider.addEventListener('change', handleSettingChange);
    els.settingCropMarks.addEventListener('change', handleSettingChange);
    els.settingFillEmptySlots.addEventListener('change', handleSettingChange);

    const openBulk = () => {
      els.bulkError.classList.add('hidden');
      els.bulkModal.classList.remove('hidden');
      els.bulkTextarea.focus();
    };
    const closeBulk = () => els.bulkModal.classList.add('hidden');

    els.btnShareLink.addEventListener('click', () => PlaceholderIO.copyShareableLink(state.cards));
    els.btnOpenBulk.addEventListener('click', openBulk);
    els.btnQuickBulk.addEventListener('click', openBulk);
    els.btnCloseBulk.addEventListener('click', closeBulk);
    els.btnCancelBulk.addEventListener('click', closeBulk);
    els.bulkModal.addEventListener('click', e => {
      if (e.target === els.bulkModal) closeBulk();
    });

    els.btnConfirmBulk.addEventListener('click', () => {
      const { cards, error } = PlaceholderIO.parseBulkText(els.bulkTextarea.value);
      if (error) {
        els.bulkError.textContent = error;
        els.bulkError.classList.remove('hidden');
        return;
      }
      if (cards.length > 0) {
        state.cards.push(...cards);
        AppStorage.saveCards(state.cards);
        renderAll();
        els.bulkTextarea.value = '';
        closeBulk();
        showToast(`${cards.length} kart eklendi.`);
      }
    });

    els.btnLoadSamples.addEventListener('click', () => {
      state.cards = SAMPLE_CARDS.map(sanitizeCard).filter(Boolean);
      AppStorage.saveCards(state.cards);
      resetForm(false);
      renderAll();
      showToast('Örnek kartlar yüklendi.');
    });

    els.btnExportJson.addEventListener('click', () => downloadJson('slotnine-cards', state.cards));

    els.inputImportFile.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onerror = () => {
        showToast('Dosya okunamadı.');
        els.inputImportFile.value = '';
      };
      reader.onload = ev => {
        try {
          const result = PlaceholderIO.parseFileContent(file.name, String(ev.target?.result || ''));
          if (result.error) {
            showToast(result.error);
          } else if (result.mode === 'replace') {
            if (state.cards.length === 0 || confirm(`${result.cards.length} kart bulundu. Mevcut ${state.cards.length} kartın yerine geçsin mi?`)) {
              state.cards = result.cards;
              AppStorage.saveCards(state.cards);
              resetForm(false);
              renderAll();
              showToast(`${result.cards.length} kart yüklendi.`);
            }
          } else {
            state.cards.push(...result.cards);
            AppStorage.saveCards(state.cards);
            renderAll();
            showToast(`${result.cards.length} kart CSV'den eklendi.`);
          }
        } catch {
          showToast('Dosya okunurken hata oluştu.');
        }
        els.inputImportFile.value = '';
      };
      reader.readAsText(file);
    });

    els.btnClearAll.addEventListener('click', () => {
      if (state.cards.length === 0) return;
      if (confirm('Sayfadaki tüm placeholder kartları temizlemek istediğinize emin misiniz?')) {
        state.cards = [];
        AppStorage.saveCards(state.cards);
        resetForm(false);
        renderAll();
        showToast('Tüm kartlar temizlendi.');
      }
    });

    els.btnPrint.addEventListener('click', () => window.print());

    els.moreMenu.addEventListener('click', e => {
      if (e.target.closest('button') || e.target.closest('.menu-file')) {
        setTimeout(() => els.moreMenu.removeAttribute('open'), 0);
      }
    });

    document.addEventListener('click', e => {
      if (!els.lookupDropdown.classList.contains('hidden')) {
        if (!els.lookupDropdown.contains(e.target) && e.target !== els.btnLookupCard && e.target !== els.cardName) {
          els.lookupDropdown.classList.add('hidden');
        }
      }
      if (els.moreMenu?.hasAttribute('open') && !els.moreMenu.contains(e.target)) {
        els.moreMenu.removeAttribute('open');
      }
    });
  }

  function init() {
    initPreviewZoom(els.zoomRange, els.zoomValue);
    state.cards = AppStorage.loadCards();
    state.settings = AppStorage.loadPlaceholderSettings();

    const sharedCards = PlaceholderIO.consumeUrlHashCards(state.cards.length);
    if (sharedCards) {
      state.cards = sharedCards;
      AppStorage.saveCards(state.cards);
      showToast(`Bağlantıdan ${sharedCards.length} kart yüklendi.`);
    }

    syncSettingsControls();
    resetForm(false);
    bindEvents();
    renderAll();
    consumeFlashToast();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
