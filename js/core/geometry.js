function computeCoverBox({ boxW, boxH, aspectRatio, zoom = 100, maxZoom = 300, panX = 0.5, panY = 0.5 }) {
  const boxAspect = boxW / boxH;
  const imgAspect = aspectRatio > 0 ? aspectRatio : (16 / 9);

  let baseW;
  let baseH;
  if (imgAspect >= boxAspect) {
    baseH = boxH;
    baseW = boxH * imgAspect;
  } else {
    baseW = boxW;
    baseH = boxW / imgAspect;
  }

  const scale = clamp(Number(zoom) || 100, 100, maxZoom) / 100;
  const imgW = baseW * scale;
  const imgH = baseH * scale;

  const maxOffsetX = Math.max(0, imgW - boxW);
  const maxOffsetY = Math.max(0, imgH - boxH);
  const offsetX = -clamp(panX ?? 0.5, 0, 1) * maxOffsetX;
  const offsetY = -clamp(panY ?? 0.5, 0, 1) * maxOffsetY;

  return {
    imgW,
    imgH,
    maxOffsetX,
    maxOffsetY,
    offsetX,
    offsetY
  };
}

function computeArtGeometry(piece, artSettings) {
  const tpl = ART_TEMPLATES[piece.tpl] || ART_TEMPLATES['2x1'];
  const { cols, rows } = tpl;
  const { colGap, rowGap } = artSettings;

  const spanW = cols * SLOT_WIDTH_MM + (cols - 1) * colGap;
  const spanH = rows * SLOT_HEIGHT_MM + (rows - 1) * rowGap;

  const cover = computeCoverBox({
    boxW: spanW,
    boxH: spanH,
    aspectRatio: piece.aspectRatio,
    zoom: piece.zoom,
    maxZoom: 300,
    panX: piece.panX,
    panY: piece.panY
  });

  return {
    cols,
    rows,
    colGap,
    rowGap,
    spanW,
    spanH,
    ...cover
  };
}
