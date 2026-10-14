import { Contact } from '../types/crm';

/**
 * Deterministically generates an appropriate WhatsApp opening draft based on
 * relationship tags, formality, context, and follow-up notes.
 *
 * Rules:
 * - Hoca: polite/takzim honorifics (Assalamu’alaikum, tawadhu, respect).
 * - Ihvan / Teman: warm, friendly, and personal brotherhood tone.
 * - Keluarga: loving, caring, and personal family tone.
 * - Profesional: formal, polite, and concise business tone.
 * - Synthesizes possibleFollowUpTopic or lastUpdateNotes naturally into the text.
 */
export function generateDeterministicFallbackDraft(contact: Contact): string {
  const name = contact.name?.trim() || 'Sahabat';
  const associations = (contact.associations || []).map(a => a.toLowerCase().trim());
  const topic = contact.possibleFollowUpTopic?.trim();
  const notes = contact.lastUpdateNotes?.trim();

  const isHoca = associations.some(a =>
    a.includes('hoca') ||
    a.includes('ustadz') ||
    a.includes('kyai') ||
    a.includes('guru') ||
    a.includes('syekh') ||
    a.includes('abi')
  );

  const isKeluarga = associations.some(a =>
    a.includes('keluarga') ||
    a.includes('family')
  );

  const isIhvanOrTeman = associations.some(a =>
    a.includes('ihvan') ||
    a.includes('ikhwan') ||
    a.includes('teman') ||
    a.includes('sahabat') ||
    a.includes('friend')
  );

  const isProfesional =
    contact.isProfessional ||
    associations.some(a =>
      a.includes('profesional') ||
      a.includes('professional') ||
      a.includes('kerja') ||
      a.includes('kantor') ||
      a.includes('bisnis') ||
      a.includes('partner')
    );

  // 1. Hoca category (Top precedence)
  if (isHoca) {
    let body = '';
    if (topic) {
      body = `Izin silaturahmi, bila ada kelapangan waktu ingin menyambung silaturahmi terkait ${topic}.`;
    } else if (notes) {
      body = `Izin silaturahmi, semoga kabar mengenai ${notes} senantiasa dilancarkan oleh Allah SWT.`;
    } else {
      body = `Izin menyapa dan menyambung silaturahmi, semoga segala ikhtiar dan aktivitas panjenengan senantiasa dimudahkan Allah SWT.`;
    }
    return `Assalamu’alaikum Wr. Wb. ${name}, semoga senantiasa dalam limpahan kesehatan dan berkah. ${body} Jazakallahu khair, salam takzim.`;
  }

  // 2. Keluarga category
  if (isKeluarga) {
    let body = '';
    if (topic) {
      body = `Lagi ingat ${name}, mau nanya kabar sekaligus ngobrolin tentang ${topic}. Semoga semuanya lancar ya!`;
    } else if (notes) {
      body = `Lagi ingat ${name}, gimana perkembangan terkait ${notes}? Semoga lancar dan berkah sekeluarga ya.`;
    } else {
      body = `Lagi kangen dan ingat ${name}, semoga senantiasa sehat, bahagia, dan selalu dalam lindungan-Nya ya.`;
    }
    return `Assalamu’alaikum ${name}, apa kabar? ${body}`;
  }

  // 3. Ihvan / Teman category
  if (isIhvanOrTeman) {
    const isBrotherhood = associations.some(a => a.includes('ihvan') || a.includes('ikhwan'));
    const greeting = isBrotherhood
      ? `Assalamu’alaikum ${name}, apa kabar akhi? Semoga sehat dan berkah selalu.`
      : `Halo ${name}, apa kabar? Semoga sehat dan lancar selalu aktivitasnya.`;

    let body = '';
    if (topic) {
      body = `Mau nyambung silaturahmi nih, kemarin kepikiran soal ${topic}. Kapan-kapan santai yuk ngobrol lagi!`;
    } else if (notes) {
      body = `Mau nyapa, gimana kabar terakhir soal ${notes}? Semoga semuanya lancar ya!`;
    } else {
      body = `Lagi senggang nih, mau sapa dan nanya kabar. Kapan ada waktu luang buat ngobrol santai?`;
    }
    return `${greeting} ${body}`;
  }

  // 4. Profesional category
  if (isProfesional) {
    let body = '';
    if (topic) {
      body = `Saya izin menindaklanjuti perihal ${topic}. Mohon informasikan apabila ada waktu yang pas untuk berdiskusi.`;
    } else if (notes) {
      body = `Saya izin menyapa sekaligus menanyakan kabar dan perkembangan terkait ${notes}.`;
    } else {
      body = `Saya izin menyapa untuk menjalin komunikasi kembali. Semoga aktivitas dan pekerjaan berjalan lancar.`;
    }
    return `Selamat pagi/siang ${name}, semoga dalam keadaan baik dan sehat selalu. ${body} Terima kasih dan salam hangat.`;
  }

  // 5. Default fallback
  let body = '';
  if (topic) {
    body = `Izin menyapa untuk menyambung obrolan mengenai ${topic}.`;
  } else if (notes) {
    body = `Izin menyapa, semoga hal terkait ${notes} berjalan lancar.`;
  } else {
    body = `Senang bisa menyapa kembali, semoga hari Anda menyenangkan!`;
  }
  return `Halo ${name}, semoga dalam keadaan sehat dan baik selalu. ${body}`;
}

/**
 * Generates an AI-powered WhatsApp draft message for a contact using Gemini API.
 * If an apiKey is not provided, or if the API call fails / is offline, it
 * gracefully falls back to generateDeterministicFallbackDraft without throwing errors.
 */
export async function generateWhatsAppDraft(contact: Contact, apiKey?: string): Promise<string> {
  const fallbackDraft = generateDeterministicFallbackDraft(contact);

  if (!apiKey || !apiKey.trim()) {
    return fallbackDraft;
  }

  const prompt = [
    `Anda adalah asisten Personal Relationship CRM. Buat 1 draf pesan pembuka WhatsApp (2-3 kalimat) yang sangat natural, hangat, dan santun dalam Bahasa Indonesia untuk menghubungi kontak berikut:`,
    `- Nama: ${contact.name}`,
    `- Kategori/Asosiasi: ${contact.associations?.join(', ') || 'Umum'}`,
    `- Hubungan Profesional: ${contact.isProfessional ? 'Ya' : 'Tidak'}`,
    `- Konteks Pertemuan: ${contact.metContext || '-'}`,
    `- Catatan Kabar Terakhir: ${contact.lastUpdateNotes || '-'}`,
    `- Topik Follow-Up Berikutnya: ${contact.possibleFollowUpTopic || '-'}`,
    ``,
    `Panduan gaya:`,
    `- Jika kategori Hoca/Ustadz: gunakan salam takzim 'Assalamu’alaikum', sangat santun, tawadhu, dan penuh hormat.`,
    `- Jika Ihvan/Teman: hangat, akrab, dan bersahabat.`,
    `- Jika Keluarga: penuh kasih sayang dan personal.`,
    `- Jika Profesional: sopan, profesional, dan ringkas.`,
    `- Sisipkan topik follow-up atau kabar terakhir secara natural jika tersedia.`,
    `- HANYA kembalikan teks pesan sapaan saja tanpa tanda petik pembuka/penutup, tanpa salam penutup formal surat, dan tanpa penjelasan pengantar.`,
  ].join('\n');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
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
    // Offline or network error: gracefully return deterministic fallback
    return fallbackDraft;
  }
}
