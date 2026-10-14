# GrowSphere — Personal Relationship CRM

> **Merawat Silaturahmi, Memperkuat Ukhuwah, Menjaga Relasi Bermakna.**  
> Aplikasi Personal CRM modern berarsitektur **Local-First Offline**, terintegrasi dengan **WhatsApp 1-Click Direct Link** dan **Google Gemini AI Draft Generator**, dirancang dengan visual *Pinterest-inspired GrowSphere design tokens* dan kompatibilitas penuh dengan **10 Skema Properti Notion CRM**.

---

## 🌟 Daftar Fitur Unggulan

- **📱 Local-First & 100% Offline (Dexie IndexedDB):**  
  Seluruh data kontak, catatan, dan riwayat silaturahmi tersimpan aman di perangkat Anda tanpa ketergantungan server backend eksternal. Privasi nomor telepon dan catatan keluarga terjamin 100%.

- **🎨 Dual View: Mode Kartu GrowSphere & Mode Tabel Notion:**  
  Beralih mulus antara antarmuka kartu mobile modern (Pinterest aesthetic) dan format tabel database Notion CRM lengkap dengan kolom sticky, pill status, dan sorting interaktif.

- **📊 Dual Metrics & Health Score:**  
  Pantau jumlah relasi yang terlambat disapa (*Time to reach out*) dan persentase skor kesehatan silaturahmi (*Harmoni Hubungan*) secara real-time.

- **💬 WhatsApp 1-Click Direct Deep Link:**  
  Buka obrolan WhatsApp resmi (`https://wa.me/<normalized_phone>?text=...`) langsung tanpa perlu menyimpan nomor ke buku telepon ponsel terlebih dahulu.

- **🤖 Google Gemini AI WhatsApp Draft Generator:**  
  Menyusun draf sapaan pembuka WhatsApp yang cerdas dan beradab, secara otomatis menyesuaikan etika & *tone of voice*:
  - **Hoca / Guru:** Nada takzim, hormat, dan santun.
  - **Keluarga:** Nada penuh kasih sayang dan perhatian mendalam.
  - **Ihvan / Sahabat:** Nada hangat, bersahabat, dan santai.
  - **Profesional:** Nada formal, efisien, dan lugas.

- **⏰ Alarm & Rangkuman Harian (Daily Digest):**  
  Menghitung secara otomatis kontak yang jatuh tempo follow-up hari ini serta mendeteksi alarm target tanggal khusus dalam 24–48 jam ke depan.

- **📥 Impor Kontak Handphone Instan:**  
  Mendukung *Contact Picker API* peramban dan adapter native ponsel pintar Android, dilengkapi deduplikasi otomatis berbasis normalisasi nomor internasional E.164.

---

## 📋 Pemetaan 10 Properti Skema Notion CRM

Aplikasi ini mengimplementasikan skema Notion Personal CRM 1-ke-1 secara presisi:

| No | Properti Notion | Tipe Data | Deskripsi & Implementasi di GrowSphere |
|:---:|:---|:---|:---|
| 1 | **Nama** | `Title` | Nama lengkap relasi atau ustadz/guru. |
| 2 | **Asosiasi** | `Multi-select` | Kategori relasi: `Ihvan`, `Hoca`, `Keluarga`, `Zahiri`, `Teman`, `Profesional`. |
| 3 | **Pembaruan Terakhir** | `Text` | Catatan perkembangan kabar, kondisi keluarga, atau pekerjaan terkini. |
| 4 | **Status** | `Formula` | Status otomatis dihitung: `⏰ Time to reach out!` jika melewati siklus, atau `👍 Aman`. |
| 5 | **Terakhir Dihubungi** | `Date` | Tanggal terakhir silaturahmi atau obrolan dilakukan (`YYYY-MM-DD`). |
| 6 | **Kontak Profesional** | `Checkbox` | Menandai relasi jaringan kerja/bisnis (`true` / `false`). |
| 7 | **Ketemu di mana & bagaimana** | `Text` | Rekam jejak sejarah awal perjumpaan atau perkenalan. |
| 8 | **Next Follow Up** | `Date` | Tanggal target pengingat alarm spesifik untuk agenda mendatang. |
| 9 | **Possible Follow Up** | `Text` | Ide topik diskusi atau bahan silaturahmi untuk obrolan berikutnya. |
| 10 | **Saran Follow Up** | `Formula` | Tanggal kalkulasi otomatis: `lastContactedDate + followUpCycleDays`. |

---

## 🛠️ Arsitektur & Tumpukan Teknologi

- **Frontend Core:** [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) + [Vite 5](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/) dengan custom tokens:
  - Warna: `primary (#2F54EB)`, `surface (#F8F9FA)`, `success (#10B981)`, `warning (#F59E0B)`, `danger (#EF4444)`
  - Border radius: `card (20px)`, `pill (28px)`
  - Tipografi: Inter & Plus Jakarta Sans
- **Penyimpanan Lokal:** [Dexie.js 4](https://dexie.org/) (IndexedDB wrapper)
- **Ikonografi:** [Lucide React](https://lucide.dev/)
- **Mesin AI:** Google Gemini 1.5 Flash (`generativelanguage.googleapis.com`)
- **Pengujian:** [Vitest](https://vitest.dev/) + [@testing-library/react](https://testing-library.com/) (17 test suites, 139 passing unit/integration tests)

---

## 🚀 Panduan Memulai Cepat (Development)

### 1. Prasyarat
- [Node.js](https://nodejs.org/) v18.0.0 atau lebih baru
- `npm` v9.0.0 atau lebih baru

### 2. Instalasi Dependencies
```bash
npm install
```

### 3. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

### 4. Menjalankan Seluruh Unit & Integration Test
```bash
npm test
# atau untuk mode watch interaktif:
npm run test:watch
```

### 5. Menjalankan Build Produksi Web
```bash
npm run build
```
File bundle web teroptimasi akan dihasilkan di dalam direktori `dist/`.

---

## 📱 Panduan Build APK Android dengan Capacitor

GrowSphere dapat dibundel menjadi aplikasi Android murni (APK) menggunakan Capacitor:

### 1. Instalasi Library Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Inisialisasi Konfigurasi Capacitor
```bash
npx cap init "GrowSphere" "com.growsphere.crm" --web-dir "dist"
```

### 3. Build Aset Web Terlebih Dahulu
```bash
npm run build
```

### 4. Tambahkan Platform Android
```bash
npx cap add android
```

### 5. Sinkronisasi Bundle Web ke Proyek Android
```bash
npx cap sync android
```

### 6. Kompilasi APK Debug Menggunakan Gradle
```bash
cd android
./gradlew assembleDebug
```

> **Lokasi File APK Hasil Build:**  
> `android/app/build/outputs/apk/debug/app-debug.apk`

Anda dapat langsung memasang (*sideload*) file APK tersebut ke ponsel Android Anda via USB debugging (`adb install android/app/build/outputs/apk/debug/app-debug.apk`) atau mentransfernya via WhatsApp/Telegram.

---

## 🔑 Konfigurasi Google Gemini AI API Key

Aplikasi dapat langsung digunakan **tanpa API Key** dengan memanfaatkan draf cerdas berbasis template etika santun bawaan.

Untuk mengaktifkan model generative AI Google Gemini 1.5 Flash:
1. Kunjungi [Google AI Studio](https://aistudio.google.com/) dan buat API Key baru secara gratis.
2. Buka tab **Pengaturan** di aplikasi GrowSphere.
3. Masukkan kunci Anda (berawalan `AIzaSy...`) pada kolom **Google Gemini AI API Key**, lalu klik **Simpan Kunci**.
4. Kunci tersimpan secara lokal dan aman di `localStorage` peramban Anda.

---

## 🔒 Kebijakan Privasi & Keamanan Data

- **Zero Cloud Leak:** Tidak ada database cloud yang menyimpan daftar kontak Anda. Semua operasi CRUD dieksekusi secara lokal di mesin SQLite/IndexedDB browser Anda.
- **Transparansi WhatsApp Direct Link:** GrowSphere tidak membaca atau menyadap chat WhatsApp Anda. Pengiriman pesan dilakukan dengan membuka aplikasi WhatsApp resmi menggunakan skema URL standar `wa.me`.

---

## 📄 Lisensi

Dibuat dengan ❤️ untuk kemaslahatan ukhuwah dan silaturahmi. Bebas digunakan untuk keperluan personal maupun organisasi dakwah/sosial.
