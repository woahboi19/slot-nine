const DigitalBinderRenderer = (() => {
  function createPageElement(binder, page, pageNumber, spec, viewState) {
    const pageCard = document.createElement('div');
    pageCard.className = 'binder-page-card';
    pageCard.dataset.pageId = page.id;

    const topBar = document.createElement('div');
    topBar.className = 'binder-page-top';
    topBar.innerHTML = `
      <span class="binder-page-num">SAYFA ${pageNumber}</span>
      <input type="text" class="binder-page-title-input" data-page-title-id="${escapeHtml(page.id)}" value="${escapeHtml(page.title || `Sayfa ${pageNumber}`)}" placeholder="Sayfa başlığı..." aria-label="Sayfa başlığı" />
    `;
    pageCard.appendChild(topBar);

    const grid = document.createElement('div');
    grid.className = `binder-page-grid grid-${binder.gridSize || '3x3'}`;
    grid.style.setProperty('--b-cols', String(spec.cols));
    grid.style.setProperty('--b-rows', String(spec.rows));

    const cellMap = BinderModel.buildPageOccupancy(page, spec.cols, spec.rows);
    const isSingle = viewState.viewMode === 'single';
    const is4x3 = binder.gridSize === '4x3';
    const slotPxW = isSingle ? 162 : (is4x3 ? 108 : 132);
    const slotPxH = isSingle ? 226 : (is4x3 ? 151 : 184);
    const gapPxX = isSingle ? 11 : (is4x3 ? 7 : 9);
    const gapPxY = isSingle ? 13 : (is4x3 ? 9 : 11);

    for (let r = 0; r < spec.rows; r++) {
      for (let c = 0; c < spec.cols; c++) {
        const slotIdx = r * spec.cols + c;
        const entry = cellMap.get(slotIdx);

        if (entry && !entry.isOrigin) continue;

        const pocket = document.createElement('div');
        pocket.className = 'binder-pocket';
        pocket.dataset.pageId = page.id;
        pocket.dataset.slotIndex = String(slotIdx);

        const isSelected =
          page.id === viewState.selectedPageId &&
          (entry?.item ? viewState.selectedSlotIndex === entry.item.slotIndex : viewState.selectedSlotIndex === slotIdx);

        if (isSelected) pocket.classList.add('selected-pocket');

        if (!entry) {
          pocket.classList.add('empty-pocket');
          pocket.style.gridColumn = `${c + 1}`;
          pocket.style.gridRow = `${r + 1}`;
          pocket.innerHTML = `
            <span class="empty-pocket-num">#${slotIdx + 1}</span>
            <span class="empty-pocket-plus">+</span>
          `;
        } else if (entry.item.kind === 'card') {
          const card = entry.item;
          pocket.style.gridColumn = `${c + 1}`;
          pocket.style.gridRow = `${r + 1}`;
          pocket.draggable = true;
          pocket.dataset.itemId = card.id;

          const isMissing = card.owned === false;
          if (isMissing && binder.missingStyle === 'placeholder') {
            const holder = document.createElement('div');
            holder.className = 'binder-placeholder-mini';
            holder.innerHTML = `
              <div class="bpm-head">
                <div class="bpm-name">${escapeHtml(card.name)}</div>
                ${card.spriteUrl ? `<img class="bpm-sprite" src="${escapeHtml(card.spriteUrl)}" alt="" data-hide-on-error="self" />` : ''}
              </div>
              <div class="bpm-body">
                <div class="bpm-set">${escapeHtml(card.set || 'Pokémon TCG')}</div>
                <div class="bpm-meta">
                  <span>${escapeHtml(card.number || '')}</span>
                  <strong>${escapeHtml(card.price || '')}</strong>
                </div>
              </div>
              <div class="bpm-foot">Eksik · Yer Tutucu</div>
            `;
            pocket.appendChild(holder);
          } else {
            const slotWrap = document.createElement('div');
            slotWrap.className = `binder-card-slot${isMissing ? ' is-missing' : ''}`;
            const imgUrl = card.cardArtUrl || card.spriteUrl || '';
            slotWrap.innerHTML = `
              ${imgUrl ? `<img class="binder-card-art-img" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(card.name)}" decoding="async" data-hide-on-error="self" />` : ''}
              <span class="binder-status-badge ${isMissing ? 'status-missing' : 'status-owned'}" data-toggle-owned="${escapeHtml(card.id)}" title="Sahibim / Eksik durumunu değiştirmek için tıklayın">
                ${isMissing ? 'EKSİK' : 'VAR'}
              </span>
              <div class="binder-card-overlay-bar">
                <div class="binder-card-title">${escapeHtml(card.name)}</div>
                <div class="binder-card-sub">
                  <span>${escapeHtml(card.number || card.set || '')}</span>
                  <span>${escapeHtml(card.price || '')}</span>
                </div>
              </div>
            `;
            pocket.appendChild(slotWrap);
          }
        } else if (entry.item.kind === 'art') {
          const art = entry.item;
          const { colSpan, rowSpan } = entry.bounds;
          pocket.style.gridColumn = `${c + 1} / span ${colSpan}`;
          pocket.style.gridRow = `${r + 1} / span ${rowSpan}`;
          pocket.dataset.artItemId = art.id;
          pocket.title = 'Kadrajı kaydırmak için sürükleyin, düzenlemek için tıklayın';

          const totalPxW = colSpan * slotPxW + (colSpan - 1) * gapPxX;
          const totalPxH = rowSpan * slotPxH + (rowSpan - 1) * gapPxY;
          const cover = computeCoverBox({
            boxW: totalPxW,
            boxH: totalPxH,
            aspectRatio: art.aspectRatio,
            zoom: art.zoom,
            maxZoom: 280,
            panX: art.panX,
            panY: art.panY
          });

          const artBox = document.createElement('div');
          artBox.className = 'binder-art-slot';
          artBox.dataset.panPageId = page.id;
          artBox.dataset.panArtId = art.id;
          artBox.dataset.boxW = String(totalPxW);
          artBox.dataset.boxH = String(totalPxH);
          artBox.dataset.maxOffX = String(cover.maxOffsetX);
          artBox.dataset.maxOffY = String(cover.maxOffsetY);

          const imgEl = document.createElement('img');
          imgEl.src = art.imageSrc;
          imgEl.alt = art.title || 'Binder Art';
          imgEl.style.width = `${cover.imgW}px`;
          imgEl.style.height = `${cover.imgH}px`;
          imgEl.style.transform = `translate(${cover.offsetX}px, ${cover.offsetY}px)`;
          artBox.appendChild(imgEl);

          for (let sc = 1; sc < colSpan; sc++) {
            const seamV = document.createElement('div');
            seamV.className = 'binder-art-seam-v';
            seamV.style.left = `${sc * slotPxW + (sc - 1) * gapPxX}px`;
            seamV.style.width = `${gapPxX}px`;
            artBox.appendChild(seamV);
          }
          for (let sr = 1; sr < rowSpan; sr++) {
            const seamH = document.createElement('div');
            seamH.className = 'binder-art-seam-h';
            seamH.style.top = `${sr * slotPxH + (sr - 1) * gapPxY}px`;
            seamH.style.height = `${gapPxY}px`;
            artBox.appendChild(seamH);
          }

          if (art.caption) {
            const tag = document.createElement('div');
            tag.className = 'binder-art-tag';
            tag.textContent = `${art.caption} (${colSpan}×${rowSpan})`;
            artBox.appendChild(tag);
          }

          pocket.appendChild(artBox);
        }

        bindImageFallbacks(pocket);
        grid.appendChild(pocket);
      }
    }

    pageCard.appendChild(grid);
    return pageCard;
  }

  function renderBinderStage({ viewportEl, indicatorEl, prevBtn, nextBtn, statsEl, binder, viewState }) {
    const spec = BinderModel.getGridSpec(binder);
    const totalPages = binder.pages.length;
    const isSpread = viewState.viewMode === 'spread';
    const startIdx = viewState.pageIndex;

    if (isSpread) {
      const rightNum = Math.min(totalPages, startIdx + 2);
      indicatorEl.textContent = startIdx + 1 === rightNum
        ? `Sayfa ${startIdx + 1} / ${totalPages}`
        : `Sayfa ${startIdx + 1}–${rightNum} / ${totalPages}`;
      prevBtn.disabled = startIdx <= 0;
      nextBtn.disabled = startIdx + 2 >= totalPages;
    } else {
      indicatorEl.textContent = `Sayfa ${startIdx + 1} / ${totalPages}`;
      prevBtn.disabled = startIdx <= 0;
      nextBtn.disabled = startIdx + 1 >= totalPages;
    }

    const { totalCards, ownedCards, missingCards, totalArt } = BinderModel.computeBinderStats(binder);
    statsEl.textContent =
      `${binder.name} (${spec.cols}×${spec.rows}) · Toplam ${totalCards} kart (${ownedCards} Sahibim, ${missingCards} Eksik) · ${totalArt} Binder Art`;

    const book = document.createElement('div');
    book.className = `binder-book view-${viewState.viewMode}`;

    const leftPage = binder.pages[startIdx];
    if (leftPage) {
      book.appendChild(createPageElement(binder, leftPage, startIdx + 1, spec, viewState));
    }

    if (isSpread) {
      const spine = document.createElement('div');
      spine.className = 'binder-spine';
      spine.innerHTML = '<span class="binder-ring"></span><span class="binder-ring"></span><span class="binder-ring"></span>';
      book.appendChild(spine);

      const rightPage = binder.pages[startIdx + 1];
      if (rightPage) {
        book.appendChild(createPageElement(binder, rightPage, startIdx + 2, spec, viewState));
      } else {
        const cover = document.createElement('div');
        cover.className = 'binder-page-card empty-cover-page';
        cover.innerHTML = `
          <div>Sağ sayfa henüz yok.</div>
          <button type="button" class="btn btn-sm empty-cover-btn" data-quick-add-page="1">+ Yeni Sayfa Ekle</button>
        `;
        book.appendChild(cover);
      }
    }

    viewportEl.replaceChildren(book);
  }

  function updateSelectedPocket(viewportEl, viewState) {
    viewportEl.querySelectorAll('.binder-pocket[data-page-id]').forEach(pocket => {
      const isSelected =
        pocket.dataset.pageId === viewState.selectedPageId &&
        Number(pocket.dataset.slotIndex) === viewState.selectedSlotIndex;
      pocket.classList.toggle('selected-pocket', isSelected);
    });
  }

  function updateArtSlotTransform(viewportEl, artItem) {
    viewportEl.querySelectorAll('.binder-art-slot[data-pan-art-id]').forEach(artBox => {
      if (artBox.dataset.panArtId !== artItem.id) return;
      const boxW = Number(artBox.dataset.boxW) || 400;
      const boxH = Number(artBox.dataset.boxH) || 184;
      const cover = computeCoverBox({
        boxW,
        boxH,
        aspectRatio: artItem.aspectRatio,
        zoom: artItem.zoom,
        maxZoom: 280,
        panX: artItem.panX,
        panY: artItem.panY
      });
      artBox.dataset.maxOffX = String(cover.maxOffsetX);
      artBox.dataset.maxOffY = String(cover.maxOffsetY);

      const imgEl = artBox.querySelector('img');
      if (imgEl) {
        imgEl.style.width = `${cover.imgW}px`;
        imgEl.style.height = `${cover.imgH}px`;
        imgEl.style.transform = `translate(${cover.offsetX}px, ${cover.offsetY}px)`;
      }
    });
  }

  function updateStatsBar(statsEl, binder) {
    const spec = BinderModel.getGridSpec(binder);
    const { totalCards, ownedCards, missingCards, totalArt } = BinderModel.computeBinderStats(binder);
    statsEl.textContent =
      `${binder.name} (${spec.cols}×${spec.rows}) · Toplam ${totalCards} kart (${ownedCards} Sahibim, ${missingCards} Eksik) · ${totalArt} Binder Art`;
  }

  return {
    renderBinderStage,
    updateSelectedPocket,
    updateArtSlotTransform,
    updateStatsBar
  };
})();
