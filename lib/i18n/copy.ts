/**
 * Merkezi Türkçe copy registry.
 *
 * Amaç: Tüm kullanıcı-yüzlü metinleri (button label'ları, başlıklar, hint'ler,
 * toast mesajları, info box içerikleri, concept açıklamaları) tek dosyada
 * toplayıp tutarlı bir Türkçe UX üretmek. Teknik loanword'ler (prompt, brief)
 * Türkçe'de yerleştiği gibi korunur; model adları (Veo 3.1, Nano Banana 2,
 * Gemini) ürün ismi olduğu için çevrilmez.
 *
 * Namespace yapısı:
 *   COPY.nav          → sidebar linkleri
 *   COPY.login        → giriş sayfası
 *   COPY.generate     → /generate sayfasındaki TÜM metinler (7 step dahil)
 *   COPY.library      → /library sayfası
 *   COPY.analytics    → /analytics sayfası
 *   COPY.settings     → /settings sayfası (şifre değiştirme + API key section'ları)
 *   COPY.concepts     → Tooltip ve info box'larda paylaşılan sözlük tanımları
 */

import type { Intent } from "@/lib/generate/machine";

export type WhatIsThis = {
  title: string;
  body: string;
  bullets?: readonly string[];
  note?: string;
};

// ── Nav + Login + global ─────────────────────────────────────────────────

const nav = {
  generate: "Üret",
  library: "Kütüphane",
  analytics: "Analiz",
  settings: "Ayarlar",
  signOut: "Çıkış yap",
  brandName: "Newbee",
  brandSubtitle: "Marketing Hub",
  collapseExpand: "Genişlet/daralt",
  menuOpen: "Menüyü aç",
  menuClose: "Menüyü kapat",
} as const;

const login = {
  brand: "Newbee Marketing Hub",
  subBrand: "Sadece yönetici erişimi",
  cardTitle: "Giriş yap",
  cardSub: "Yönetici kimlik bilgilerinle. Açık kayıt yok.",
  emailLabel: "E-posta",
  emailPlaceholder: "sen@newbee.app",
  passwordLabel: "Şifre",
  signIn: "Giriş yap",
  signingIn: "Giriş yapılıyor…",
  requestAccess: "Yönetici değil misin?",
  requestAccessLink: "Erişim talep et",
  errors: {
    notAdmin: "Erişim reddedildi. Bu portal sadece yöneticiler içindir.",
    authFailed: "Kimlik doğrulama başarısız. Tekrar dene.",
    generic: "Beklenmeyen bir hata oluştu.",
  },
} as const;

// ── Concept dictionary (tooltip'ler + info box'lar paylaşır) ─────────────

const concepts = {
  brief: {
    short: "Ne üretmek istediğini kendi cümlelerinle anlattığın metin.",
    long:
      "Brief, senin AI'a yazdığın özgür metin. Sahneyi, duyguyu, konuyu kendi kelimelerinle anlatırsın. AI bunu sonra teknik parametrelere böler.",
  },
  blueprint: {
    short:
      "Brief'in AI modelinin anlayacağı şekilde 6 teknik parçaya bölünmüş hâli.",
    long:
      "Şema (Blueprint), brief'ini 6 teknik alana (konu, stil, kompozisyon, ışık, mood, teknik) böler. Bu yapılandırılmış formatta modeller çok daha iyi sonuç üretir. Gemini bu alanları brief'inden otomatik doldurur; istediğin alanı düzenleyebilirsin.",
  },
  prompt: {
    short: "Modele gidecek son mesaj — şemanın birleştirilmiş hâli.",
    long:
      "Prompt, Blueprint alanlarının birleştirilmesiyle oluşan ve AI'nın gerçekten göreceği son mesaj. Elle düzenleyebilirsin — kelime çıkarıp ekleyebilirsin. 'Şemadan yeniden yaz' butonu Blueprint'ten baştan üretir.",
  },
  pipeline: {
    short: "Önce görsel üret, sonra onu canlandır.",
    long:
      "Görsel → Video akışında AI önce tek bir still görsel üretir. Sonra o görseli videonun ilk karesi yaparak 4-8 saniyelik klibe dönüştürür. En kontrollü yol — ne görsel ne de hareket sürpriz olur.",
  },
  assetLock: {
    short:
      "Sonuçta birebir korunması gereken görseller (ekran, logo, ürün).",
    long:
      "Sabit tutulacak görseller, AI'nın halüsinasyon yapmadan korumak zorunda olduğu referanslar. Uygulama ekran görüntüsü, logo, ürün fotoğrafı gibi. Backend prompt'a 'bu görseli birebir yeniden çiz, değiştirme' talimatı ekler. Max 3 görsel, her biri 4 MB.",
  },
  referenceImage: {
    short: "AI'nın ilham alması için verilen görsel.",
    long:
      "Referans görseller, modelin stil/karakter konusunda yönlendirmesi için. Sabit tutulacak görsellerin aksine birebir kopyalanmaz — sadece mood, palette, karakter sürekliliği için kullanılır. Veo 3.1 videoyu bu referanslara benzetmeye çalışır.",
  },
  extend: {
    short: "Mevcut videonun son karesinden 8 saniye daha ekle.",
    long:
      "Videonu uzatma: Veo son karede durduğun yerden devam eder ve 8 saniye daha üretir. Üretimden sonra ~2 gün içinde yapılabilir (Google'ın Veo URI retention penceresi).",
  },
  animate: {
    short: "Still görseli 4-8 saniyelik kliple canlandır.",
    long:
      "Görselini canlandır: elindeki still görseli videonun ilk karesi yapıp Veo 3.1 ile hareketlendirmek. Brief'ini yeniden yazmaya gerek yok — mevcut görsel first frame olarak kullanılır.",
  },
  veo: {
    short: "Google'ın video üretim modeli. Saniyesi $0.40.",
    long:
      "Veo 3.1: Google'ın en yetenekli video modeli. 4-8 saniyelik klipler üretir, 2-3 dakika sürer. Ses de üretebilir. Saniye başına $0.40 maliyet.",
  },
  nanoBanana: {
    short: "Google'ın hızlı görsel modeli. Görsel başına $0.04.",
    long:
      "Nano Banana 2 (Gemini 3 Pro Image Preview): Google'ın hızlı görsel modeli. ~30 saniyede tek bir still üretir. 4:5, 9:16, 1:1, 16:9 en-boy oranlarını destekler. Görsel başına $0.04 maliyet.",
  },
  gemini: {
    short: "Google'ın metin modeli — brief yazar, şemayı doldurur.",
    long:
      "Gemini 3 Pro: Google'ın güçlü metin modeli. Bu sitede iki işte kullanılıyor: (1) 'Zar at' butonu brand profiline bakıp sana on-brand brief yazar, (2) 'Gemini ile taslak yaz' brief'ini alıp Blueprint alanlarını doldurur.",
  },
  ratio: {
    short: "Çıktının en-boy oranı (şekli).",
    long:
      "En-boy oranı (aspect ratio), çıktı görsel/videonun şekli. Görsel 4 oranı destekler, video 2 oranı. Neyle nereye paylaşacağına göre seç.",
    examples: {
      "9:16": "9:16 — dikey (Reels, TikTok, Stories)",
      "16:9": "16:9 — yatay (YouTube, TV, reklam)",
      "1:1": "1:1 — kare (Instagram feed)",
      "4:5": "4:5 — dikey (Instagram feed, Pinterest)",
    },
  },
  duration: {
    short: "Video klibin saniye cinsinden uzunluğu.",
    long:
      "Süre seçenekleri: 4, 6, 8 saniye. Uzun = daha fazla anlatım alanı + daha fazla maliyet. 4s = $1.60, 6s = $2.40, 8s = $3.20.",
  },
  source: {
    short: "Senin yüklediğin dosyalar (AI değil).",
    long:
      "Kütüphanede 'Kendi yüklediklerim' filtresi. 'Kendim yüklerim' veya 'Sabit tutulacak görseller' aşamalarında yüklediğin PNG/JPG/MP4'ler burada.",
  },
  generated: {
    short: "AI'nın ürettiği çıktılar.",
    long:
      "Kütüphanede 'AI Üretimi' filtresi. Nano Banana 2 ile üretilmiş görseller ve Veo 3.1 ile üretilmiş videolar burada.",
  },
  variant: {
    short: "Aynı brief + şemayla yeni bir üretim.",
    long:
      "Başka bir varyant: brief'ini, şemanı ve sabit görsellerini koruyup yalnızca çıktıyı temizler. Aynı direktifle farklı bir sonuç denemek için.",
  },
} as const;

// ── Generate page (büyük — 7 step) ──────────────────────────────────────

const generate = {
  pageTitle: "Üret",
  pageSubtitle:
    "Brief → prompt → görsel veya video. Her adımı düzenleyebilirsin.",
  topbarLibrary: "Kütüphane",
  startOver: "Sıfırdan başla",
  extendBanner: {
    title: "Son videondan devam ediyorsun",
    sub: "Veo son karesinden devam edecek — sıradaki sahneyi brief'te anlat.",
    cancel: "Uzatmayı iptal et",
  },

  // ── Intent meta ──
  intents: {
    image: {
      title: "Görsel",
      tagline: "Tek bir still kare — Instagram postu veya reklam görseli için.",
      time: "~30sn",
      whenToUse: "Hızlı bir afiş/post/reklam görseli lazımsa.",
    },
    video: {
      title: "Video",
      tagline: "Kısa bir klip — 4 ile 8 saniye arası.",
      time: "~2-3 dk",
      whenToUse: "Reels/TikTok/reklam videosu için kısa, tek çekim klip.",
    },
    pipeline: {
      title: "Görsel → Video",
      tagline: "Önce görseli üret, sonra onu canlandır.",
      time: "~3-4 dk",
      whenToUse:
        "En kontrollü yol — ilk karedeki kompozisyonu önce onaylayıp sonra canlandırmak için.",
    },
  } satisfies Record<
    Intent,
    {
      title: string;
      tagline: string;
      time: string;
      whenToUse: string;
    }
  >,
  intentLabels: {
    image: "Görsel",
    video: "Video",
    pipeline: "Görsel → Video",
  } satisfies Record<Intent, string>,

  // ── Steps ──
  steps: {
    goal: {
      title: "Hedef",
      subtitle: "Ne üretiyoruz?",
      summaryPrefix: "Hedef",
      continueButton: "Devam et",
      modeLabel: "Mod",
      changeButton: "Değiştir",
      changeConfirmTitle: "Her şey silinsin mi?",
      changeConfirmBody:
        "Brief, şema ve bu sayfadaki tüm çıktılar temizlenecek. Geri alınamaz.",
      changeConfirmAction: "Evet, sıfırdan başla",
      changeConfirmCancel: "Vazgeç",
      whatIsThis: {
        title: "Bu adımda ne yapıyoruz?",
        body: "Ne üretmek istediğini seçiyoruz. Üç seçenek var:",
        bullets: [
          "**Görsel**: Tek bir still fotoğraf (Instagram postu, reklam görseli).",
          "**Video**: 4-8 saniyelik kısa klip (Reels/TikTok).",
          "**Görsel → Video**: Önce görsel üret, sonra onu canlandır. En kontrollü yol.",
        ],
      } satisfies WhatIsThis,
    },
    brief: {
      title: "Brief & Şema",
      subtitle: "Hikayeni bize anlat, AI detayları yazsın.",
      summaryEmpty: "(boş)",
      briefLabel: "Brief",
      briefRollDice: "Emin değilim, zar at",
      briefRolling: "Düşünülüyor…",
      blueprintLabel: "Şema",
      blueprintHint:
        "Her alan, AI'ın göreceği son prompt'un bir parçası. Brief'ten otomatik doldurulur; istediğini elle düzelt.",
      blueprintReady: "Gemini doldurdu",
      blueprintReadyNote:
        "Aşağıdaki 6 kutucuğa Gemini'nin yazdıklarını yerleştirdik. İncele, istediğini değiştir, yanındaki ⟳ ile sadece tek alanı yeniden yazdır.",
      draftWithGemini: "Gemini ile taslak yaz",
      drafting: "Yazılıyor…",
      pipelineTabImage: "Görsel şeması",
      pipelineTabVideo: "Video şeması",
      continueButton: "Prompt'a geç",
      continueButtonHint:
        "Şemayı tek bir metne çevirip modele gönderecek son hâlini göstereceğiz.",
      whatIsThis: {
        title: "Hikayeni anlat",
        body: "Üç bölüm var: Brief, Şema ve Sabit tutulacak görseller.",
        bullets: [
          "**Brief**: Ne yapmak istediğini kendi cümlelerinle yaz. Örn: 'Sabah sahnesi, kadın kahvesini içerken telefondan Newbee'yi açar.'",
          "**Şema**: Gemini brief'ini 6 teknik parçaya böler (konu, ışık, kompozisyon vb.). 'Gemini ile taslak yaz' butonu otomatik doldurur. Her alanın yazdığı tamamını görebilirsin — kutucuklar içeriği sığdırmak için genişliyor. İstediğin alanı elle düzelt, yanındaki ⟳ ikonuyla sadece onu yeniden yazdırabilirsin.",
          "**Sabit tutulacak görseller**: Çıktıda birebir korunması gereken görseller varsa (uygulama ekranı, logo, ürün fotoğrafı) buraya yükle. AI halüsinasyon yapmadan aynen çizer.",
        ],
        note:
          "Görsel → Video modundaysan hem Görsel şeması hem Video şeması görünür — çünkü sırayla iki farklı model çalıştıracağız (görsel için Nano Banana 2, video için Veo 3.1). İkisini aynı anda doldurmak, ikisi arasındaki tutarlılığı (aynı hikaye, aynı stil) garantiliyor.",
      } satisfies WhatIsThis,
      errorNeedBrief: "Önce bir brief yaz.",
      errorBlueprintIncomplete: "Her şema alanını doldur.",
    },
    prompt: {
      title: "Prompt",
      subtitle: "Modele gidecek son mesaj. İstersen elle düzenle.",
      summaryEmpty: "(şemadan otomatik yazılacak)",
      hint:
        "Burada ne görüyorsan, model aynen onu görecek. Cümle ekleyebilir, kelime çıkarabilirsin.",
      rebuildFromBlueprint: "Şemadan yeniden yaz",
      rebuildToast: "Prompt şemadan yeniden yazıldı.",
      continueButtonImage: "Görsele geç",
      continueButtonVideo: "Videoya geç",
      tabImage: "Görsel prompt",
      tabVideo: "Video prompt",
      whatIsThis: {
        title: "Modele gidecek son mesaj",
        body: "Şema alanlarını birleştirip tek bir 'prompt' yaptık. AI modelinin gerçekten göreceği mesaj bu.",
        bullets: [
          "İstediğin kelimeyi çıkarıp ekleyebilirsin. Örn: 'cinematic' kelimesini çıkar, 'film grain' ekle.",
          "Şemayı değiştirdiysen 'Şemadan yeniden yaz' ile baştan toplarsın.",
        ],
      } satisfies WhatIsThis,
    },
    image: {
      title: "Görsel",
      subtitle: "AI'yla üret, kendin yükle veya kütüphaneden seç.",
      generateWithAi: "AI ile üret",
      generateWithAiBody: "Nano Banana 2 brief'ten görseli çizer. ~30 saniye.",
      uploadMine: "Kendim yüklerim",
      uploadMineBody: "PNG veya JPG, 15 MB'a kadar.",
      pickFromLibrary: "Kütüphaneden seç",
      pickFromLibraryBody: (project: string, ratio: string) =>
        `${project} içindeki ${ratio} görsellerinden birini tekrar kullan. Yeni maliyet yok.`,
      loading: "Nano Banana 2 çiziyor…",
      loadingSub: "Genellikle 30 saniye sürer.",
      savedTo: (project: string, ratio: string) =>
        `Kaydedildi: ${project} / Görsel / ${ratio}`,
      redo: "Tekrar üret",
      download: "İndir",
      continueButton: "Devam",
      continueButtonPipeline: "Canlandırmaya geç",
      libraryDialogTitle: "Kütüphaneden seç",
      libraryDialogSub: (project: string, ratio: string) =>
        `${project} · ${ratio} — mevcut bir görseli tekrar kullan, yeni maliyet yok.`,
      libraryLoading: "Kütüphane yükleniyor…",
      libraryEmpty: (project: string, ratio: string) =>
        `${project} içinde ${ratio} görsel henüz yok.`,
      libraryCancel: "Vazgeç",
      libraryUse: "Bu görseli kullan",
      whatIsThis: {
        title: "Görseli üret veya yükle",
        body: "Üç seçenek:",
        bullets: [
          "**AI ile üret**: Nano Banana 2 brief'ten görseli çizer. ~30 saniye. Her üretim $0.04.",
          "**Kendim yüklerim**: Elindeki PNG/JPG'yi yükle, AI atlanır. Örn: stok fotoğraf veya daha önce çektiğin bir görsel.",
          "**Kütüphaneden seç**: Daha önce üretip beğendiğin bir görseli tekrar kullan. Yeni maliyet yok.",
        ],
      } satisfies WhatIsThis,
    },
    postImage: {
      title: "Devam?",
      subtitle: "Görseli canlandıralım mı, yoksa duralım mı?",
      question: "Bu görseli canlandıralım mı, yoksa sadece görsel mi kalsın?",
      continueAnimate: "Canlandır",
      stopAtImage: "Sadece görseli sakla",
      summaryStopped: "Görselde durduk",
      summaryContinuing: "Videoya geçiliyor",
      whatIsThis: {
        title: "Şimdi bu görseli canlandıralım mı?",
        body: "Pipeline'ın son karar noktası:",
        bullets: [
          "**Canlandır**: Veo 3.1 bu görseli ilk kare yapıp 4-8 saniyelik klip üretir.",
          "**Sadece görseli sakla**: Videoya gitmeden sonlandır. Görsel Kütüphane'ye kaydedilir.",
        ],
      } satisfies WhatIsThis,
    },
    video: {
      title: "Video",
      subtitle: "Veo 3.1 ile kısa bir klip üret.",
      durationLabel: "Süre",
      generateWithAi: "AI ile üret",
      generateWithAiBodyPipeline:
        "Veo 3.1 görselini ilk kare yapıp klibi üretir. ~2-3 dakika.",
      generateWithAiBodyStandalone: "Veo 3.1 prompt'tan klibi üretir. ~2-3 dakika.",
      uploadMine: "Kendim yüklerim",
      uploadMineBody: "MP4 veya MOV, 200 MB'a kadar.",
      referenceLabel: "Referans görseller (opsiyonel, max 3)",
      referenceHint:
        "Modelin karakter/stil sürekliliği için kullanır. Birebir çizmez.",
      addReference: "Ekle",
      processingTitle: "Veo 3.1 render ediyor…",
      processingBody:
        "Genellikle 2-3 dakika. Sayfadan çıkabilirsin — video hazır olunca Kütüphane'de görünür.",
      processingLibraryLink: "Kütüphane",
      failedTitle: "Veo bu render'ı bitiremedi",
      failedDefault:
        "Genelde content policy veya prompt problemi. Şemayı düzeltip tekrar dene.",
      tryAgain: "Tekrar dene",
      savedTo: (project: string, ratio: string) =>
        `Kaydedildi: ${project} / Video / ${ratio}`,
      redo: "Tekrar üret",
      download: "İndir",
      refsMaxToastOne: "Referans çok büyük — max 4 MB.",
      refsMaxToastMany: (n: number) =>
        `${n} görsel atlandı — her biri max 4 MB olmalı.`,
      whatIsThis: {
        title: "Video üret veya yükle",
        body: "Veo 3.1 (Google'ın en iyi video modeli) 4-8 saniyelik klip üretir.",
        bullets: [
          "**Süre**: 4, 6 veya 8 sn. Uzun = daha fazla anlatım + daha fazla maliyet ($0.40/sn).",
          "**Referans görseller (opsiyonel)**: Karakter veya stil sürekliliği için 1-3 görsel yükle. 'Sabit tutulacak görseller'in aksine birebir kopyalamaz, sadece ilham alır.",
          "**İşlem süresi**: 2-3 dakika. Sayfadan çıkabilirsin — video Kütüphane'de görünür.",
        ],
      } satisfies WhatIsThis,
    },
    done: {
      title: "Hazır",
      headingImage: "Görsel hazır",
      headingVideo: "Video hazır",
      headingPipeline: "Pipeline tamamlandı",
      savedTo: (project: string, kind: string, ratio: string) =>
        `Kaydedildi: ${project} / ${kind} / ${ratio}`,
      kindImage: "Görseller",
      kindVideo: "Videolar",
      animateImage: "Görseli canlandır",
      animateImageHint: "Bu görseli ilk kare yapıp videoya geç.",
      extendVideo: "Videoyu uzat",
      extendVideoHint: "Son karesinden 8 saniye daha ekle (~2 gün geçerli).",
      extendVideoStale: "Uzatmayı dene",
      extendVideoStaleHint:
        "Bu videonun Veo retention penceresi dolmuş olabilir — deneme şansın düşük.",
      createVariant: "Başka bir varyant",
      createVariantHint: "Aynı brief + şemayla farklı bir sonuç dene.",
      openLibrary: "Kütüphanede aç",
      startOver: "Sıfırdan başla",
      extendFootnoteFresh:
        "Uzatma videonun son karesinden devam eder. Render'dan sonra ~2 gün boyunca yapılabilir.",
      extendFootnoteStale:
        "Dikkat: Uzatma Veo'nun 2 günlük retention'ına bağlı — bu video süreyi aşmış olabilir.",
      animateFootnote:
        "Canlandır, bu görseli 4-8 saniyelik klibe dönüştürür — brief'i yeniden yazmana gerek yok.",
      whatIsThis: {
        title: "Hazır, sıradaki ne?",
        body: "Çıktıyı Kütüphane'ye kaydettik. Aşağıdaki butonlarla:",
        bullets: [
          "**Görseli canlandır** (sadece görsel ürettiysen): İlk kare yapıp videoya geçer.",
          "**Videoyu uzat** (video ürettiysen): Son karesinden 8 sn daha ekler. ~2 gün içinde yapılabilir.",
          "**Başka bir varyant**: Aynı brief + şemayla yeni bir üretim. Çıktıyı temizler, başlangıç ayarlarını korur.",
          "**Kütüphanede aç**: Tüm çıktıları görmek için Kütüphane'ye git.",
          "**Sıfırdan başla**: Her şeyi temizle, hedef seçim ekranına dön.",
        ],
      } satisfies WhatIsThis,
    },
  },

  // ── Asset lock ──
  assetLock: {
    title: "Sabit tutulacak görseller",
    meta: (n: number) => `· birebir korunur · ${n}/3 · her biri max 4 MB`,
    dropTitle: "Dosya sürükle veya tıkla",
    dropSub: "PNG, JPG · max 4 MB",
    removeLabel: "Görseli kaldır",
    kindLabels: {
      app_ui: "Uygulama ekranı",
      logo: "Logo",
      product_photo: "Ürün fotoğrafı",
      other: "Diğer",
    } as const,
    kindHints: {
      app_ui: "Ekranı piksel piksel yeniden çiz.",
      logo: "Logoyu olduğu gibi yerleştir.",
      product_photo: "Ürünün detaylarını ve bitişini koru.",
      other: "Görsel referans olarak kullan.",
    } as const,
    tooBig: "Görsel çok büyük — her biri max 4 MB.",
    tooBigMany: (n: number) =>
      `${n} görsel atlandı — her biri max 4 MB olmalı.`,
  },

  // ── Brief placeholder'ları ──
  briefPlaceholder: {
    image:
      "Örn: Güneşli mutfakta, elinde Newbee uygulamasıyla telefon tutan kadın. Sıcak honey/cream tonları, editorial ürün fotoğrafı.",
    video:
      "Örn: Telefon açıldığında Newbee chat'inin belirdiği yavaş dolly-in. Amber vurgular, neşeli ambient müzik.",
    pipeline:
      "Örn: 'Günlük Newbee'niz' lansman teaser'ı — telefon mockup'ı ilk kare, sonra UI üzerinde yumuşak hareket, honey/cream palet.",
  } satisfies Record<Intent, string>,

  // ── Toast'lar ──
  toasts: {
    briefDrafted: (highlight?: string | null) =>
      highlight
        ? `Brief "${highlight}" etrafında yazıldı. Başka bir açı için tekrar zar at.`
        : "Yeni brief yazıldı.",
    briefDraftFailed: "Brief yazılamadı.",
    blueprintDrafted: "Şema yazıldı. Devam etmeden önce istediğin gibi düzenle.",
    blueprintDraftFailed: "Şema yazılamadı.",
    fieldRegenerated: (key: string) => `"${key}" yeniden yazıldı.`,
    fieldRegenerationFailed: "Alan yeniden yazılamadı.",
    imageGenFailed: "Görsel üretimi başarısız.",
    imageUploadFailed: "Görsel yüklenemedi.",
    videoStarted: (project: string, ratio: string) =>
      `Video render ediliyor: ${project} / Video / ${ratio} (~2-3 dk)`,
    videoGenFailed: "Video üretimi başarısız.",
    videoUploadFailed: "Video yüklenemedi.",
    suggestionFailed: "Öneri alınamadı.",
    briefNeeded: "Önce bir brief yaz.",
    blueprintIncomplete: "Şemanın tüm alanlarını doldur.",
    imageNeeded: "Videoya geçmeden önce görsel hazır olmalı.",
    intentSwitched: (label: string) =>
      `${label} moduna geçildi — brief ve şema korundu.`,
    extendStarted:
      "Son videondan devam ediliyor — sıradaki sahneyi brief'te anlat.",
    extendCanceled: "Uzatma iptal edildi.",
    ratioSwap: (oldR: string, newR: string, intent: string) =>
      `En-boy ${newR}'ya çevrildi — ${oldR} ${intent} için desteklenmiyor.`,
    imagePromptRebuilt: "Görsel prompt şemadan yeniden yazıldı.",
    videoPromptRebuilt: "Video prompt şemadan yeniden yazıldı.",
  },

  // ── Image / Video field label'ları (Blueprint alanları) ──
  imageFields: [
    { key: "subject", label: "Konu", hint: "Kim veya ne, ne yapıyor" },
    { key: "style", label: "Stil", hint: "Editorial, minimal, analog…" },
    {
      key: "composition",
      label: "Kompozisyon",
      hint: "Çekim tipi, kadraj, açı",
    },
    { key: "lighting", label: "Işık", hint: "Yön, renk, kalite" },
    {
      key: "mood",
      label: "Mood ve palet",
      hint: "Ton ve baskın renkler",
    },
    {
      key: "technical",
      label: "Teknik",
      hint: "Lens, alan derinliği, odak",
    },
  ] as const,
  videoFields: [
    {
      key: "subject",
      label: "Konu ve açılış",
      hint: "İlk karede kim/ne var",
    },
    {
      key: "camera",
      label: "Kamera",
      hint: "Dolly-in, handheld, orbit…",
    },
    {
      key: "action",
      label: "Aksiyon",
      hint: "Klip boyunca ne değişiyor",
    },
    {
      key: "lighting",
      label: "Işık",
      hint: "Yön, renk, evrim",
    },
    {
      key: "mood",
      label: "Mood ve palet",
      hint: "Duygu tonu",
    },
    {
      key: "audio",
      label: "Ses",
      hint: "Sessiz, piyano, ambient…",
    },
  ] as const,

  fieldsEditor: {
    regenerateTitle: "Sadece bu alanı yeniden yaz",
    draftAll: "Gemini ile taslak yaz",
    draftingAll: "Yazılıyor…",
    ready: "Hazır",
  },
} as const;

// ── Library ──────────────────────────────────────────────────────────────

const library = {
  pageTitle: "Kütüphane",
  pageSub:
    "Ekibin ürettiği ve yüklediği tüm görseller ve videolar — tip bazında gruplanmış.",
  whatIsThis: {
    title: "Kütüphane nedir?",
    body:
      "Ürettiğin ve yüklediğin tüm asset'ler burada. Ekipteki herkes aynı havuzu görür (tek bir takımız).",
    bullets: [
      "**Hepsi**: her şey",
      "**AI Üretimi**: Nano Banana 2 (görseller) ve Veo 3.1 (videolar) tarafından üretilenler",
      "**Kendi Yüklediklerim**: 'Kendim yüklerim' veya 'Sabit tutulacak görseller' aşamalarında yüklediğin dosyalar",
    ],
    note:
      "Bir görseli tekrar kullanmak için 'Görsel' adımındaki 'Kütüphaneden seç' seçeneğini kullan.",
  } satisfies WhatIsThis,
  typeCards: {
    images: "Görseller",
    videos: "Videolar",
    saved: (n: number) => `${n} kayıtlı`,
    generated: "AI",
    source: "Yüklenen",
    loading: "Yükleniyor…",
  },
  crumbRoot: "Kütüphane",
  crumbImages: "Görseller",
  crumbVideos: "Videolar",
  searchPlaceholder: "Ara…",
  layoutGridLabel: "Izgara görünümü",
  layoutListLabel: "Liste görünümü",
  tabs: {
    all: "Hepsi",
    generated: "AI Üretimi",
    source: "Kendi Yüklediklerim",
  },
  emptyNoMatches: "Eşleşme yok.",
  emptyNoSources: (type: string) =>
    `Henüz ${type === "image" ? "görsel" : "video"} yüklenmemiş.`,
  emptyNoGenerated: (type: string) =>
    `Henüz ${type === "image" ? "görsel" : "video"} üretilmemiş.`,
  emptyGeneric: "Burada henüz bir şey yok.",
  emptyTryAgain: "Farklı bir arama dene.",
  emptyCreateCTA: "sayfasına gidip bir şey üret.",
  columns: {
    name: "Dosya",
    origin: "Kaynak",
    ratio: "Oran",
    date: "Tarih",
  },
  originAi: "AI",
  originSource: "Yüklenen",
  preview: {
    close: "Kapat",
    origin: "Kaynak",
    originUser: "Kendi yüklediğim",
    originAi: "AI üretimi",
    ratio: "Oran",
    created: "Oluşturuldu",
    model: "Model",
    modelUserUpload: "—",
    modelVeo: "Veo 3.1",
    modelNanoBanana: "Nano Banana 2",
    cost: "Maliyet",
    status: "Durum",
    statusLabels: {
      completed: "tamamlandı",
      failed: "başarısız",
      processing: "işleniyor",
      pending: "sırada",
    },
    prompt: "Prompt",
    download: "İndir",
    animate: "Görseli canlandır",
    extend: "Videoyu uzat",
    delete: "Sil",
    failed: (msg: string) => `Başarısız: ${msg}`,
    stillRendering: "Hâlâ render ediliyor…",
    failedUnknown: "bilinmeyen hata",
    ariaLabel: (filename: string) => `${filename} önizleme`,
  },
  deleteDialog: {
    title: "Bu varlığı sil?",
    body: (filename: string) =>
      `"${filename}" Kütüphane'den ve Supabase Storage'dan kaldırılacak. Geri alınamaz.`,
    bodyGeneric:
      "Bu asset Kütüphane'den ve Supabase Storage'dan kaldırılacak. Geri alınamaz.",
    cancel: "Vazgeç",
    delete: "Sil",
  },
  toasts: {
    deleted: "Silindi",
    deleteFailed: "Silme başarısız",
  },
} as const;

// ── Analytics ────────────────────────────────────────────────────────────

const analytics = {
  pageTitle: "Analiz",
  pageSub: "Projelere göre harcama ve üretim istatistikleri.",
  whatIsThis: {
    title: "Bu sayfa ne gösteriyor?",
    body: "Takımın AI harcaması ve kullanım özeti.",
    bullets: [
      "**Kredi kullanımı**: Aylık $500 bütçesinden ne kadarı tüketildi",
      "**Harcama trendi**: Son 12 ayın ay-bazlı harcama grafiği",
      "**Servis bazında**: Gemini (brief üretimi), Nano Banana (görsel), Veo (video), TTS (ses) için ayrı harcama",
    ],
    note: "Rakamlar ekibin TÜM harcamasını gösterir, sadece seninkini değil.",
  } satisfies WhatIsThis,
  budget: {
    label: "Kredi kullanımı",
    of: (total: string) => `toplam ${total}`,
    remaining: "Kalan",
    used: "kullanıldı",
    cap: "Bütçeye yaklaşıldı",
  },
  statCards: {
    images: "Görseller",
    imagesSub: (completed: number) => `${completed} toplam başarılı`,
    videos: "Videolar",
    videosSub: (failed: number) => `${failed} toplam başarısız`,
    total: "Toplam üretim",
    totalSub: "Tüm projeler dahil",
    success: "Başarı oranı",
    successSub: (completed: number, total: number) =>
      `${completed} / ${total || "—"}`,
  },
  trend: {
    title: "Zamana göre harcama",
    sub: "Son 12 ay",
    monthTooltip: (month: string, amount: string) => `${month}: ${amount}`,
    monthEmpty: "—",
  },
  breakdown: {
    title: "Servis bazında dağılım",
    exportCsv: "CSV indir",
    colService: "Servis",
    colSpend: "Harcama",
    services: {
      gemini: "Gemini (brief + prompt)",
      imagen: "Nano Banana 2 (görsel)",
      veo: "Veo 3.1 (video)",
      tts: "TTS (ses)",
    },
  },
  loading: "Yükleniyor…",
} as const;

// ── Settings ─────────────────────────────────────────────────────────────

const settings = {
  pageTitle: "Ayarlar",
  pageSub: "Hesap, API anahtarları ve entegrasyonlar.",
  whatIsThis: {
    title: "Ayarlar neler içeriyor?",
    body: "Dört bölüm var:",
    bullets: [
      "**Hesap**: Kiminle giriş yaptığının özeti",
      "**Şifre değiştir**: Mevcut şifrenle doğrulama + yeni şifre",
      "**API anahtarları**: Google Ads, Meta Ads, GitHub entegrasyonları (opsiyonel — girersen gerçek kampanya yayınlanır)",
      "**Bağlı servisler**: Gemini/Nano Banana/Veo/Supabase — env var'larla yönetilir, read-only",
    ],
  } satisfies WhatIsThis,

  account: {
    title: "Hesap",
    signedInAs: (email: string) => `Giriş yapan: ${email}`,
    signedInPlaceholder: "…",
    statusAuthenticated: "Kimliği doğrulanmış",
    statusSignedOut: "Çıkış yapılmış",
    statusChecking: "Kontrol ediliyor…",
  },

  password: {
    title: "Şifre değiştir",
    sub:
      "Güvenlik için mevcut şifren gerekli. En az 8 karakter.",
    fields: {
      current: "Mevcut şifre",
      next: "Yeni şifre",
      confirm: "Yeni şifre (tekrar)",
    },
    revealLabel: "Göster",
    hideLabel: "Gizle",
    submit: "Şifreyi güncelle",
    submitting: "Güncelleniyor…",
    errors: {
      minLength: "Yeni şifre en az 8 karakter olmalı.",
      mismatch: "Yeni şifre ile tekrarı eşleşmiyor.",
      sameAsOld: "Yeni şifre mevcut şifreden farklı olmalı.",
      notSignedIn: "Giriş yapılmamış. Sayfayı yenileyip tekrar dene.",
      wrongCurrent: "Mevcut şifre yanlış.",
      generic: "Şifre değiştirilemedi.",
    },
    success: "Şifre güncellendi.",
    whatIsThis: {
      title: "Nasıl çalışıyor?",
      body: "İki adım:",
      bullets: [
        "1. **Mevcut şifreni** girersin, biz onu Supabase ile doğrularız (session kopyalanmış olabilir).",
        "2. Doğrulama tamamsa **yeni şifren** kaydedilir.",
      ],
    } satisfies WhatIsThis,
  },

  googleAds: {
    title: "Google Ads API anahtarları",
    hint: "Gerçek kampanya yayınlamak için kendi anahtarlarını gir.",
    whatIsThis: {
      title: "Neden buraya anahtarlar giriliyor?",
      body:
        "Google Ads API'ı ile (opsiyonel) otomatik kampanya oluşturma + raporlama. Anahtar yoksa sadece simülasyon modunda çalışır.",
      bullets: [
        "**Client ID / Secret**: Google Cloud Console > OAuth credentials'dan alınır.",
        "**Developer Token**: Google Ads > Tools > API Center.",
        "**Refresh Token**: OAuth consent flow'undan çıkar.",
      ],
    } satisfies WhatIsThis,
    fields: {
      clientId: "Client ID *",
      clientSecret: "Client Secret",
      developerToken: "Developer Token *",
      refreshToken: "Refresh Token",
    },
    placeholders: {
      clientId: "Client ID",
      clientSecret: "Client Secret",
      developerToken: "Developer Token",
      refreshToken: "Refresh Token",
    },
    errorRequired: "Client ID ve Developer Token zorunlu",
    saveSuccess: "Google Ads anahtarları kaydedildi",
    removeSuccess: "Google Ads anahtarları silindi",
  },

  metaAds: {
    title: "Meta Ads API anahtarları",
    hint: "Facebook + Instagram reklam yayınlama.",
    whatIsThis: {
      title: "Hangi alanlar gerekli?",
      body:
        "Meta Business Manager'dan alacağın ID'ler ve uzun-ömürlü token.",
      bullets: [
        "**App ID / Secret**: Meta for Developers > Apps.",
        "**Access Token**: System User > Generate New Token (long-lived).",
        "**Ad Account ID**: Business Manager > Ad Accounts (act_ ile başlar).",
        "**Page ID**: Facebook Page Settings > About.",
        "**Instagram Account ID**: Business Manager > Accounts > Instagram.",
      ],
    } satisfies WhatIsThis,
    fields: {
      appId: "App ID *",
      appSecret: "App Secret",
      accessToken: "Access Token *",
      adAccountId: "Ad Account ID *",
      pageId: "Facebook Page ID *",
      instagramAccountId: "Instagram Account ID *",
    },
    placeholders: {
      appId: "Meta App ID",
      appSecret: "App Secret",
      accessToken: "Uzun ömürlü System User Token",
      adAccountId: "act_XXXXXXXXX",
      pageId: "Page ID (Instagram'a bağlı)",
      instagramAccountId: "Instagram Business Account ID",
    },
    hintRow:
      "Ad Account ID, Page ID ve Instagram Account ID Meta Business Manager'dan bulunabilir.",
    errorRequired:
      "App ID, Access Token, Ad Account ID, Page ID ve Instagram Account ID gerekli",
    saveSuccess: "Meta Ads anahtarları kaydedildi",
    removeSuccess: "Meta Ads anahtarları silindi",
  },

  github: {
    title: "GitHub entegrasyonu",
    hint: "Özel repo'lar üzerinde AI kod analizi. Token'in `repo` scope'u olmalı.",
    whatIsThis: {
      title: "Token nereden alınır?",
      body:
        "GitHub > Settings > Developer settings > Personal access tokens > Generate new token.",
      bullets: [
        "`repo` scope'unu işaretle (private repolara erişim için).",
        "Token `ghp_...` ile başlar. Üretimden sonra sadece o an gösterilir, kaybettiysen yenile.",
      ],
    } satisfies WhatIsThis,
    fields: {
      token: "Personal Access Token *",
    },
    placeholders: {
      token: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    errorRequired: "Personal Access Token zorunlu",
    saveSuccess: "GitHub token kaydedildi",
    removeSuccess: "GitHub token silindi",
  },

  services: {
    title: "Bağlı servisler",
    sub: "Server-side env var'larla yönetilen entegrasyonlar.",
    items: [
      {
        name: "Gemini (2.5 Pro / Flash / 3 Pro)",
        role: "Brief + şema + prompt üretimi",
      },
      { name: "Nano Banana 2", role: "Görsel üretimi" },
      {
        name: "Veo 3.1",
        role: "Video üretimi (async, 2-gün retention)",
      },
      { name: "Supabase", role: "Giriş + depolama + rate limit" },
    ],
  },

  buttons: {
    save: "Kaydet",
    saving: "Kaydediliyor…",
    remove: "Kaldır",
    connected: "Bağlı",
    notConfigured: "Yapılandırılmamış",
    copy: "Kopyala",
    copied: "Kopyalandı",
  },
} as const;

// ── Concepts: tooltip-level (single-word target hints) ───────────────────

export const COPY = {
  nav,
  login,
  generate,
  library,
  analytics,
  settings,
  concepts,
} as const;

// ── Re-exports to minimize downstream churn ─────────────────────────────
// Some pages used to import from `lib/generate/copy.ts`. We forward from
// there to maintain compatibility while the callers migrate.
export default COPY;
