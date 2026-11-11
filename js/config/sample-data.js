const SAMPLE_CARDS = [
  {
    id: 'sample-1',
    name: 'Charizard ex',
    subname: '#006 · Special Illustration',
    type: 'fire',
    rarity: 'Special Illustration Rare',
    imageUrl: `${POKEAPI_SPRITE_BASE}/6.png`,
    note: 'PSA 10 / NM Hedef',
    variants: [
      { lang: 'EN', set: 'Paldean Fates', number: '234/091', price: '$115.00', edition: 'SIR' },
      { lang: 'JP', set: 'Shiny Treasure ex', number: '349/190', price: '¥16,500', edition: 'SAR' }
    ]
  },
  {
    id: 'sample-2',
    name: 'Umbreon VMAX',
    subname: '#197 · Moonbreon Alt Art',
    type: 'darkness',
    rarity: 'Ultra Rare',
    imageUrl: `${POKEAPI_SPRITE_BASE}/197.png`,
    note: 'Grail Kart',
    variants: [
      { lang: 'EN', set: 'Evolving Skies', number: '215/203', price: '$920.00', edition: 'Alt Art' },
      { lang: 'JP', set: 'Eevee Heroes', number: '095/069', price: '¥210,000', edition: 'HR' },
      { lang: 'KR', set: 'Eevee Heroes', number: '095/069', price: '₩450,000', edition: '' }
    ]
  },
  {
    id: 'sample-3',
    name: 'Pikachu with Grey Felt Hat',
    subname: '#025 · Van Gogh Museum',
    type: 'lightning',
    rarity: 'Promo',
    imageUrl: `${POKEAPI_SPRITE_BASE}/25.png`,
    note: 'Sealed / Jelatinli',
    variants: [
      { lang: 'EN', set: 'SV Black Star Promos', number: 'SVP 085', price: '$105.00', edition: 'Sealed' }
    ]
  },
  {
    id: 'sample-4',
    name: 'Giratina V',
    subname: '#487 · Alternate Full Art',
    type: 'dragon',
    rarity: 'Ultra Rare',
    imageUrl: `${POKEAPI_SPRITE_BASE}/487.png`,
    note: 'Merkez Sayfa',
    variants: [
      { lang: 'EN', set: 'Lost Origin', number: '186/196', price: '$380.00', edition: 'Alt Art' },
      { lang: 'JP', set: 'Lost Abyss', number: '111/100', price: '¥68,000', edition: 'SR' }
    ]
  },
  {
    id: 'sample-5',
    name: 'Mew ex',
    subname: '#151 · Bubble Mew',
    type: 'psychic',
    rarity: 'Special Illustration Rare',
    imageUrl: `${POKEAPI_SPRITE_BASE}/151.png`,
    note: 'Mint Aranıyor',
    variants: [
      { lang: 'EN', set: 'Paldean Fates', number: '232/091', price: '$95.00', edition: 'SIR' },
      { lang: 'JP', set: 'Shiny Treasure ex', number: '347/190', price: '¥13,000', edition: 'SAR' }
    ]
  },
  {
    id: 'sample-6',
    name: 'Gengar',
    subname: '#094 · 151 Master Set',
    type: 'psychic',
    rarity: 'Rare',
    imageUrl: `${POKEAPI_SPRITE_BASE}/94.png`,
    note: '151 Master Set',
    variants: [
      { lang: 'EN', set: 'Pokémon Card 151', number: '094/165', price: '$1.50', edition: 'Reverse Holo' },
      { lang: 'JP', set: 'Pokémon Card 151', number: '094/165', price: '¥5,500', edition: 'Master Ball' }
    ]
  },
  {
    id: 'sample-7',
    name: 'Blastoise ex',
    subname: '#009 · 151 Special Art',
    type: 'water',
    rarity: 'Special Illustration Rare',
    imageUrl: `${POKEAPI_SPRITE_BASE}/9.png`,
    note: 'Kanto Starter Seti',
    variants: [
      { lang: 'EN', set: 'Pokémon Card 151', number: '200/165', price: '$54.00', edition: 'SIR' },
      { lang: 'JP', set: 'Pokémon Card 151', number: '202/165', price: '¥7,800', edition: 'SAR' }
    ]
  },
  {
    id: 'sample-8',
    name: 'Venusaur ex',
    subname: '#003 · 151 Special Art',
    type: 'grass',
    rarity: 'Special Illustration Rare',
    imageUrl: `${POKEAPI_SPRITE_BASE}/3.png`,
    note: 'Kanto Starter Seti',
    variants: [
      { lang: 'EN', set: 'Pokémon Card 151', number: '198/165', price: '$48.00', edition: 'SIR' },
      { lang: 'JP', set: 'Pokémon Card 151', number: '200/165', price: '¥6,900', edition: 'SAR' }
    ]
  },
  {
    id: 'sample-9',
    name: 'Iono',
    subname: 'Supporter · Paldea Gym Leader',
    type: 'trainer',
    rarity: 'Special Illustration Rare',
    imageUrl: '',
    note: 'Full Art Trainer',
    variants: [
      { lang: 'EN', set: 'Paldea Evolved', number: '269/193', price: '$65.00', edition: 'SIR' },
      { lang: 'JP', set: 'Clay Burst', number: '096/071', price: '¥52,000', edition: 'SAR' }
    ]
  }
];

function createSampleLandscapeDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a2436"/>
        <stop offset="45%" stop-color="#3b526b"/>
        <stop offset="78%" stop-color="#c97b63"/>
        <stop offset="100%" stop-color="#f2c17d"/>
      </linearGradient>
      <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b86b58"/>
        <stop offset="40%" stop-color="#3c4f65"/>
        <stop offset="100%" stop-color="#18222f"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="620" fill="url(#sky)"/>
    <circle cx="1060" cy="390" r="115" fill="#fae09e" opacity="0.9"/>
    <circle cx="1060" cy="390" r="155" fill="#fae09e" opacity="0.22"/>
    <polygon points="0,620 0,430 190,320 390,460 610,250 860,470 1120,290 1370,440 1600,310 1600,620" fill="#465366" opacity="0.65"/>
    <polygon points="0,620 110,390 310,510 530,330 780,520 980,370 1240,510 1460,360 1600,450 1600,620" fill="#2b3748"/>
    <polygon points="0,620 0,510 230,450 450,560 720,430 960,570 1290,440 1600,530 1600,620" fill="#1b2430"/>
    <rect y="620" width="1600" height="280" fill="url(#lake)"/>
    <ellipse cx="1060" cy="650" rx="110" ry="8" fill="#fae09e" opacity="0.55"/>
    <ellipse cx="1060" cy="680" rx="85" ry="6" fill="#fae09e" opacity="0.4"/>
    <ellipse cx="1060" cy="710" rx="60" ry="5" fill="#fae09e" opacity="0.28"/>
    <path d="M0,900 L0,740 Q260,710 520,780 L520,900 Z" fill="#0f151d"/>
    <path d="M1600,900 L1600,720 Q1310,695 1080,790 L1080,900 Z" fill="#0f151d"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createArtPiece(overrides = {}) {
  return {
    id: `art-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: overrides.title || 'Örnek Manzara',
    imageSrc: overrides.imageSrc || createSampleLandscapeDataUrl(),
    aspectRatio: overrides.aspectRatio || (1600 / 900),
    tpl: ART_TEMPLATES[overrides.tpl] ? overrides.tpl : '2x1',
    cutMode: overrides.cutMode === 'split' ? 'split' : 'bridge',
    zoom: Number(overrides.zoom) || 100,
    panX: typeof overrides.panX === 'number' ? overrides.panX : 0.5,
    panY: typeof overrides.panY === 'number' ? overrides.panY : 0.5,
    caption: overrides.caption ?? 'Pokémon Card 151',
    captionPos: overrides.captionPos || 'bottom-right'
  };
}

function createDefaultBinders() {
  const sampleLandscape = createSampleLandscapeDataUrl();
  const sv151Art = num => `https://assets.tcgdex.net/en/sv/sv3.5/${num}/low.webp`;
  const sprite = dex => `${POKEAPI_SPRITE_BASE}/${dex}.png`;

  return [
    {
      id: 'binder-sample-151',
      name: '151 Kanto Koleksiyonu',
      gridSize: '3x3',
      missingStyle: 'dimmed',
      pages: [
        {
          id: 'bpage-151-1',
          title: 'Kanto Başlangıç & Manzara',
          items: [
            {
              id: 'bitem-art-1',
              kind: 'art',
              slotIndex: 0,
              colSpan: 3,
              rowSpan: 1,
              tpl: '3x1',
              title: 'Kanto Gün Batımı',
              imageSrc: sampleLandscape,
              aspectRatio: 1600 / 900,
              zoom: 105,
              panX: 0.5,
              panY: 0.52,
              caption: 'Pokémon Card 151 · Kanto'
            },
            {
              id: 'bitem-c-1',
              kind: 'card',
              slotIndex: 3,
              colSpan: 1,
              rowSpan: 1,
              name: 'Venusaur ex',
              set: 'Pokémon Card 151',
              number: '198/165',
              price: '$48.00',
              lang: 'EN · SIR',
              type: 'grass',
              rarity: 'Special Illustration Rare',
              cardArtUrl: sv151Art(198),
              spriteUrl: sprite(3),
              owned: true
            },
            {
              id: 'bitem-c-2',
              kind: 'card',
              slotIndex: 4,
              colSpan: 1,
              rowSpan: 1,
              name: 'Charizard ex',
              set: 'Pokémon Card 151',
              number: '199/165',
              price: '$185.00',
              lang: 'EN · SIR',
              type: 'fire',
              rarity: 'Special Illustration Rare',
              cardArtUrl: sv151Art(199),
              spriteUrl: sprite(6),
              owned: false
            },
            {
              id: 'bitem-c-3',
              kind: 'card',
              slotIndex: 5,
              colSpan: 1,
              rowSpan: 1,
              name: 'Blastoise ex',
              set: 'Pokémon Card 151',
              number: '200/165',
              price: '$54.00',
              lang: 'EN · SIR',
              type: 'water',
              rarity: 'Special Illustration Rare',
              cardArtUrl: sv151Art(200),
              spriteUrl: sprite(9),
              owned: true
            },
            {
              id: 'bitem-c-4',
              kind: 'card',
              slotIndex: 6,
              colSpan: 1,
              rowSpan: 1,
              name: 'Bulbasaur',
              set: 'Pokémon Card 151',
              number: '166/165',
              price: '$32.00',
              lang: 'EN · IR',
              type: 'grass',
              rarity: 'Illustration Rare',
              cardArtUrl: sv151Art(166),
              spriteUrl: sprite(1),
              owned: true
            },
            {
              id: 'bitem-c-5',
              kind: 'card',
              slotIndex: 7,
              colSpan: 1,
              rowSpan: 1,
              name: 'Charmander',
              set: 'Pokémon Card 151',
              number: '168/165',
              price: '$44.00',
              lang: 'EN · IR',
              type: 'fire',
              rarity: 'Illustration Rare',
              cardArtUrl: sv151Art(168),
              spriteUrl: sprite(4),
              owned: true
            },
            {
              id: 'bitem-c-6',
              kind: 'card',
              slotIndex: 8,
              colSpan: 1,
              rowSpan: 1,
              name: 'Squirtle',
              set: 'Pokémon Card 151',
              number: '170/165',
              price: '$36.00',
              lang: 'EN · IR',
              type: 'water',
              rarity: 'Illustration Rare',
              cardArtUrl: sv151Art(170),
              spriteUrl: sprite(7),
              owned: false
            }
          ]
        },
        {
          id: 'bpage-151-2',
          title: 'Efsanevi & Nadirler',
          items: [
            {
              id: 'bitem-art-2',
              kind: 'art',
              slotIndex: 0,
              colSpan: 2,
              rowSpan: 1,
              tpl: '2x1',
              title: '2×1 Köprü Art',
              imageSrc: sampleLandscape,
              aspectRatio: 1600 / 900,
              zoom: 115,
              panX: 0.72,
              panY: 0.45,
              caption: 'SIR Vitrin'
            },
            {
              id: 'bitem-c-7',
              kind: 'card',
              slotIndex: 2,
              colSpan: 1,
              rowSpan: 1,
              name: 'Mew ex',
              set: 'Pokémon Card 151',
              number: '205/165',
              price: '$88.00',
              lang: 'EN · SIR',
              type: 'psychic',
              rarity: 'Special Illustration Rare',
              cardArtUrl: sv151Art(205),
              spriteUrl: sprite(151),
              owned: true
            },
            {
              id: 'bitem-c-8',
              kind: 'card',
              slotIndex: 3,
              colSpan: 1,
              rowSpan: 1,
              name: 'Pikachu',
              set: 'Pokémon Card 151',
              number: '173/165',
              price: '$24.00',
              lang: 'EN · IR',
              type: 'lightning',
              rarity: 'Illustration Rare',
              cardArtUrl: sv151Art(173),
              spriteUrl: sprite(25),
              owned: true
            },
            {
              id: 'bitem-c-9',
              kind: 'card',
              slotIndex: 4,
              colSpan: 1,
              rowSpan: 1,
              name: 'Alakazam ex',
              set: 'Pokémon Card 151',
              number: '201/165',
              price: '$38.00',
              lang: 'EN · SIR',
              type: 'psychic',
              rarity: 'Special Illustration Rare',
              cardArtUrl: sv151Art(201),
              spriteUrl: sprite(65),
              owned: false
            },
            {
              id: 'bitem-c-10',
              kind: 'card',
              slotIndex: 5,
              colSpan: 1,
              rowSpan: 1,
              name: 'Zapdos ex',
              set: 'Pokémon Card 151',
              number: '202/165',
              price: '$45.00',
              lang: 'EN · SIR',
              type: 'lightning',
              rarity: 'Special Illustration Rare',
              cardArtUrl: sv151Art(202),
              spriteUrl: sprite(145),
              owned: true
            }
          ]
        }
      ]
    },
    {
      id: 'binder-sample-grail',
      name: 'Grail & 2×2 Mini Binder',
      gridSize: '2x2',
      missingStyle: 'dimmed',
      pages: [
        {
          id: 'bpage-grail-1',
          title: 'Vitrin Sayfası',
          items: [
            {
              id: 'bitem-grail-art',
              kind: 'art',
              slotIndex: 0,
              colSpan: 2,
              rowSpan: 1,
              tpl: '2x1',
              title: 'Grail Üst Köprü',
              imageSrc: sampleLandscape,
              aspectRatio: 1600 / 900,
              zoom: 100,
              panX: 0.5,
              panY: 0.5,
              caption: 'Grail Showcase'
            },
            {
              id: 'bitem-grail-1',
              kind: 'card',
              slotIndex: 2,
              colSpan: 1,
              rowSpan: 1,
              name: 'Umbreon VMAX',
              set: 'Evolving Skies',
              number: '215/203',
              price: '$920.00',
              lang: 'EN · Alt Art',
              type: 'darkness',
              rarity: 'Ultra Rare',
              cardArtUrl: 'https://assets.tcgdex.net/en/swsh/swsh7/215/low.webp',
              spriteUrl: sprite(197),
              owned: false
            },
            {
              id: 'bitem-grail-2',
              kind: 'card',
              slotIndex: 3,
              colSpan: 1,
              rowSpan: 1,
              name: 'Giratina V',
              set: 'Lost Origin',
              number: '186/196',
              price: '$380.00',
              lang: 'EN · Alt Art',
              type: 'dragon',
              rarity: 'Ultra Rare',
              cardArtUrl: 'https://assets.tcgdex.net/en/swsh/swsh11/186/low.webp',
              spriteUrl: sprite(487),
              owned: true
            }
          ]
        }
      ]
    }
  ];
}
