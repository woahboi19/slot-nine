function downloadJson(filenamePrefix, data) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${dateStamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseCsvText(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some(f => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some(f => f.trim() !== '')) rows.push(row);
  return rows;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read failed'));
    reader.onload = e => {
      const dataUrl = String(e.target?.result || '');
      if (!dataUrl) {
        reject(new Error('Empty image data'));
        return;
      }
      const probe = new Image();
      probe.onerror = () => reject(new Error('Image decode failed'));
      probe.onload = () => {
        const aspectRatio = probe.naturalWidth && probe.naturalHeight
          ? probe.naturalWidth / probe.naturalHeight
          : 16 / 9;
        const title = file.name.replace(/\.[^.]+$/, '') || 'Yüklenen Görsel';
        resolve({ dataUrl, aspectRatio, title, width: probe.naturalWidth, height: probe.naturalHeight });
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function readAndCompressImage(file, maxDim = 1000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Read failed'));
    reader.onload = e => {
      const rawUrl = String(e.target?.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('Image decode failed'));
      img.onload = () => {
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 600;
        const aspectRatio = w / h;
        if (rawUrl.startsWith('data:image/svg') || (w <= maxDim && h <= maxDim && file.size < 180000)) {
          resolve({ dataUrl: rawUrl, aspectRatio });
          return;
        }
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, cw, ch);
        let compressed = canvas.toDataURL('image/webp', 0.82);
        if (!compressed || compressed.length > rawUrl.length) {
          compressed = canvas.toDataURL('image/jpeg', 0.82);
        }
        resolve({ dataUrl: compressed, aspectRatio });
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}
