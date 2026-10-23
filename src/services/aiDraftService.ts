import { Contact } from '../types/crm';

export type SapaLanguage = 'id' | 'tr';
export type SapaAngle = 'warm_greeting' | 'topic_discussion' | 'catchup_meet';

export interface SapaDraftOption {
  id: string;
  angle: SapaAngle;
  title: string;
  text: string;
}

export interface GenerateSapaOptions {
  contact: Contact;
  language: SapaLanguage;
  targetAngle?: SapaAngle;
  previousDrafts?: string[];
  now?: Date;
}

export const DEFAULT_WORKER_PROXY_URL = 'https://sapa-ai.jaegu108.workers.dev/';

/**
 * Checks if phone number is Turkish (+90)
 */
export function isTurkishPhoneNumber(phoneNumber?: string): boolean {
  if (!phoneNumber) return false;
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  return cleaned.startsWith('+90') || cleaned.startsWith('90');
}

/**
 * Detects if a text contains common Indonesian words, so we avoid
 * injecting raw Indonesian notes into Turkish fallback templates.
 */
export function isIndonesianNote(text?: string): boolean {
  if (!text) return false;
  const keywords = [
    'mau', 'ajak', 'ngobrol', 'ketemu', 'ketemuan', 'kabar', 'bahas', 'proyek',
    'bareng', 'tentang', 'tanya', 'santai', 'ngeteh', 'ngopi', 'ngajak', 'pengin',
    'ingin', 'bisa', 'sama', 'lagi', 'sudah', 'udah', 'belum', 'nanti', 'besok',
    'pekan', 'minggu', 'kemarin', 'terkait', 'soal', 'perihal', 'diskusi', 'riset',
    'minta', 'tolong'
  ];
  const lower = text.toLowerCase();
  return keywords.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(lower));
}

/**
 * Generates an appropriate deterministic WhatsApp draft based on
 * relationship tags, tone blending, language (ID / TR), and conversational angle.
 */
export function generateDeterministicFallbackDraft(
  contact: Contact,
  language: SapaLanguage = 'id',
  angle?: SapaAngle,
  variationIndex: number = 0
): string {
  const name = contact.name?.trim() || (language === 'tr' ? 'Dostum' : 'Sahabat');
  const associations = (contact.associations || []).map((a) => a.toLowerCase().trim());
  const topic = contact.possibleFollowUpTopic?.trim();
  const notes = contact.lastUpdateNotes?.trim();
  const effectiveAngle: SapaAngle = angle || (topic || notes ? 'topic_discussion' : 'warm_greeting');

  const isHoca = associations.some((a) =>
    ['hoca', 'ustadz', 'kyai', 'guru', 'syekh', 'abi'].some((k) => a.includes(k))
  );

  const isKeluarga = associations.some((a) =>
    ['keluarga', 'family', 'aile'].some((k) => a.includes(k))
  );

  const isIhvan = associations.some((a) =>
    ['ihvan', 'ikhwan', 'akhi', 'kardes', 'kardeş'].some((k) => a.includes(k))
  );

  const isTeman = associations.some((a) =>
    ['teman', 'sahabat', 'friend', 'arkadas', 'arkadaş'].some((k) => a.includes(k))
  );

  const isProfesional =
    contact.isProfessional ||
    associations.some((a) =>
      ['profesional', 'professional', 'kerja', 'kantor', 'bisnis', 'partner', 'iş'].some((k) =>
        a.includes(k)
      )
    );

  // -------------------------------------------------------------
  // TURKISH (TÜRKÇE) PHRASING GENERATOR
  // -------------------------------------------------------------
  if (language === 'tr') {
    const rawSubject = topic || notes;
    const subject = rawSubject
      ? isIndonesianNote(rawSubject)
        ? 'geçenlerde bahsettiğimiz konu'
        : rawSubject
      : undefined;

    // 1. Hoca category (Respectful, takzim, Hocam)
    if (isHoca) {
      if (effectiveAngle === 'topic_discussion' && subject) {
        const variants = [
          `Selamün aleyküm Hocam ${name}, afiyettesinizdir inşallah. Müsait olduğunuzda ${subject} hakkında istişare etmek isterim. Hürmetler ve dualar ile.`,
          `Selamün aleyküm Mehmet Hocam, hayırlı günler. Geçen bahsettiğiniz ${subject} konusunu merak etmiştim, vaktiniz olursa konuşmak isterim. Saygılarımla.`,
        ];
        return variants[variationIndex % variants.length].replace('Mehmet', name);
      }
      if (effectiveAngle === 'catchup_meet') {
        const variants = [
          `Selamün aleyküm Hocam ${name}, inşallah sıhhat ve afiyettesinizdir. Uygun bir vaktinizde hayır duanızı almak ve bir çayınızı içmek isterim. Saygılarımla.`,
          `Selamün aleyküm ${name} Hocam. Müsait olduğunuz bir vakit ziyaretinize gelip bir çay içmeyi çok isterim. Hürmetler ederim.`,
        ];
        return variants[variationIndex % variants.length];
      }
      // default: warm_greeting
      const variants = [
        `Selamün aleyküm Hocam ${name}, sıhhat ve afiyetiniz daim olsun inşallah. Halinizi hatırınızı sormak istedim. Saygılar ve hürmetler.`,
        `Selamün aleyküm ${name} Hocam, umarım her şey yolundadır. Gönülden selam ve hürmetlerimi iletmek istedim.`,
      ];
      return variants[variationIndex % variants.length];
    }

    // 2. Ihvan / Teman / Brotherhood (Kardeşim / Abi / Dostum)
    if (isIhvan || isTeman) {
      const salutation = isIhvan ? 'Kardeşim' : 'Dostum';
      if (effectiveAngle === 'topic_discussion' && subject) {
        const variants = [
          `Selam ${name} ${salutation}, nasılsın? Geçen konuştuğumuz ${subject} nasıl gidiyor, merak ettim.`,
          `Selamün aleyküm ${name}, umarım iyisindir. ${subject} konusu aklıma geldi, son durum nedir?`,
        ];
        return variants[variationIndex % variants.length];
      }
      if (effectiveAngle === 'catchup_meet') {
        const variants = [
          `Selam ${name}, ne zamandır görüşemedik! Bu hafta içi uygun olduğunda bir çay içelim mi?`,
          `Selamün aleyküm ${name} ${salutation}, nasılsın? Müsait bir vakitte kahve içip sohbet edelim mi?`,
        ];
        return variants[variationIndex % variants.length];
      }
      // warm_greeting
      const variants = [
        `Selam ${name}, nasılsın? Umarım her şey yolundadır, bir hal hatır sorayım dedim.`,
        `Selamün aleyküm ${name} ${salutation}, keyifler nasıl? Sağlığın, sıhhatin yerindedir inşallah.`,
      ];
      return variants[variationIndex % variants.length];
    }

    // 3. Keluarga / Family
    if (isKeluarga) {
      if (effectiveAngle === 'topic_discussion' && subject) {
        return `Canım ${name}, nasılsın? ${subject} konusunu merak ettim, her şey yolunda mı? Çok öpüyorum.`;
      }
      if (effectiveAngle === 'catchup_meet') {
        return `Canım ${name}, seni çok özledik! En kısa zamanda bir araya gelip çay içelim, çok sevgiler.`;
      }
      return `Canım ${name}, nasılsın? Sağlığın, keyfin yerindedir inşallah. Aklımdaydın, bir sesini duyayım istedim.`;
    }

    // 4. Profesional
    if (isProfesional) {
      if (effectiveAngle === 'topic_discussion' && subject) {
        return `İyi günler ${name} Bey/Hanım, umarım iyisinizdir. ${subject} konusundaki gelişmeleri takip etmek adına iletişime geçmek istedim. Saygılarımla.`;
      }
      if (effectiveAngle === 'catchup_meet') {
        return `İyi günler ${name} Bey/Hanım, umarım haftanız verimli geçiyordur. Müsait olduğunuz bir vakit kısa bir kahve veya toplantı eşliğinde istişare edebilir miyiz?`;
      }
      return `İyi günler ${name} Bey/Hanım, umarım çalışmalarınız verimli ve sağlıklı geçiyordur. Saygılarımla selamlarım.`;
    }

    // 5. General Turkish Fallback
    if (effectiveAngle === 'catchup_meet') {
      return `Merhaba ${name}, umarım iyisindir. Müsait olduğun bir vakit görüşüp bir çay içelim mi?`;
    }
    if (subject) {
      return `Merhaba ${name}, umarım iyisindir. ${subject} konusunu sormak için yazmıştım.`;
    }
    return `Merhaba ${name}, umarım her şey yolundadır ve iyisindir. Hal hatır sormak istedim.`;
  }

  // -------------------------------------------------------------
  // INDONESIAN (BAHASA INDONESIA) PHRASING GENERATOR
  // -------------------------------------------------------------

  // Multi-label 1: Hoca + Teman (Respectful Takzim greeting + Warm friendly body)
  if (isHoca && isTeman) {
    if (effectiveAngle === 'topic_discussion' && (topic || notes)) {
      const subject = topic || notes;
      const variants = [
        `Assalamu’alaikum ${name}, semoga sehat dan berkah selalu. Izin silaturahmi, kemarin kepikiran obrolan santai kita soal ${subject}. Kapan ada waktu luang buat ngobrol lagi?`,
        `Assalamu’alaikum Wr. Wb. ${name}. Izin menyapa kembali, mau nanya kabar sekaligus ngobrol santai seputar ${subject} kalau panjenengan lagi senggang. Jazakallahu khair.`,
      ];
      return variants[variationIndex % variants.length];
    }
    if (effectiveAngle === 'catchup_meet') {
      const variants = [
        `Assalamu’alaikum ${name}, semoga senantiasa sehat dan berkah. Kapan ada waktu senggang, izin ingin silaturahmi sekaligus ngopi santai bareng. Salam takzim.`,
        `Assalamu’alaikum Wr. Wb. ${name}. Kalau ada kelapangan waktu di akhir pekan, senang sekali bila bisa silaturahmi dan ngobrol santai. Salam takzim.`,
      ];
      return variants[variationIndex % variants.length];
    }
    // warm_greeting
    const variants = [
      `Assalamu’alaikum ${name}, semoga senantiasa sehat wal afiat dan dimudahkan segala urusannya. Sengaja menyapa untuk menyambung silaturahmi hangat. Salam takzim.`,
      `Assalamu’alaikum Wr. Wb. ${name}, apa kabar? Semoga selalu dalam lindungan Allah SWT. Kangen ngobrol santai bersama panjenengan.`,
    ];
    return variants[variationIndex % variants.length];
  }

  // Multi-label 2: Keluarga + Profesional (Caring family warmth + Concise business clarity)
  if (isKeluarga && isProfesional) {
    if (effectiveAngle === 'topic_discussion' && (topic || notes)) {
      const subject = topic || notes;
      const variants = [
        `Assalamu’alaikum ${name}, apa kabar sekeluarga? Semoga sehat selalu. Sekalian izin follow up perihal ${subject}, mohon infonya jika ada waktu luang ya. Terima kasih banyak!`,
        `Halo ${name}, semoga sehat dan lancar aktivitasnya sekeluarga. Mau tanya kelanjutan terkait ${subject}, kabari ya kalau sudah senggang. Salam hangat.`,
      ];
      return variants[variationIndex % variants.length];
    }
    if (effectiveAngle === 'catchup_meet') {
      return `Assalamu’alaikum ${name}, apa kabar keluarga besar? Kalau lagi ada waktu senggang, yuk kumpul santai sambil diskusi rencana kita. Sehat selalu ya!`;
    }
    return `Assalamu’alaikum ${name}, semoga sehat dan bahagia selalu sekeluarga. Menyapa dan menanyakan kabar keluarga, semoga segala urusan pekerjaan lancar ya.`;
  }

  // Pure Hoca category
  if (isHoca) {
    if (effectiveAngle === 'topic_discussion' && (topic || notes)) {
      const subject = topic || notes;
      const variants = [
        `Assalamu’alaikum Wr. Wb. ${name}, semoga senantiasa dalam limpahan kesehatan dan berkah. Izin silaturahmi, bila ada kelapangan waktu ingin menyambung silaturahmi terkait ${subject}. Jazakallahu khair, salam takzim.`,
        `Assalamu’alaikum ${name}, semoga selalu dalam naungan rahmat-Nya. Izin memohon arahan dan menyambung obrolan mengenai ${subject} jika beliau ada waktu senggang. Salam takzim.`,
      ];
      return variants[variationIndex % variants.length];
    }
    if (effectiveAngle === 'catchup_meet') {
      return `Assalamu’alaikum Wr. Wb. ${name}. Bila ada waktu luang dan kelapangan, izin ingin sowan bersilaturahmi untuk berdiskusi sejenak. Jazakallahu khair, salam takzim.`;
    }
    // warm_greeting
    const variants = [
      `Assalamu’alaikum Wr. Wb. ${name}, semoga senantiasa dalam limpahan kesehatan dan berkah Allah SWT. Izin menyapa dan mendoakan kelancaran seluruh aktivitas panjenengan. Salam takzim.`,
      `Assalamu’alaikum ${name}, semoga senantiasa sehat wal afiat. Izin menyambung tali silaturahmi dan mendoakan kebaikan bagi panjenengan sekeluarga. Salam takzim.`,
    ];
    return variants[variationIndex % variants.length];
  }

  // Pure Keluarga category
  if (isKeluarga) {
    if (effectiveAngle === 'topic_discussion' && (topic || notes)) {
      const subject = topic || notes;
      const variants = [
        `Assalamu’alaikum ${name}, apa kabar? Lagi ingat ${name}, mau nanya kabar sekaligus ngobrolin tentang ${subject}. Semoga semuanya lancar ya!`,
        `Halo ${name}, gimana perkembangan terkait ${subject}? Semoga lancar dan berkah sekeluarga ya.`,
      ];
      return variants[variationIndex % variants.length];
    }
    if (effectiveAngle === 'catchup_meet') {
      return `Assalamu’alaikum ${name}, lagi kangen nih! Kapan ada waktu luang buat kumpul keluarga atau makan bareng? Kabari yaa.`;
    }
    const variants = [
      `Assalamu’alaikum ${name}, apa kabar? Lagi kangen dan ingat ${name}, semoga senantiasa sehat, bahagia, dan selalu dalam lindungan-Nya ya.`,
      `Halo ${name}, semoga sehat dan bahagia selalu sekeluarga ya. Cuma mau nyapa dan kirim doa hangat.`,
    ];
    return variants[variationIndex % variants.length];
  }

  // Ihvan / Teman category
  if (isIhvan || isTeman) {
    const isBrotherhood = isIhvan;
    const greeting = isBrotherhood ? 'akhi' : 'bro';

    if (effectiveAngle === 'topic_discussion' && (topic || notes)) {
      const subject = topic || notes;
      const variants = [
        `Assalamu’alaikum ${name}, apa kabar ${greeting}? Kemarin sempat kepikiran soal ${subject}. Kapan-kapan santai yuk ngobrol lagi!`,
        `Halo ${name}, gimana kabar terakhir soal ${subject}? Semoga semuanya lancar ya! Kabari kalau lagi senggang.`,
      ];
      return variants[variationIndex % variants.length];
    }
    if (effectiveAngle === 'catchup_meet') {
      const variants = [
        `Assalamu’alaikum ${name}, apa kabar? Udah lama nih nggak ngobrol. Kapan ada waktu santai buat ngopi bareng?`,
        `Halo ${name}, lagi luang kapan nih? Yuk ketemuan atau ngopi santai bentar sambil catch up!`,
      ];
      return variants[variationIndex % variants.length];
    }
    // warm_greeting
    const variants = [
      `Assalamu’alaikum ${name}, apa kabar ${greeting}? Semoga sehat, berkah, dan lancar selalu aktivitasnya ya!`,
      `Halo ${name}, apa kabar? Lagi senggang nih, mau sapa dan nanya kabar. Semoga semuanya lancar jaya ya!`,
    ];
    return variants[variationIndex % variants.length];
  }

  // Pure Profesional category
  if (isProfesional) {
    if (effectiveAngle === 'topic_discussion' && (topic || notes)) {
      const subject = topic || notes;
      const variants = [
        `Selamat pagi/siang ${name}, semoga dalam keadaan baik dan sehat selalu. Saya izin menindaklanjuti perihal ${subject}. Mohon informasikan apabila ada waktu yang pas untuk berdiskusi. Terima kasih.`,
        `Halo ${name}, semoga sehat selalu. Izin follow-up terkait perkembangan ${subject}, kabari ya apabila ada waktu luang untuk update singkat. Salam hangat.`,
      ];
      return variants[variationIndex % variants.length];
    }
    if (effectiveAngle === 'catchup_meet') {
      return `Selamat pagi/siang ${name}, semoga aktivitas berjalan lancar. Jika ada kesempatan di pekan ini, izin ingin mengundang diskusi singkat atau ngopi santai. Terima kasih.`;
    }
    return `Selamat pagi/siang ${name}, semoga dalam keadaan baik dan sehat selalu. Saya izin menyapa untuk menjalin komunikasi kembali. Semoga pekerjaan dan aktivitas berjalan lancar. Salam hangat.`;
  }

  // Default Fallback
  if (effectiveAngle === 'topic_discussion' && (topic || notes)) {
    return `Halo ${name}, semoga dalam keadaan sehat dan baik selalu. Izin menyapa untuk menyambung obrolan mengenai ${topic || notes}.`;
  }
  if (effectiveAngle === 'catchup_meet') {
    return `Halo ${name}, apa kabar? Udah lama nggak ngobrol, kalau lagi ada waktu luang yuk ketemuan atau ngobrol santai!`;
  }
  const defaultVariants = [
    `Halo ${name}, apa kabar? Semoga sehat dan baik selalu, cuma mau nyapa dan menyambung silaturahmi.`,
    `Halo ${name}, semoga dalam keadaan sehat wal afiat. Senang bisa menyapa kembali, semoga hari Anda menyenangkan!`,
  ];
  return defaultVariants[variationIndex % defaultVariants.length];
}

/**
 * Returns title label for each sapa angle
 */
/**
 * Computed in code (not by the AI) so the draft knows whether the follow-up event is upcoming, today, or past.
 */
export function describeFollowUpTiming(nextSpecificFollowUp: string | null | undefined, today: Date = new Date()): string {
  if (!nextSpecificFollowUp) return '-';
  const datePart = nextSpecificFollowUp.split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return '-';
  const target = Date.UTC(y, m - 1, d);
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((target - base) / 86400000);
  if (diff === 0) return `${datePart}: HARI INI adalah hari H (ucapkan/tanyakan untuk hari ini).`;
  if (diff === 1) return `${datePart}: BESOK (doakan kelancaran persiapan).`;
  if (diff > 1) return `${datePart}: ${diff} hari lagi (masih akan datang, doakan kelancaran).`;
  if (diff === -1) return `${datePart}: KEMARIN (sudah lewat, tanyakan bagaimana hasilnya).`;
  return `${datePart}: sudah lewat ${-diff} hari (tanyakan bagaimana hasilnya).`;
}

export function getAngleTitle(angle: SapaAngle, language: SapaLanguage = 'id'): string {
  if (language === 'tr') {
    switch (angle) {
      case 'warm_greeting':
        return 'Hâl Hatır & Dua';
      case 'topic_discussion':
        return 'Konu & Gündem';
      case 'catchup_meet':
        return 'Buluşma & Çay Daveti';
    }
  }
  switch (angle) {
    case 'warm_greeting':
      return 'Kabar & Doa';
    case 'topic_discussion':
      return 'Bahasan Topik';
    case 'catchup_meet':
      return 'Ajak Temu / Ngopi';
  }
}

/**
 * Generates 3 distinct Sapa draft options (warm_greeting, topic_discussion, catchup_meet).
 * Tries Cloudflare Worker proxy first, then Gemini direct, and falls back to rich
 * deterministic generator on network/API errors.
 */
export async function generateSapaDrafts(
  options: GenerateSapaOptions,
  proxyUrl?: string,
  apiKey?: string
): Promise<{ drafts: SapaDraftOption[]; source: 'worker' | 'gemini_direct' | 'groq_direct' | 'offline_rule' }> {
  const { contact, language, previousDrafts = [] } = options;
  const variationIndex = previousDrafts.length;
  const today = new Date();

  const fallbackDrafts: SapaDraftOption[] = [
    {
      id: 'opt_warm',
      angle: 'warm_greeting',
      title: getAngleTitle('warm_greeting', language),
      text: generateDeterministicFallbackDraft(contact, language, 'warm_greeting', variationIndex),
    },
    {
      id: 'opt_topic',
      angle: 'topic_discussion',
      title: getAngleTitle('topic_discussion', language),
      text: generateDeterministicFallbackDraft(contact, language, 'topic_discussion', variationIndex),
    },
    {
      id: 'opt_meet',
      angle: 'catchup_meet',
      title: getAngleTitle('catchup_meet', language),
      text: generateDeterministicFallbackDraft(contact, language, 'catchup_meet', variationIndex),
    },
  ];

  // System Prompt for Gemini
  const langPrompt =
    language === 'tr'
      ? `Bahasa Target: TÜRKÇE (Türk adabına uygun, samimi, saygılı, Hocam/Abi/Kardeşim gibi hitapları ilişki kategorisine göre yerinde kullanan, 100% akıcı Türkçe).`
      : `Bahasa Target: BAHASA INDONESIA (Natural WhatsApp conversation, hangat, santun, multi-label blending).`;

  const prompt = [
    `Anda adalah asisten cerdas WhatsApp Sapaan Silaturahmi (Personal Relationship Assistant).`,
    `Tugas Anda adalah membuat tepat 3 (tiga) variasi draf pesan pembuka WhatsApp yang mengalir sangat alami, santai, dan luwes untuk kontak berikut:`,
    `- Nama: ${contact.name}`,
    `- Bahasa Target: ${language === 'tr' ? 'Türkçe' : 'Bahasa Indonesia'}`,
    `- Asosiasi/Label: ${contact.associations?.join(', ') || 'Teman'}`,
    `- Hubungan Profesional: ${contact.isProfessional ? 'Ya' : 'Tidak'}`,
    `- Konteks Pertemuan: ${contact.metContext || '-'}`,
    `- Catatan Kabar Terakhir: ${contact.lastUpdateNotes || '-'}`,
    `- Catatan Follow-Up / Topik dari Pengguna: ${contact.possibleFollowUpTopic || '-'}`,
    `- Fakta Penting tentang ${contact.name}: ${contact.facts?.map((f) => f.text).join(', ') || '-'}`,
    `- Hari ini: ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    `- Jadwal Follow Up: ${describeFollowUpTiming(contact.nextSpecificFollowUp, today)}`,
    ``,
    `PERAN (WAJIB): Pengirim pesan = PENGGUNA. Penerima = ${contact.name}. Semua catatan di atas ditulis pengguna TENTANG ${contact.name}: "dia/beliau" = ${contact.name}, "aku/saya" = pengguna. Tulis pesan dari pengguna LANGSUNG kepada ${contact.name} sebagai lawan bicara, jangan pernah menyebut ${contact.name} sebagai orang ketiga.`,
    `Contoh: catatan "dia baru buka toko, aku janji mampir" untuk Ahmad menjadi "Ahmad, selamat ya atas toko barunya! Insya Allah saya mampir dalam waktu dekat."`,
    ``,
    `WAKTU (WAJIB): Kata waktu di catatan ("minggu depan", "besok") ditulis pada masa lalu dan bisa sudah tidak berlaku. Selalu ikuti baris "Hari ini" dan "Jadwal Follow Up" di atas untuk menentukan apakah acaranya akan datang, hari ini, atau sudah lewat.`,
    ``,
    `ATURAN EMAS INTENT & BAHASA (SANGAT KRUSIAL):`,
    `1. PENGOLAHAN INTENSI (JANGAN SALIN MENTAH-MENTAH): Catatan follow-up / kabar di atas ditulis secara singkat atau kasar oleh pengguna sebagai pengingat pribadinya (sering kali dalam Bahasa Indonesia). JANGAN PERNAH menyalin, mengutip, atau menempelkan kata-kata catatan tersebut mentah-mentah ke dalam draf!`,
    `2. ADAPTASI & SINTESIS: Pahami MAKSUD/INTI PESANNYA, lalu susun ulang menjadi kalimat sapaan yang organik, sopan, dan luwes sesuai kepribadian hubungan. Contoh: jika catatan bertuliskan "mau nanya kelanjutan proyek riset kemarin dan ngajak ngeteh santai", ubah intinya menjadi ajakan dan sapaan yang mengalir alami tanpa menjiplak susunan kata aslinya.`,
    `3. 100% BAHASA TARGET: Seluruh teks draf wajib sepenuhnya dalam Bahasa Target (${language === 'tr' ? 'Türkçe' : 'Bahasa Indonesia'}). JANGAN PERNAH menyelipkan kata bahasa Indonesia jika bahasa target adalah Türkçe!`,
    `4. ADAB PERCAKAPAN: Jika target adalah Türkçe, gunakan etiket Turki yang autentik (misal: "Selamün aleyküm Hocam", "müsait olduğunuzda bir çay içelim mi"). Jika Indonesia, sesuaikan takzim/santai.`,
    ``,
    `3 Sudut Pandang yang WAJIB dibuat:`,
    `1. angle "warm_greeting": Menanyakan kabar, mendoakan kebaikan, kesehatan, atau kelancaran aktivitas.`,
    `2. angle "topic_discussion": Membahas secara luwes inti topik pembicaraan/proyek tanpa mengutip kata catatan mentah-mentah.`,
    `3. angle "catchup_meet": Mengajak bertemu santai (ngopi / çay içelim / diskusi ringan bila ada waktu senggang).`,
    ``,
    langPrompt,
    `Catatan Anti-Repetisi: JANGAN gunakan kalimat pembuka yang sama persis dengan draf berikut:`,
    previousDrafts.length > 0 ? previousDrafts.map((d, i) => `${i + 1}. "${d}"`).join('\n') : '(Belum ada draf sebelumnya)',
    ``,
    `KEMBALIKAN HANYA format JSON ARRAY murni tanpa markdown triple-backtick, seperti:`,
    `[`,
    `  {"angle": "warm_greeting", "title": "${getAngleTitle('warm_greeting', language)}", "text": "pesan 1..."},`,
    `  {"angle": "topic_discussion", "title": "${getAngleTitle('topic_discussion', language)}", "text": "pesan 2..."},`,
    `  {"angle": "catchup_meet", "title": "${getAngleTitle('catchup_meet', language)}", "text": "pesan 3..."}`,
    `]`,
  ].join('\n');

  // 1. Try Cloudflare Worker Proxy
  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const workerEndpoint = proxyUrl || (!isTestEnv ? DEFAULT_WORKER_PROXY_URL : undefined);
  if (workerEndpoint) {
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];
    for (const modelToTry of modelsToTry) {
      try {
        let resp = await fetch(workerEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: modelToTry,
            temperature: 0.85,
          }),
        });

        // If temporary 503 spike, wait 800ms and retry once
        if (resp.status === 503) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          resp = await fetch(workerEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              model: modelToTry,
              temperature: 0.85,
            }),
          });
        }

        if (resp.ok) {
          const data = await resp.json();
          const rawText =
            data?.choices?.[0]?.message?.content ||
            data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof rawText === 'string') {
            const parsed = parseDraftsJson(rawText, fallbackDrafts);
            if (parsed.length === 3) {
              return { drafts: parsed, source: 'worker' };
            }
          }
        }
      } catch (_err) {
        // try next model
      }
    }
  }

  // 2. Try Direct API (Groq if starts with 'gsk_', or Google Gemini)
  if (apiKey && apiKey.trim()) {
    const key = apiKey.trim();
    if (key.startsWith('gsk_')) {
      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3-32b'];
      for (const modelToTry of groqModels) {
        try {
          const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelToTry,
              messages: [
                {
                  role: 'system',
                  content:
                    'Anda adalah asisten cerdas WhatsApp Sapaan Silaturahmi. Kembalikan HANYA format JSON ARRAY murni tanpa backtick markdown.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              temperature: 0.85,
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            const rawText = data?.choices?.[0]?.message?.content;
            if (typeof rawText === 'string') {
              const parsed = parseDraftsJson(rawText, fallbackDrafts);
              if (parsed.length === 3) {
                return { drafts: parsed, source: 'groq_direct' };
              }
            }
          }
        } catch (_err) {
          // try next model
        }
      }
    } else {
      const directModels = [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
      ];
      for (const modelToTry of directModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${encodeURIComponent(
            key
          )}`;
          let resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.85, maxOutputTokens: 600 },
            }),
          });

          if (resp.status === 503) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            resp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.85, maxOutputTokens: 600 },
              }),
            });
          }

          if (resp.ok) {
            const data = await resp.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (typeof rawText === 'string') {
              const parsed = parseDraftsJson(rawText, fallbackDrafts);
              if (parsed.length === 3) {
                return { drafts: parsed, source: 'gemini_direct' };
              }
            }
          }
        } catch (_err) {
          // try next model
        }
      }
    }
  }

  // 3. Deterministic Rich Fallback
  return { drafts: fallbackDrafts, source: 'offline_rule' };
}

/**
 * Safely parses JSON response from Gemini or strips markdown blocks
 */
function parseDraftsJson(raw: string, fallback: SapaDraftOption[]): SapaDraftOption[] {
  try {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const arr = JSON.parse(cleaned);
    if (Array.isArray(arr) && arr.length >= 3) {
      return arr.slice(0, 3).map((item, idx) => {
        if (typeof item === 'string') {
          return {
            id: `opt_${idx}`,
            angle: fallback[idx].angle,
            title: fallback[idx].title,
            text: item.trim() || fallback[idx].text,
          };
        }
        return {
          id: `opt_${item.angle || idx}`,
          angle: (item.angle as SapaAngle) || fallback[idx].angle,
          title: item.title || fallback[idx].title,
          text: (item.text || '').trim() || fallback[idx].text,
        };
      });
    }
  } catch (_e) {
    // fallback if JSON parsing fails
  }
  return fallback;
}

/**
 * Legacy compatibility wrapper: generates single WhatsApp draft string
 */
export async function generateWhatsAppDraft(
  contact: Contact,
  apiKey?: string,
  language?: SapaLanguage
): Promise<string> {
  const chosenLang: SapaLanguage = language || (isTurkishPhoneNumber(contact.phoneNumber) ? 'tr' : 'id');
  const fallbackDraft = generateDeterministicFallbackDraft(contact, chosenLang);

  if (!apiKey || !apiKey.trim()) {
    return fallbackDraft;
  }

  const key = apiKey.trim();

  // If user provided a Groq key (gsk_...)
  if (key.startsWith('gsk_')) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text === 'string' && text.trim().length > 0) {
          return text.trim();
        }
      }
    } catch (_err) {
      return fallbackDraft;
    }
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      key
    )}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
        },
      }),
    });

    if (!response.ok) {
      return fallbackDraft;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof candidateText === 'string' && candidateText.trim().length > 0) {
      return candidateText.trim();
    }

    return fallbackDraft;
  } catch (_error) {
    return fallbackDraft;
  }
}
