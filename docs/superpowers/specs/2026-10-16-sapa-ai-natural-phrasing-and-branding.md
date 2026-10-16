# Desain Spesifikasi: "Sapa" — Pembaruan AI Sapaan Alami, Identitas Visual, & Interaksi Halus Bergaya iOS

**Tanggal:** 16 Oktober 2026  
**Status:** Draf untuk Review  
**Topik:** Mesin AI Sapaan Alami (Multi-Label & Dwibahasa ID/TR), Identitas Merek "Sapa", dan Animasi Fluid Gemini Glow bergaya iOS.

---

## 1. Latar Belakang & Tujuan (Intent & The Why)
Pengguna mendapati bahwa fitur pembuatan sapaan otomatis saat ini masih terasa kaku dan robotik. Sistem sebelumnya hanya menempelkan teks mentah dari catatan `possibleFollowUpTopic` ke dalam cetakan kalimat statis (*"Hai [Nama], kemarin sempat dengar cerita tentang [Topik]..."*). Padahal dalam kenyataannya:
- Catatan tindak lanjut yang diketik pengguna biasanya berupa frasa/poin singkat (misal: *"mau nanya progres rumah BSD & agenda rihlah"*), bukan kalimat siap kirim.
- Hubungan antarmanusia bersifat dinamis dan sering kali memiliki label majemuk (misal: seseorang bisa berstatus sebagai `Hoca` sekaligus `Teman`, atau `Keluarga` sekaligus `Profesional`).
- Pengguna memiliki relasi asal Turki (`+90`) yang memerlukan tata bahasa dan adab sapaan khas Turki (*Türkçe*) yang natural.
- Pengguna menginginkan opsi sapaan yang variatif dan unik setiap kali meminta draf baru, disajikan dalam antarmuka yang bersih, elegan, dan memiliki sentuhan gerak halus khas iOS (*iOS vibe*) dengan indikator berpikir berpendar seperti Gemini Live.
- Nama aplikasi disepakati berganti dari "Kinship" menjadi **"Sapa"**, dengan seluruh antarmuka dilokalisasi 100% ke bahasa Indonesia.

---

## 2. Sasaran & Batasan (Goals, Non-Goals, Anti-Goals)

### Sasaran Utama (Goals):
1. **Identitas Merek "Sapa":**
   - Mengganti seluruh nama "Kinship" dan "GrowSphere" di antarmuka menjadi **Sapa**.
   - Mengganti monogram avatar "KS" di bilah navigasi atas dengan logo resmi **Sapa**.
   - Melokalisasi seluruh istilah bahasa Inggris yang tersisa (seperti *Upcoming Catch-ups*, *Inbox*, *Dossier*, *Today's Reminders*, dll.) ke bahasa Indonesia yang alami dan hangat.
2. **Mesin Sapaan Alami Cerdas (AI Sapa Engine):**
   - Membedah catatan singkat (*shorthand parsing*) menjadi kalimat percakapan mengalir layaknya diketik langsung oleh manusia di WhatsApp.
   - **Multi-Label Tone Blending:** Melebur etika dan rasa bahasa dari beberapa label sekaligus (misal: rasa hormat & adab takzim `Hoca` berpadu dengan kehangatan `Teman`).
   - **Dukungan Dwibahasa (Indonesia & Turki):** Mendukung bahasa Indonesia dan bahasa Turki (*Türkçe*) dengan adab panggilan khas (*Hocam, Abi, Kardeşim, çay içelim*), dengan deteksi otomatis untuk nomor Turki (+90) serta sakelar manual.
3. **Penyajian 3 Opsi Sekaligus & Generate Ulang Tanpa Batas:**
   - Menyajikan 3 draf sapaan instan dengan sudut pandang berbeda (Opsi 1: Kabar & Doa, Opsi 2: Bahasan Topik Inti, Opsi 3: Ajak Temu/Ngopi/Çay).
   - Tombol **Generate Ulang** dapat ditekan berulang kali tanpa batas, menghasilkan variasi baru yang anti-repetisi dengan memori draf sebelumnya.
4. **Sentuhan Interaksi iOS & Pendaran Gemini Live:**
   - *Fisika Pegas Apple:* Kurva transisi lembut `cubic-bezier(0.32, 0.72, 0, 1)` dan mikro-interaksi sentuh empuk (`active:scale-[0.96]`).
   - *Kaca Buram Transparan:* `backdrop-blur-xl bg-white/80` dengan garis tepi ultra-halus (*hairline border*).
   - *iOS Segmented Controls:* Kapsul geser untuk pemilihan bahasa dan opsi sapaan.
   - *Indikator Berpikir Gemini Live:* Pendaran gradien aurora mengalir (*fluid iridescent glow*) pada bingkai kartu saat AI meracik kata, berpadu dengan gelombang kilau (*shimmer wave*) di dalam kartu.

### Bukan Sasaran (Non-Goals):
- Mengirim pesan WhatsApp secara otomatis di latar belakang tanpa interaksi pengguna (pesan tetap dibuka di aplikasi WhatsApp resmi agar pengguna memegang kendali penuh).
- Mengubah skema basis data 10 kolom Notion Dexie (data relasi tetap utuh dan kompatibel).

### Hal yang Dilarang (Anti-Goals):
- Menggunakan kalimat template kaku atau kata-kata robotik generik ("Halo kawan", "Saya ingin menindaklanjuti obrolan kita").
- Menghasilkan kalimat yang sama atau berulang saat tombol Generate Ulang ditekan berkali-kali.

---

## 3. Keputusan Desain & Arsitektur (How It Gets Made)

### 3.1. Identitas Visual & Lokalisasi Total
1. **Nama Aplikasi:** **Sapa**  
   - Header Bar: "Sapa" dengan ikon logo bertema percakapan hangat dan silaturahmi.
   - Subtitle: "Rawat & jaga ritme silaturahmi".
2. **Penerjemahan Istilah Antarmuka:**
   - *Upcoming Catch-ups* ➔ **Jadwal Sapaan**
   - *Inbox* ➔ **Kotak Masuk**
   - *Cadence Rules* ➔ **Aturan Ritme**
   - *Today's Reminders* ➔ **Pengingat Hari Ini**
   - *Agenda Minggu Ini* ➔ **Agenda Pekan Ini**
   - *Dossier Relasi* ➔ **Profil Relasi**
   - *Queue & Dispatch Settings* ➔ **Pengaturan Notifikasi & Antrean**
   - *Daily Morning Digest* ➔ **Ringkasan Sapaan Pagi**
   - *Receive Push Notifications* ➔ **Terima Notifikasi Sistem**
   - *Auto-open WhatsApp* ➔ **Buka WhatsApp Otomatis**
   - *Live Sync* ➔ **Sinkron Otomatis**
   - *Sync Phonebook* ➔ **Sinkronisasi Kontak HP**

### 3.2. Mesin Sapaan Alami (AI Sapaan Engine)
Modul: `src/services/aiDraftService.ts`

1. **Struktur Parameter:**
   ```typescript
   export type SapaLanguage = 'id' | 'tr';

   export interface GenerateSapaOptions {
     contact: Contact;
     language: SapaLanguage;
     targetAngle?: 'warm_greeting' | 'topic_discussion' | 'catchup_meet' | 'curious_question' | 'concise';
     previousDrafts?: string[];
     now?: Date;
   }
   ```
2. **Logika Peleburan Multi-Label (*Tone Blending*):**
   - **Hoca + Teman:** Awalan santun/salam takzim (*"Assalamu'alaikum Hoca..."* / *"Selamün aleyküm Hocam..."*), namun isi pesan mengalir hangat, santai, dan penuh persaudaraan.
   - **Ihvan + Teman:** Bernuansa ukhuwah karib (*"Akhi / Bro..."* / *"Kardeşim / Abim..."*).
   - **Keluarga + Profesional:** Penuh perhatian keluarga namun lugas saat membicarakan urusan pekerjaan.
   - **Profesional murni:** Santun, ringkas, dan menghargai waktu relasi.
3. **Penyusunan Kalimat Dwibahasa (ID & TR):**
   - *Bahasa Indonesia:* Kosakata percakapan WhatsApp Indonesia alami ("gimana kabarnya?", "sempat kepikiran obrolan kita kemarin", "kalau lagi senggang kabari yaa").
   - *Türkçe:* Tata krama khas Turki yang natural ("İnşallah afiyettesinizdir", "geçen konuştuğumuz konuyu merak etmiştim", "en kısa zamanda bir çay içelim").
   - Deteksi Otomatis: Jika nomor telepon berawalan `+90`, default bahasa disetel ke `'tr'`, sebaliknya `'id'`.
4. **Anti-Repetisi & Variasi Tak Terbatas:**
   - Menyimpan daftar `previousDrafts` di sesi draf.
   - Parameter kreativitas `temperature: 0.85` pada prompt Gemini, disertai instruksi keras melarang pengulangan frasa pembuka atau struktur yang telah muncul di `previousDrafts`.
   - Modul Fallback Offline: Memiliki bank variasi pembuka, penyambung konteks, dan penutup yang kaya secara kombinatorik (lebih dari 150 kombinasi unik per label).

### 3.3. Antarmuka Pengguna & Interaksi iOS (`AiDraftModal.tsx`)
1. **iOS Segmented Language Switcher:**
   - Komponen kapsul bergaya iOS di bagian atas: `[ 🇮🇩 Indonesia | 🇹🇷 Türkçe ]`.
   - Menggeser kapsul aktif secara mulus dengan animasi pegas.
2. **Penyajian 3 Opsi Sapaan Instan:**
   - Menampilkan 3 kartu draf sekaligus:
     - **Opsi 1 (Hangat & Kabar):** Menanyakan kabar dan mendoakan kebaikan.
     - **Opsi 2 (Bahasan Topik):** Langsung mengulas catatan topik terakhir.
     - **Opsi 3 (Ajak Temu / Ngopi / Çay):** Mengajak bertemu santai.
   - Pengguna cukup mengetuk kartu opsi untuk memilih, dan teks langsung siap diedit atau dikirim.
3. **Tombol "Generate Ulang" Tanpa Batas:**
   - Tombol dengan ikon pendaran Gemini. Setiap kali ditekan, sistem meracik 3 variasi baru yang segar tanpa menghilangkan draf yang sudah dipilih.
4. **Animasi Berpikir Gemini Live (*Fluid Aura Glow*):**
   - Saat sedang membuat draf (`isGenerating = true`):
     - Bingkai kartu sapaan memancarkan gradasi berputar dinamis: `linear-gradient(135deg, #3B82F6, #8B5CF6, #06B6D4, #10B981)`.
     - Animasi CSS `@keyframes geminiAura`: pergeseran sudut gradien dan pendaran blur `blur(12px)` lembut.
     - Di dalam kartu: efek `@keyframes shimmerWave` translusen melintas lembut secara berulang.
   - Saat selesai (`isGenerating = false`):
     - Pendaran mereda dengan transisi pegas (`transition: all 400ms cubic-bezier(0.32, 0.72, 0, 1)`), menampilkan teks pesan secara tegas.

---

## 4. Rincian Teknis untuk Pembangun (What's Left to the Builder)
1. **Animasi Tailwind / CSS:**
   - Menambahkan utilitas kelas CSS khusus untuk animasi pendaran Gemini di `src/index.css` atau Tailwind config:
     - `.gemini-aura-glow`: gradasi dinamis dengan filter pendaran.
     - `.ios-spring`: kurva `transition: all 300ms cubic-bezier(0.32, 0.72, 0, 1)`.
     - `.ios-tap`: kelas aktif `active:scale-[0.96] transition-transform duration-150`.
2. **Penggantian Branding & Teks:**
   - Memperbarui komponen `App.tsx`, `KinshipDashboardView.tsx`, `KinshipNotificationsView.tsx`, `KinshipContactDossierModal.tsx`, `KinshipPhonebookSyncView.tsx`, dan `AiDraftModal.tsx`.
   - Mengganti teks bahasa Inggris dengan kamus bahasa Indonesia yang konsisten.
   - Mengganti logo "KS" dengan SVG logo **Sapa** (ikon obrolan silaturahmi elegan dengan pendar hijau zamrud).
3. **Unit Tests & Regresi:**
   - Menambahkan pengujian untuk multi-label tone blending dan bahasa Turki di `tests/services/aiDraftService.test.ts`.
   - Menambahkan pengujian untuk antarmuka opsi sapaan dan sakelar bahasa di `tests/components/AiDraftModal.test.tsx`.
   - Memastikan seluruh test suite eksisting tetap 100% lulus (26/26 test suites).
4. **Kompilasi & Pemasangan APK:**
   - Menjalankan `npm run build && npx cap sync android`.
   - Mengompilasi APK debug via `./gradlew assembleDebug`.
   - Menguji langsung pada emulator Android dan mendokumentasikan tangkapan layarnya.
