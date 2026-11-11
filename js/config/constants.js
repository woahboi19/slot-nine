const STORAGE_KEYS = {
  cards: 'pokebinder_placeholder_cards_v1',
  settings: 'pokebinder_placeholder_settings_v1',
  artSettings: 'pokebinder_art_settings_v1',
  artQueue: 'pokebinder_art_queue_v1',
  binders: 'pokebinder_digital_binders_v1',
  flashToast: 'pokebinder_flash_toast_v1'
};

const MAX_VARIANTS = 6;
const CARDS_PER_PAGE = 9;
const SLOT_WIDTH_MM = 63;
const SLOT_HEIGHT_MM = 88;
const MAX_A4_STACK_MM = 276;
const POKEAPI_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

const TYPE_LABELS = {
  colorless: 'Normal',
  fire: 'Fire',
  water: 'Water',
  grass: 'Grass',
  lightning: 'Lightning',
  psychic: 'Psychic',
  fighting: 'Fighting',
  darkness: 'Darkness',
  metal: 'Metal',
  dragon: 'Dragon',
  fairy: 'Fairy',
  trainer: 'Trainer'
};

const ART_TEMPLATES = {
  '2x1': { cols: 2, rows: 1, title: '2×1 Yatay Köprü', sub: '2 slot · Tek parça' },
  '3x1': { cols: 3, rows: 1, title: '3×1 Tam Satır', sub: '3 slot · 2. cep üstü köprü' },
  '2x2': { cols: 2, rows: 2, title: '2×2 Kare (Yatay H)', sub: '4 slot · Yandan H-çentikli' },
  '3x3': { cols: 3, rows: 3, title: '3×3 Tam Sayfa', sub: '9 slot · 4 çentikli poster' }
};

const BINDER_GRID_PRESETS = {
  '3x3': { cols: 3, rows: 3, label: '3×3 (9 Cep)' },
  '4x3': { cols: 4, rows: 3, label: '4×3 (12 Cep)' },
  '2x2': { cols: 2, rows: 2, label: '2×2 (4 Cep)' }
};

const BINDER_ART_SPANS = {
  '1x1': { cols: 1, rows: 1, label: '1×1 Tek Cep' },
  '2x1': { cols: 2, rows: 1, label: '2×1 Yatay Köprü' },
  '3x1': { cols: 3, rows: 1, label: '3×1 Tam Satır' },
  '2x2': { cols: 2, rows: 2, label: '2×2 Kare' },
  '3x3': { cols: 3, rows: 3, label: '3×3 Tam Sayfa' }
};

const PRINTED_LANGUAGES = [
  { code: 'EN', label: 'EN (İngilizce)' },
  { code: 'JP', label: 'JP (Japonca)' },
  { code: 'DE', label: 'DE (Almanca)' },
  { code: 'FR', label: 'FR (Fransızca)' },
  { code: 'ES', label: 'ES (İspanyolca)' },
  { code: 'IT', label: 'IT (İtalyanca)' },
  { code: 'PT', label: 'PT (Portekizce)' },
  { code: 'KR', label: 'KR (Korece)' },
  { code: 'ZH-TW', label: 'ZH-TW (Geleneksel Çince)' },
  { code: 'ZH-CN', label: 'ZH-CN (Basitleştirilmiş Çince)' },
  { code: 'TH', label: 'TH (Tayca)' },
  { code: 'ID', label: 'ID (Endonezce)' },
  { code: 'NL', label: 'NL (Felemenkçe)' },
  { code: 'PL', label: 'PL (Lehçe)' },
  { code: 'RU', label: 'RU (Rusça)' }
];

const MARKET_PROVIDERS = {
  cardmarket: {
    label: 'Cardmarket',
    buildUrl: q => `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${q}`
  },
  pricecharting: {
    label: 'PriceCharting',
    buildUrl: q => `https://www.pricecharting.com/search-products?q=${q}&type=prices`
  },
  tcgplayer: {
    label: 'TCGplayer',
    buildUrl: q => `https://www.tcgplayer.com/search/pokemon/product?q=${q}`
  }
};
