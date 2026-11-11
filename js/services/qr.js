const QrCodeService = (() => {
  const CAPACITIES_L = [0, 17, 32, 53, 78, 106, 134];
  const EC_COUNT_L = [0, 7, 10, 15, 20, 26, 36];
  const BLOCKS_L = [0, 1, 1, 1, 1, 1, 2];
  const ALIGN_POS = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];

  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  const svgCache = new Map();

  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // QR primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }

  function gfMultiply(a, b) {
    return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function createReedSolomonGenerator(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      const root = GF_EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMultiply(poly[j], root);
      }
      poly = next;
    }
    return poly;
  }

  function encodeReedSolomon(data, ecLength) {
    const gen = createReedSolomonGenerator(ecLength);
    const msg = new Uint8Array(data.length + ecLength);
    msg.set(data, 0);
    for (let i = 0; i < data.length; i++) {
      const coef = msg[i];
      if (coef !== 0) {
        for (let j = 0; j < gen.length; j++) {
          msg[i + j] ^= gfMultiply(gen[j], coef);
        }
      }
    }
    return msg.slice(data.length);
  }

  function getSvg(text) {
    if (!text) return '';
    if (svgCache.has(text)) return svgCache.get(text);

    const bytes = new TextEncoder().encode(text);
    let version = 1;
    while (version <= 6 && bytes.length > CAPACITIES_L[version]) version++;
    if (version > 6) return '';

    const totalDataBytes = CAPACITIES_L[version] + 2;
    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };

    pushBits(0b0100, 4);
    pushBits(bytes.length, 8);
    for (let i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);
    for (let i = 0; i < 4 && bits.length < totalDataBytes * 8; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const dataWords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      dataWords.push(byte);
    }

    let padToggle = true;
    while (dataWords.length < totalDataBytes) {
      dataWords.push(padToggle ? 0xec : 0x11);
      padToggle = !padToggle;
    }

    const numBlocks = BLOCKS_L[version];
    const ecPerBlock = EC_COUNT_L[version] / numBlocks;
    const dataPerBlock = totalDataBytes / numBlocks;

    const dataBlocks = [];
    const ecBlocks = [];
    for (let b = 0; b < numBlocks; b++) {
      const slice = dataWords.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
      dataBlocks.push(slice);
      ecBlocks.push(Array.from(encodeReedSolomon(slice, ecPerBlock)));
    }

    const codewords = [];
    for (let i = 0; i < dataPerBlock; i++) {
      for (let b = 0; b < numBlocks; b++) codewords.push(dataBlocks[b][i]);
    }
    for (let i = 0; i < ecPerBlock; i++) {
      for (let b = 0; b < numBlocks; b++) codewords.push(ecBlocks[b][i]);
    }

    const size = version * 4 + 17;
    const grid = Array.from({ length: size }, () => new Int8Array(size));
    const reserved = Array.from({ length: size }, () => new Uint8Array(size));

    const setModule = (r, c, val) => {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        grid[r][c] = val ? 1 : 0;
        reserved[r][c] = 1;
      }
    };

    const placeFinder = (row, col) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setModule(row + r, col + c, inOuter && (onBorder || inInner));
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    const align = ALIGN_POS[version];
    for (const ar of align) {
      for (const ac of align) {
        if (reserved[ar][ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            setModule(ar + r, ac + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
          }
        }
      }
    }

    for (let i = 8; i < size - 8; i++) {
      if (!reserved[6][i]) setModule(6, i, i % 2 === 0);
      if (!reserved[i][6]) setModule(i, 6, i % 2 === 0);
    }
    setModule(size - 8, 8, 1);

    for (let i = 0; i < 9; i++) {
      if (i !== 6) {
        reserved[8][i] = 1;
        reserved[i][8] = 1;
      }
    }
    for (let i = 0; i < 8; i++) {
      reserved[8][size - 1 - i] = 1;
      reserved[size - 1 - i][8] = 1;
    }

    let bitIdx = 0;
    const totalBits = codewords.length * 8;
    let upward = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        const r = upward ? size - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const c = right - j;
          if (!reserved[r][c]) {
            let dark = 0;
            if (bitIdx < totalBits) {
              dark = (codewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            if ((r + c) % 2 === 0) dark ^= 1;
            grid[r][c] = dark;
          }
        }
      }
      upward = !upward;
    }

    const fmt = 0x77c4;
    for (let i = 0; i <= 5; i++) grid[8][i] = (fmt >>> (14 - i)) & 1;
    grid[8][7] = (fmt >>> 8) & 1;
    grid[8][8] = (fmt >>> 7) & 1;
    grid[7][8] = (fmt >>> 6) & 1;
    for (let i = 9; i < 15; i++) grid[14 - i][8] = (fmt >>> (14 - i)) & 1;
    for (let i = 0; i < 8; i++) grid[8][size - 1 - i] = (fmt >>> i) & 1;
    for (let i = 8; i < 15; i++) grid[size - 15 + i][8] = (fmt >>> i) & 1;

    let path = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c]) path += `M${c},${r}h1v1h-1z`;
      }
    }

    const svg = `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-hidden="true"><path d="${path}" fill="#111"/></svg>`;
    svgCache.set(text, svg);
    return svg;
  }

  function buildMarketUrl(card, providerKey) {
    const provider = MARKET_PROVIDERS[providerKey];
    if (!provider) return '';
    const firstVariant = card.variants?.[0] || { set: '', number: '' };
    const numPart = String(firstVariant.number || '').split('/')[0].trim();
    const query = encodeURIComponent([card.name, firstVariant.set, numPart].filter(Boolean).join(' '));
    return provider.buildUrl(query);
  }

  return {
    getSvg,
    buildMarketUrl
  };
})();
