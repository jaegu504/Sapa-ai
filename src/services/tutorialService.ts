export type TourContext = 'shell' | 'dossier' | 'draft';

export type TourStepId =
  | 'radar-tab'
  | 'contacts-tab'
  | 'add-contact'
  | 'pick-contact'
  | 'field-met'
  | 'field-notes'
  | 'field-topic'
  | 'field-schedule'
  | 'voice-note'
  | 'jadwal-tab'
  | 'draft-ai'
  | 'draft-pick'
  | 'whatsapp';

export interface TourStep {
  id: TourStepId;
  /** Value of the `data-tour` attribute on the real element to highlight. */
  target: string;
  context: TourContext;
  tab?: 'radar' | 'contacts' | 'notifications';
  advance: 'next' | 'click';
  hideNext?: boolean;
  title: string;
  body: string;
}

export type TutorialStatus = 'intro' | 'tour' | 'done';

export interface TutorialState {
  status: TutorialStatus;
  stepId?: TourStepId;
  contactId?: string;
}

export const TUTORIAL_STORAGE_KEY = 'sapa_tutorial_state';
// Written by the old 3-slide onboarding; its presence marks an existing user.
const LEGACY_ONBOARDING_KEY = 'sapa_onboarding_completed';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'radar-tab',
    target: 'nav-radar',
    context: 'shell',
    tab: 'radar',
    advance: 'next',
    title: 'Beranda Radar',
    body: 'Di sini Sapa menunjukkan siapa saja yang sudah waktunya disapa dan seberapa hangat silaturahmi Anda.',
  },
  {
    id: 'contacts-tab',
    target: 'nav-contacts',
    context: 'shell',
    tab: 'radar',
    advance: 'click',
    title: 'Buka Daftar Kontak',
    body: 'Ketuk tab Kontak untuk melihat semua relasi Anda.',
  },
  {
    id: 'add-contact',
    target: 'add-actions',
    context: 'shell',
    tab: 'contacts',
    advance: 'click',
    title: 'Tambahkan Kontak untuk Tutorial',
    body: 'Untuk tutorial ini, tambahkan satu kontak sungguhan lewat + Tambah Kontak, atau ambil dari buku telepon lewat Impor HP. Sudah punya kontak? Ketuk Berikutnya.',
  },
  {
    id: 'pick-contact',
    target: 'contact-list',
    context: 'shell',
    tab: 'contacts',
    advance: 'click',
    hideNext: true,
    title: 'Pilih Satu Kontak untuk Latihan',
    body: 'Ketuk salah satu kontak. Kontak ini akan kita pakai sampai akhir tutorial.',
  },
  {
    id: 'field-met',
    target: 'field-met',
    context: 'dossier',
    advance: 'next',
    title: 'Pertama Ketemu & Konteks',
    body: 'Catat di mana dan bagaimana Anda kenal orang ini, misalnya "kenal di kajian Ahad di masjid kampus".',
  },
  {
    id: 'field-notes',
    target: 'field-notes',
    context: 'dossier',
    advance: 'next',
    title: 'Pembaruan Kabar Terakhir',
    body: 'Tulis kabar terbaru tentang dia: pekerjaan, keluarga, kesehatan. Ini membantu Anda ingat konteks saat menyapa.',
  },
  {
    id: 'field-topic',
    target: 'field-topic',
    context: 'dossier',
    advance: 'next',
    title: 'Bahan Obrolan Follow Up Berikutnya',
    body: 'Ini kolom terpenting. Tulis apa yang ingin Anda tanyakan atau bahas saat menyapa berikutnya, misalnya "tanya kabar ibunya yang baru operasi". Draf AI memakai kolom ini untuk menyusun pesan yang personal. Coba ketik satu kalimat sekarang (ini mengubah kontak Anda sungguhan).',
  },
  {
    id: 'field-schedule',
    target: 'field-schedule',
    context: 'dossier',
    advance: 'next',
    title: 'Jadwal & Ritme Sapa',
    body: 'Atur tanggal follow up khusus untuk mendapat alarm, dan Ritme Sapa (hari) supaya Sapa mengingatkan Anda secara berkala.',
  },
  {
    id: 'voice-note',
    target: 'dossier-voice',
    context: 'dossier',
    advance: 'next',
    title: 'Catat Kabar dengan Suara',
    body: 'Habis ngobrol dan dapat kabar baru? Ketuk tombol ini lalu cukup bercerita, misalnya "anaknya baru lahir, tanggal 31 dia buka toko". Sapa merapikannya ke kolom kabar, Fakta Penting, bahan obrolan, dan jadwal follow up. Anda periksa dulu, lalu ketuk Perbarui. Tombol mikrofon besar juga ada di tengah bawah layar, jadi bisa langsung dipakai dari mana saja.',
  },
  {
    id: 'jadwal-tab',
    target: 'nav-notifications',
    context: 'shell',
    tab: 'notifications',
    advance: 'next',
    title: 'Jadwal & Pengingat',
    body: 'Di tab Jadwal ada rangkuman pagi dan daftar sapaan yang terjadwal. Sapa akan mengirim notifikasi pengingat ke HP Anda.',
  },
  {
    id: 'draft-ai',
    target: 'dossier-draft-ai',
    context: 'dossier',
    advance: 'click',
    title: 'Buat Draf dengan AI',
    body: 'Ketuk Draf AI. Sapa akan menyusun 3 pilihan pesan pembuka berdasarkan catatan kontak ini.',
  },
  {
    id: 'draft-pick',
    target: 'draft-options',
    context: 'draft',
    advance: 'click',
    title: 'Pilih Satu Draf',
    body: 'Ketuk salah satu dari 3 pilihan pesan. Anda masih bisa mengedit teksnya.',
  },
  {
    id: 'whatsapp',
    target: 'draft-whatsapp',
    context: 'draft',
    advance: 'click',
    title: 'Kirim lewat WhatsApp',
    body: 'Ketuk WhatsApp atau WhatsApp Business. Pesan tidak terkirim otomatis: WhatsApp terbuka dengan draf siap, lalu Anda sendiri yang menekan kirim.',
  },
];

const STATUSES: TutorialStatus[] = ['intro', 'tour', 'done'];

function defaultState(): TutorialState {
  try {
    return { status: localStorage.getItem(LEGACY_ONBOARDING_KEY) === 'true' ? 'done' : 'intro' };
  } catch {
    return { status: 'intro' };
  }
}

export function loadTutorialState(): TutorialState {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && STATUSES.includes(parsed.status)) {
        const state: TutorialState = { status: parsed.status };
        if (TOUR_STEPS.some((s) => s.id === parsed.stepId)) state.stepId = parsed.stepId;
        if (typeof parsed.contactId === 'string') state.contactId = parsed.contactId;
        return state;
      }
    }
  } catch {
    // Corrupt or unavailable storage: fall through to the default.
  }
  return defaultState();
}

export function saveTutorialState(state: TutorialState): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage failures
  }
}

export function resetTutorial(): TutorialState {
  const state: TutorialState = { status: 'intro' };
  saveTutorialState(state);
  return state;
}

export function getStep(id: TourStepId): TourStep {
  return TOUR_STEPS.find((s) => s.id === id) as TourStep;
}

export function nextStepId(id: TourStepId): TourStepId | null {
  const index = TOUR_STEPS.findIndex((s) => s.id === id);
  return TOUR_STEPS[index + 1]?.id ?? null;
}

export function resolveResumeStep(
  state: TutorialState,
  contactExists: (id: string) => boolean
): TourStepId {
  const stepId = state.stepId ?? 'radar-tab';
  const step = getStep(stepId);
  if (step.context !== 'shell' && !(state.contactId && contactExists(state.contactId))) {
    return 'pick-contact';
  }
  // The draft modal cannot be restored mid-flow; reopen it with a tap.
  if (step.context === 'draft') return 'draft-ai';
  return stepId;
}
