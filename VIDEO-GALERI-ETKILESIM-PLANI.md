# Misal Works — Ana Sayfa Video Galerisi

## Amaç

Kullanıcı çalışma kartına tıkladığında ana sayfadan ayrılmaz. Seçilen çalışma, sayfanın üzerinde açılan yarı saydam bir izleme katmanında büyür ve oynamaya başlar. Ana sayfadaki çalışmalar bölümü arka planda görünür kalır; böylece kullanıcı başka bir sayfaya geçtiğini hissetmez.

## Ana sayfadaki çalışma kartları

Her kart gerçek bir çalışmayı temsil eder. Kategori, ziyaretçinin ihtiyacıyla hızlı eşleşebilmesi için kart üzerinde açıkça görünür.

Kartta şu bilgiler bulunur:

- Video posteri veya hareketli kısa önizleme
- Kategori: `Açık Hava Videosu`
- Çalışmanın adı
- Gerekirse kısa üretim bilgisi: `3D · Compositing · LED ekran`

Kartlar aynı ölçüye zorlanmaz. Yatay, dikey ve kare görüntüler mevcut grid içinde kendi oranlarına uygun yer kaplayabilir.

## Açılma davranışı

1. Kullanıcı bir çalışma kartına tıklar.
2. Kart, kısa bir büyüme geçişiyle ana izleyiciye dönüşür.
3. Sayfanın üzeri koyu ve yarı saydam bir katmanla örtülür. Çalışmalar bölümü arkada seçilebilir ölçüde görünmeye devam eder.
4. Sayfanın kaydırma konumu korunur ve arka plan geçici olarak sabitlenir.
5. Video yüklenir yüklenmez oynatılır.
6. Sesli oynatma tarayıcı tarafından engellenirse video sessiz başlar ve görünür bir `Sesi aç` denetimi gösterilir.

Bu sırada yeni sayfa açılmaz ve ana menüye geçilmez.

## İzleme katmanının düzeni

### Masaüstü

- İzleme katmanı ekranın yaklaşık `%92` genişliğini ve en fazla `%88` yüksekliğini kullanır.
- Ana video geniş alanda yer alır.
- Aynı kategoriye ait diğer işler sağ tarafta kaydırılabilir bir galeri olarak sıralanır.
- Ekran yeterince geniş değilse galeri videonun altına geçer.
- Arka plan tamamen kapanmaz; çalışmalar gridinin renkleri ve genel kompozisyonu görünür kalır.

### Mobil

- Video üstte yer alır.
- Aynı kategorideki işler altta yatay kaydırılan bir şerit hâline gelir.
- Panel ekranın tamamına yaklaşabilir ancak kapatma düğmesi ve ana sayfayla görsel bağ korunur.

## Farklı video oranları

Ana oynatıcı sabit `16:9` oranına zorlanmaz.

- Yatay video kullanılabilir alanın genişliğine göre büyür.
- Dikey video ekran yüksekliğine göre büyür ve ortalanır.
- Kare veya özel oranlı içerik doğal oranıyla gösterilir.
- Video hiçbir durumda kırpılmaz; oynatıcı içinde `object-fit: contain` kullanılır.
- Boş kalan alan, videonun posterinden üretilen koyu ve bulanık bir arka planla doldurulabilir.
- Galeri küçük resimleri de videonun gerçek oranını korur. Dikey ve yatay işler aynı liste içinde birlikte bulunabilir.

## Aynı kategorideki diğer işler

İzleyicinin yanında veya altında yalnızca açılan çalışmayla aynı kategoriye ait işler gösterilir.

Örnek:

```text
AÇIK HAVA VİDEOLARI

[Aktif video]

[Metro ekranı] [3D billboard] [AVM LED] [Mağaza ekranı]
```

Başka bir küçük resme tıklandığında:

- İzleme katmanı kapanmaz.
- Yeni video aynı oynatıcının yerini alır.
- Başlık ve üretim bilgileri güncellenir.
- Yeni video baştan oynatılır.
- Aktif küçük resim çerçeve veya ışık vurgusuyla belirtilir.

Kategori değiştirmek için izleyicinin kapatılıp ana çalışma gridine dönülmesi yeterlidir. İlk sürümde izleyicinin içine ayrıca kategori menüsü eklenmez.

## Tam ekran

Tam ekran davranışı tıklama sayısına bağlanmamalıdır; kullanıcı hangi tıklamanın tam ekran açacağını anlayamaz. Bunun yerine iki açık yol bulunur:

- Oynatıcının sağ alt köşesinde belirgin bir tam ekran düğmesi
- Videoya çift tıklayarak tam ekrana geçme

`Esc` tuşuna ilk basış tam ekrandan çıkarır. Tam ekran açık değilken `Esc`, izleme katmanını kapatır.

## Kapatma ve geri dönüş

İzleyici şu yollarla kapanır:

- Sağ üstteki kapatma düğmesi
- İzleme panelinin dışındaki saydam alana tıklama
- `Esc` tuşu

Kapanınca kullanıcı ana sayfada daha önce tıkladığı karta ve aynı kaydırma konumuna döner. Klavye odağı da açılışı yapan karta geri verilir.

## Metin yapısı

Ana bölüm:

```text
ÇALIŞMALAR
Yaptığım çalışmalardan örnekler.
```

İzleme katmanı:

```text
AÇIK HAVA VİDEOSU
Çalışmanın adı
LED · Metro · 3D · Compositing

Aynı kategoriden diğer çalışmalar
```

Uzun vaka anlatımları bu katmanda kullanılmaz. Gerekli olduğunda çalışma adı, müşteri, kullanım alanı ve üretimde üstlenilen görev kısa biçimde gösterilir.

## Teknik uygulama sınırı

İlk sürüm için ek galeri veya animasyon kütüphanesi gerekmez.

- Yerleşik HTML `dialog` öğesi
- React içinde `activeWorkId` ve `viewerOpen` durumu
- HTML5 `video`, `controls` ve `playsInline`
- Tam ekran için `requestFullscreen()`
- Açılıp kapanma için kısa CSS opacity ve scale geçişi
- Her çalışma için `category`, `poster`, `video`, `width` ve `height` bilgisi
- Videolar yalnızca açıldığında yüklenir; ana sayfada posterler kullanılır

Önerilen bileşenler:

```text
SelectedWork
├── WorkCard
└── WorkViewer
    ├── VideoStage
    ├── WorkInfo
    └── RelatedWorks
```

## Kabul ölçütleri

- Çalışmaya tıklamak yeni sayfa açmaz.
- Ana sayfa izleyicinin arkasında görünür kalır.
- Seçilen video otomatik olarak oynamayı dener.
- Dikey, yatay ve kare videolar kırpılmadan gösterilir.
- Aynı kategorideki başka bir işe tek tıklamayla geçilir.
- Tam ekran düğmesi ve çift tıklama çalışır.
- İzleyici kapatılınca kaydırma konumu ve seçilen kart korunur.
- Mobil kullanımda diğer işler videonun altında erişilebilir kalır.
- Klavye ile açma, iş değiştirme ve kapatma mümkündür.
