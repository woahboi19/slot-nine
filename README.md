# SlotNine — Pokémon TCG Binder Toolkit

Pokémon TCG koleksiyoncuları için tarayıcı tabanlı, sunucusuz (tamamen yerel çalışan) üçlü binder araç seti:

1. **Yer Tutucu (`index.html`)**: Eksik kartlar için 63 × 88 mm ölçülerinde, çoklu dil/set/fiyat satırlı, piyasa QR kodlu ve Pokédex sprite destekli A4 baskı şablonları üretir.
2. **Binder Art (`binder-art.html`)**: Yandan yüklemeli (side-loading) cepler için dikiş payı hesaba katılmış tek parça köprü (`2×1`, `3×1`), Yatay H (`2×2`, `3×3`) veya 63 × 88 mm parçalı kart çıktıları hazırlar.
3. **Dijital Binder (`digital-binder.html`)**: Koleksiyonu çift sayfa (açık binder) veya tek sayfa düzeninde planlama, sürükle-bırak ile cep değiştirme, eksik kartları Yer Tutucu baskısına ve çoklu cep görsellerini Binder Art baskısına aktarma imkânı sunar.

## Klasör Yapısı

```text
├── index.html                  # Yer Tutucu (63×88 mm A4 kart) aracı
├── binder-art.html             # Binder Art (Köprü / Yatay H) aracı
├── digital-binder.html         # Dijital Binder planlayıcı aracı
├── assets/
│   └── favicon.svg             # Uygulama ikonu
├── css/
│   ├── base.css                # Değişkenler, tipografi, buton ve form elemanları
│   ├── layout.css              # Üst bar, navigasyon, sol panel, modal ve bildirimler
│   ├── a4-sheet.css            # A4 önizleme sahnesi, 3×3 ızgara ve yazdırma (@media print) kuralları
│   ├── placeholder.css         # 63×88 mm yer tutucu kart ve varyant satırı stilleri
│   ├── binder-art.css          # Köprü parçaları, dikiş payı ve çentik kılavuzları
│   └── digital-binder.css      # Dijital binder sahnesi, cepler ve durum rozetleri
└── js/
    ├── config/
    │   ├── constants.js        # Sabit ölçüler, dil listesi, şablonlar ve depolama anahtarları
    │   └── sample-data.js      # Varsayılan örnek kartlar ve örnek dijital binder verileri
    ├── core/
    │   ├── utils.js            # Metin temizleme, veri doğrulama ve yardımcı fonksiyonlar
    │   ├── storage.js          # LocalStorage / SessionStorage veri katmanı
    │   ├── geometry.js         # Görsel kadrajlama (cover, zoom, pan) ve cep matematiği
    │   ├── files.js            # JSON indirme, CSV ayrıştırma ve görsel sıkıştırma
    │   ├── share-url.js        # Kart listesini Base64URL hash olarak kodlama ve çözme
    │   └── ui.js               # Toast bildirimleri, A4 yakınlaştırma ve ortak arayüz yardımcıları
    ├── services/
    │   ├── pokeapi.js          # PokéAPI üzerinden otomatik sprite ve Pokédex numarası çözümleme
    │   ├── tcgdex.js           # TCGdex API üzerinden kart arama ve detay çekme
    │   └── qr.js               # Çevrimdışı Reed-Solomon QR kod SVG üreticisi
    ├── placeholder/
    │   ├── renderer.js         # 63×88 mm kart DOM şablonu, kenarlık liste görünümü ve A4 sayfalandırma
    │   ├── import-export.js    # JSON/CSV içe-dışa aktarma ve paylaşılabilir URL işleyicisi
    │   └── page.js             # Yer Tutucu sayfası durum ve olay kontrolcüsü
    ├── binder-art/
    │   ├── renderer.js         # Köprü / Yatay H şablon butonları ve dikiş paylı A4 kesim sayfaları
    │   └── page.js             # Binder Art sayfası kadrajlama ve olay kontrolcüsü
    └── digital-binder/
        ├── model.js            # Sayfa, cep çakışması, istatistik ve veri doğrulama modeli
        ├── renderer.js         # Açık/tek sayfa binder sahnesi, cep ızgarası ve kenar çubuğu çizimi
        └── page.js             # Dijital Binder sayfası sürükle-bırak ve olay kontrolcüsü
```