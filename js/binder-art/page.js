(() => {
  const state = {
    items: [],
    activeId: '',
    settings: {
      colGap: 4,
      rowGap: 5,
      notchDepth: 63,
      showNotchGuides: true,
      showPocketFold: true
    },
    drag: null
  };

  const els = {
    artFileInput: document.getElementById('artFileInput'),
    btnArtSampleImg: document.getElementById('btnArtSampleImg'),
    artTemplateGrid: document.getElementById('artTemplateGrid'),
    artCutMode: document.getElementById('artCutMode'),
    artZoomRange: document.getElementById('artZoomRange'),
    artZoomValue: document.getElementById('artZoomValue'),
    btnArtResetPan: document.getElementById('btnArtResetPan'),
    artCaption: document.getElementById('artCaption'),
    artCaptionPos: document.getElementById('artCaptionPos'),
    btnAddArtItem: document.getElementById('btnAddArtItem'),
    artColGap: document.getElementById('artColGap'),
    artRowGap: document.getElementById('artRowGap'),
    artNotchDepth: document.getElementById('artNotchDepth'),
    artShowNotchGuides: document.getElementById('artShowNotchGuides'),
    artShowPocketFold: document.getElementById('artShowPocketFold'),
    artQueueCount: document.getElementById('artQueueCount'),
    btnClearArtQueue: document.getElementById('btnClearArtQueue'),
    artQueueList: document.getElementById('artQueueList'),
    a4PagesContainer: document.getElementById('a4PagesContainer'),
    zoomRange: document.getElementById('zoomRange'),
    zoomValue: document.getElementById('zoomValue'),
    btnPrint: document.getElementById('btnPrint')
  };

  function getActiveArtPiece() {
    let piece = state.items.find(item => item.id === state.activeId);
    if (!piece) {
      if (state.items.length === 0) {
        piece = createArtPiece();
        state.items.push(piece);
      } else {
        piece = state.items[0];
      }
      state.activeId = piece.id;
    }
    return piece;
  }

  function syncArtFormControls() {
    const piece = getActiveArtPiece();
    els.artTemplateGrid.querySelectorAll('.art-tpl-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tpl === piece.tpl);
    });
    els.artCutMode.value = piece.cutMode;
    els.artZoomRange.value = piece.zoom;
    els.artZoomValue.textContent = `${piece.zoom}%`;
    els.artCaption.value = piece.caption || '';
    els.artCaptionPos.value = piece.captionPos || 'bottom-right';
  }

  function syncSettingsControls() {
    els.artColGap.value = state.settings.colGap;
    els.artRowGap.value = state.settings.rowGap;
    els.artNotchDepth.value = state.settings.notchDepth;
    els.artShowNotchGuides.checked = state.settings.showNotchGuides;
    els.artShowPocketFold.checked = state.settings.showPocketFold;
  }

  function renderQueue() {
    BinderArtRenderer.renderQueueList({
      containerEl: els.artQueueList,
      countEl: els.artQueueCount,
      items: state.items,
      activeId: state.activeId
    });
  }

  function renderA4() {
    BinderArtRenderer.renderA4Pages({
      containerEl: els.a4PagesContainer,
      items: state.items,
      activeId: state.activeId,
      settings: state.settings
    });
  }

  function renderAll() {
    renderQueue();
    renderA4();
  }

  function persistQueueAndRender() {
    AppStorage.saveArtQueue(state.items);
    renderAll();
  }

  function bindEvents() {
    els.a4PagesContainer.addEventListener('pointerdown', e => {
      const pieceEl = e.target.closest('.art-bridge-piece[data-art-id]');
      if (!pieceEl) return;

      const artId = pieceEl.dataset.artId;
      const piece = state.items.find(item => item.id === artId);
      if (!piece) return;

      if (state.activeId !== artId) {
        state.activeId = artId;
        syncArtFormControls();
        BinderArtRenderer.updateActiveSelection(els.artQueueList, els.a4PagesContainer, state.items, state.activeId);
      }

      e.preventDefault();
      pieceEl.setPointerCapture?.(e.pointerId);

      const rect = pieceEl.getBoundingClientRect();
      const geo = computeArtGeometry(piece, state.settings);
      const isSplitTile = pieceEl.classList.contains('art-split-tile');
      const refMmW = isSplitTile ? SLOT_WIDTH_MM : geo.spanW;
      const pxPerMm = rect.width > 0 ? rect.width / refMmW : 3.78;

      state.drag = {
        pointerId: e.pointerId,
        artId,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: piece.panX,
        startPanY: piece.panY,
        maxOffsetX: geo.maxOffsetX,
        maxOffsetY: geo.maxOffsetY,
        pxPerMm
      };
    });

    window.addEventListener('pointermove', e => {
      const drag = state.drag;
      if (!drag || e.pointerId !== drag.pointerId) return;
      const piece = state.items.find(item => item.id === drag.artId);
      if (!piece) return;

      const dxMm = (e.clientX - drag.startX) / drag.pxPerMm;
      const dyMm = (e.clientY - drag.startY) / drag.pxPerMm;

      if (drag.maxOffsetX > 0.1) {
        piece.panX = clamp(drag.startPanX - dxMm / drag.maxOffsetX, 0, 1);
      }
      if (drag.maxOffsetY > 0.1) {
        piece.panY = clamp(drag.startPanY - dyMm / drag.maxOffsetY, 0, 1);
      }

      BinderArtRenderer.updatePieceTransform(els.a4PagesContainer, piece, state.settings);
    });

    const endArtDrag = e => {
      if (state.drag && e.pointerId === state.drag.pointerId) {
        state.drag = null;
        AppStorage.saveArtQueue(state.items);
      }
    };
    window.addEventListener('pointerup', endArtDrag);
    window.addEventListener('pointercancel', endArtDrag);

    els.artFileInput.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      els.artFileInput.value = '';
      if (!file) return;
      try {
        const { dataUrl, aspectRatio, title } = await readImageFile(file);
        const piece = getActiveArtPiece();
        piece.imageSrc = dataUrl;
        piece.aspectRatio = aspectRatio;
        piece.title = title;
        piece.panX = 0.5;
        piece.panY = 0.5;
        persistQueueAndRender();
        showToast('Görsel yüklendi. Önizleme üzerinde sürükleyerek hizalayabilirsiniz.');
      } catch {
        showToast('Görsel okunamadı.');
      }
    });

    els.btnArtSampleImg.addEventListener('click', () => {
      const piece = getActiveArtPiece();
      piece.imageSrc = createSampleLandscapeDataUrl();
      piece.aspectRatio = 1600 / 900;
      piece.title = 'Örnek Manzara';
      piece.panX = 0.5;
      piece.panY = 0.5;
      persistQueueAndRender();
      showToast('Örnek manzara görseli yüklendi.');
    });

    els.artTemplateGrid.addEventListener('click', e => {
      const btn = e.target.closest('.art-tpl-btn[data-tpl]');
      if (!btn) return;
      const tpl = btn.dataset.tpl;
      if (!ART_TEMPLATES[tpl]) return;
      const piece = getActiveArtPiece();
      piece.tpl = tpl;
      syncArtFormControls();
      persistQueueAndRender();
    });

    els.artCutMode.addEventListener('change', () => {
      const piece = getActiveArtPiece();
      piece.cutMode = els.artCutMode.value === 'split' ? 'split' : 'bridge';
      persistQueueAndRender();
    });

    els.artZoomRange.addEventListener('input', () => {
      const piece = getActiveArtPiece();
      piece.zoom = Number(els.artZoomRange.value) || 100;
      els.artZoomValue.textContent = `${piece.zoom}%`;
      AppStorage.saveArtQueue(state.items);
      BinderArtRenderer.updatePieceTransform(els.a4PagesContainer, piece, state.settings);
    });

    els.btnArtResetPan.addEventListener('click', () => {
      const piece = getActiveArtPiece();
      piece.panX = 0.5;
      piece.panY = 0.5;
      piece.zoom = 100;
      syncArtFormControls();
      AppStorage.saveArtQueue(state.items);
      BinderArtRenderer.updatePieceTransform(els.a4PagesContainer, piece, state.settings);
    });

    els.artCaption.addEventListener('input', () => {
      const piece = getActiveArtPiece();
      piece.caption = els.artCaption.value;
      AppStorage.saveArtQueue(state.items);
      BinderArtRenderer.updatePieceCaption(els.artQueueList, els.a4PagesContainer, piece);
    });

    els.artCaptionPos.addEventListener('change', () => {
      const piece = getActiveArtPiece();
      piece.captionPos = els.artCaptionPos.value;
      AppStorage.saveArtQueue(state.items);
      BinderArtRenderer.updatePieceCaption(els.artQueueList, els.a4PagesContainer, piece);
    });

    els.btnAddArtItem.addEventListener('click', () => {
      const current = getActiveArtPiece();
      const copy = createArtPiece(current);
      state.items.push(copy);
      state.activeId = copy.id;
      syncArtFormControls();
      persistQueueAndRender();
      showToast('Sayfaya yeni Binder Art parçası eklendi.');
    });

    els.artQueueList.addEventListener('click', e => {
      const actionEl = e.target.closest('[data-art-action]');
      const itemEl = e.target.closest('[data-art-id]');
      if (!actionEl || !itemEl) return;

      const id = itemEl.dataset.artId;
      const action = actionEl.dataset.artAction;

      if (action === 'select') {
        state.activeId = id;
        syncArtFormControls();
        BinderArtRenderer.updateActiveSelection(els.artQueueList, els.a4PagesContainer, state.items, state.activeId);
      } else if (action === 'dup') {
        const idx = state.items.findIndex(item => item.id === id);
        if (idx !== -1) {
          const copy = createArtPiece(state.items[idx]);
          state.items.splice(idx + 1, 0, copy);
          state.activeId = copy.id;
          syncArtFormControls();
          persistQueueAndRender();
        }
      } else if (action === 'del') {
        if (state.items.length <= 1) {
          const fresh = createArtPiece();
          state.items = [fresh];
          state.activeId = fresh.id;
        } else {
          state.items = state.items.filter(item => item.id !== id);
          if (state.activeId === id) {
            state.activeId = state.items[0].id;
          }
        }
        syncArtFormControls();
        persistQueueAndRender();
      }
    });

    els.btnClearArtQueue.addEventListener('click', () => {
      const fresh = createArtPiece();
      state.items = [fresh];
      state.activeId = fresh.id;
      syncArtFormControls();
      persistQueueAndRender();
      showToast('Baskı kuyruğu sıfırlandı.');
    });

    const handleArtSettingChange = () => {
      state.settings.colGap = clamp(Number(els.artColGap.value) || 0, 0, 12);
      state.settings.rowGap = clamp(Number(els.artRowGap.value) || 0, 0, 12);
      state.settings.notchDepth = clamp(Number(els.artNotchDepth.value) || 63, 20, 63);
      state.settings.showNotchGuides = els.artShowNotchGuides.checked;
      state.settings.showPocketFold = els.artShowPocketFold.checked;
      AppStorage.saveArtSettings(state.settings);
      renderA4();
    };

    els.artColGap.addEventListener('input', handleArtSettingChange);
    els.artRowGap.addEventListener('input', handleArtSettingChange);
    els.artNotchDepth.addEventListener('input', handleArtSettingChange);
    els.artShowNotchGuides.addEventListener('change', handleArtSettingChange);
    els.artShowPocketFold.addEventListener('change', handleArtSettingChange);

    els.btnPrint.addEventListener('click', () => window.print());
  }

  function init() {
    initPreviewZoom(els.zoomRange, els.zoomValue);
    state.settings = AppStorage.loadArtSettings();
    state.items = AppStorage.loadArtQueue();
    state.activeId = state.items[0]?.id || '';
    syncSettingsControls();
    syncArtFormControls();
    bindEvents();
    renderAll();
    consumeFlashToast();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
