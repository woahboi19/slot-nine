let activeToastTimer = null;

function showToast(message) {
  const toastEl = document.getElementById('toastNotice');
  if (!toastEl || !message) return;
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  clearTimeout(activeToastTimer);
  activeToastTimer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 3200);
}

function consumeFlashToast() {
  const msg = AppStorage.popFlashToast();
  if (msg) showToast(msg);
}

function initPreviewZoom(zoomRangeEl, zoomValueEl) {
  if (!zoomRangeEl || !zoomValueEl) return;

  const applyZoom = val => {
    zoomRangeEl.value = val;
    zoomValueEl.textContent = `${val}%`;
    document.documentElement.style.setProperty('--preview-zoom', String(val / 100));
  };

  const fitZoom = Math.floor(((window.innerWidth - 32) / 794) * 100);
  if (fitZoom < 85) {
    applyZoom(Math.max(30, fitZoom));
  }

  zoomRangeEl.addEventListener('input', () => {
    applyZoom(zoomRangeEl.value);
  });
}

function bindImageFallbacks(containerEl) {
  if (!containerEl) return;
  containerEl.querySelectorAll('img[data-hide-on-error]').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.hideOnError === 'parent' && img.parentElement) {
        img.parentElement.style.display = 'none';
      } else {
        img.style.display = 'none';
      }
    }, { once: true });
  });
}
