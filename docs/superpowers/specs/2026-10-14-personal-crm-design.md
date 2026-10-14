# Personal Relationship CRM — Design Document

## 1. Intent & The Why

Pengguna saat ini mengelola hubungan personal dan profesionalnya (*silaturahmi, rekan, mentor, keluarga, relasi bisnis*) menggunakan Notion. Namun, proses di Notion memiliki friksi yang cukup besar:
1. **Input manual lambat:** Harus mengetik ulang nama dan nomor telepon satu per satu dari buku kontak handphone.
2. **Tidak ada notifikasi aktif:** Pengguna harus sengaja membuka Notion untuk melihat siapa yang harus disapa, sehingga seringkali tanggal follow-up terlewat.
3. **Ketiadaan aksi langsung:** Harus menyalin nomor dari Notion lalu membukanya di WhatsApp secara manual.

Aplikasi ini bertujuan menjadi **Personal Relationship CRM** yang modern, rapi, dan cerdas. Aplikasi ini memudahkan pemilihan kontak langsung dari handphone, mengotomatisasi pengingat follow-up, serta menyediakan tombol aksi cepat satu-klik untuk menyapa via WhatsApp dengan draf pesan yang relevan dan santun berbantuan AI.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Multi-Select Contact Import dari Handphone:** Pengguna dapat membuka buku kontak HP, memilih/mencentang kontak yang ingin dipantau, dan langsung mengimpornya ke sistem (tanpa perlu pipeline migrasi Notion lama).
- **Skema Data Kaya Konteks (Mengadopsi Struktur Notion Pengguna):**
  - `Nama` & `Nomor Telepon` (otomatis dari buku kontak HP)
  - `Asosiasi` (Tag kategori: *Keluarga, Ihvan, Zahiri, Hoca, Teman, dll.*)
  - `Kontak Profesional` (Boolean / Filter tab)
  - `Ketemu di mana & bagaimana` (Latar belakang / cerita awal kenal)
  - `Pembaruan Terakhir` (Kabar atau cerita terakhir)
  - `Possible Follow Up` (Bahan/topik yang akan diobrolkan di follow-up berikutnya)
  - `Terakhir Dihubungi` (Tanggal log terakhir komunikasi)
  - `Saran Follow Up` (Siklus default berkala 15 hari sejak terakhir dihubungi, bisa dikustomisasi)
  - `Next Follow Up` (Tanggal target spesifik dengan alarm)
  - `Status` (Otomatis: "👍 Aman" vs "⏰ Time to reach out!")
- **AI-Powered WhatsApp Draft Generator (Gemini):**
  - Menghasilkan draf pesan pembuka yang hangat dan kontekstual berdasarkan `Possible Follow Up` serta tag `Asosiasi` (misalnya: panggilan takzim dan santun untuk *Hoca*, hangat/santai untuk *Ihvan/Teman*, formal untuk *Kontak Profesional*).
  - Satu klik langsung meluncurkan aplikasi WhatsApp / WhatsApp Web.
- **Tombol "Tandai Selesai Ngobrol" (Log Chat):** 1-klik instan me-reset hitungan mundur ke 15 hari ke depan dan memperbarui tanggal kontak terakhir ke hari ini, disertai toast non-intrusif opsional untuk mencatat hasil obrolan.
- **Sistem Notifikasi Dual-Mode:**
  - *Daily Morning Digest (Rangkuman Pagi):* Notifikasi jam 08:00 pagi di Android dan email berisi daftar kontak yang jatuh tempo hari ini.
  - *Targeted Specific Alarm:* Notifikasi tepat di tanggal dan jam khusus untuk kontak yang memiliki jadwal di `Next Follow Up`.
- **Desain UI/UX Mengadopsi Penuh Referensi Pinterest (GrowSphere Mobile CRM Kit):**
  - Warna Utama: Electric Royal Blue (`#2F54EB`) dengan background bersih dan hairline border 1px.
  - Dual Metric Cards di atas dashboard (Perlu Disapa vs Health Score).
  - Circular Quick Actions (*Impor HP, Sapa WA, Jadwal, Log Chat*).
  - Horizontal Filter Pills (*Semua, Ihvan, Hoca, Profesional*).
  - Detail Profil Relasi dengan 3-Metric Strip (*Status, Siklus, Terakhir*) dan kotak draf AI.
  - Pill Action Buttons melengkung penuh (*border-radius: 28px*).
  - Bottom Navigation Bar 4 tab (*Home, Relasi, Kalender, Profil*).
- **Akses Lintas Perangkat (Android + PC):** Aplikasi Android native yang tersinkronisasi secara realtime ke Web Dashboard di PC melalui cloud backend.

### Non-Goals
- Bukan CRM Sales B2B komersial (tidak ada pipeline deals revenue, funnel closing).
- Bukan alat spam / blast pesan otomatis ke banyak nomor.
- Tidak membutuhkan migrasi database dari Notion (memulai langsung dari impor kontak HP).

### Anti-Goals
- Hindari formulir pengisian yang kaku dan birokratis.
- Hindari notifikasi spam yang mengganggu sepanjang hari.

---

## 3. Detailed UI/UX Design Specifications (Based on GrowSphere Kit)

### 3.1. Visual Identity & Tokens
- **Primary Brand Color:** Electric Royal Blue (`#2F54EB` / `#1D4ED8`).
- **Surface & Backgrounds:** Pure White (`#FFFFFF`) dengan surface card abu-abu lembut (`#F8F9FA` / `#F3F4F6`).
- **Border & Stroke:** Hairline outline 1px (`#E5E7EB` / `#F0F2F5`).
- **Corner Radii:** Cards: 16–20px; Buttons & Pills: 28px (full pill); Modals/Sheets: 24–32px.
- **Dynamic Avatars:** 2-letter initials dengan soft multi-color gradients per kontak.

### 3.2. Mobile Screens & Flow
1. **Screen 1 — Home / Dashboard:**
   - App Bar: Greeting ("Selamat Pagi"), profile avatar, notification bell.
   - Dual Metrics Cards: Blok biru solid ("Perlu Disapa: 4 orang") berdampingan dengan blok putih ("Health Score: 92%").
   - Circular Quick Actions: 4 ikon bulat bertombol cepat (Impor HP, Sapa WA, Jadwal, Log Chat).
   - Horizontal Filter Pills: Tab kategori (*Semua, Ihvan, Hoca, Profesional*).
   - Contact List: Kartu relasi dengan avatar inisial, status jatuh tempo, dan tombol chat WhatsApp cepat.
   - Bottom Nav Bar: *Home, Relasi, Kalender, Profil*.
2. **Screen 2 — Contact Detail & Sapa WA:**
   - Profile Hero: Foto/avatar besar terpusat, nama lengkap, dan tags kategori.
   - 3-Metric Strip: Kotak 3 metrik sejajar horizontal (*Status, Siklus 15 Hari, Terakhir Kontak*).
   - Context Cards: Kartu rapi menampilkan *Ketemu di mana* dan *Pembaruan Terakhir*.
   - AI Draft Card: Kotak aksen biru muda dengan draf pembuka ramah buatan Gemini.
   - Sticky Actions: Tombol kapsul hijau lebar "Buka di WhatsApp Sekarang" dan tombol "Tandai Selesai Ngobrol".
3. **Screen 3 — Contact Picker Modal:**
   - Multi-select native contact picker membaca daftar buku telepon handphone, memfilter nama & nomor telepon untuk diimpor.
4. **Screen 4 — Kalender & Rencana Follow-Up:**
   - Kalender bulanan dan daftar kontak yang jatuh tempo per tanggal.

---

## 4. Data Schema & Architecture

### Entities

#### `Contact`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Owner)
- `name`: String
- `phone_number`: String (Format internasional E.164)
- `associations`: Array of Strings (Tags: `Keluarga`, `Ihvan`, `Zahiri`, `Hoca`, `Teman`, dsb.)
- `is_professional`: Boolean (Default: false)
- `met_context`: Text (Ketemu di mana dan bagaimana)
- `last_update_notes`: Text (Pembaruan kabar terakhir)
- `possible_follow_up_topic`: Text (Bahan topik obrolan berikutnya)
- `last_contacted_date`: Date (Tanggal terakhir dihubungi)
- `follow_up_cycle_days`: Integer (Default: 15 hari)
- `next_specific_follow_up`: DateTime (Nullable, jadwal pengingat spesifik)
- `created_at` / `updated_at`: Timestamp

#### `InteractionLog`
- `id`: UUID
- `contact_id`: UUID (Foreign Key ke `Contact`)
- `date`: DateTime
- `notes`: Text (Opsional catatan hasil obrolan)
- `type`: Enum (`whatsapp`, `call`, `meetup`, `other`)

### Formula Status
- `calculated_suggested_date` = `last_contacted_date + follow_up_cycle_days`
- `is_overdue` = (Hari Ini >= `next_specific_follow_up` JIKA ada) ATAU (Hari Ini >= `calculated_suggested_date`)
- `status` = JIKA `is_overdue` THEN `"Time to reach out!"` ELSE `"Aman (👍)"`

---

## 5. Notification & Background Service Specification

1. **Daily Morning Digest:**
   - Cron runner terjadwal setiap hari pukul 08:00 pagi.
   - Memeriksa daftar kontak dengan `is_overdue = true` atau `next_specific_follow_up = hari_ini`.
   - Mengirim notifikasi push ke Android dan email ringkasan.
2. **Targeted Alarm Notification:**
   - Menjadwalkan pengingat push spesifik tepat pada hari dan jam `next_specific_follow_up`.

---

## 6. Technical Stack & Implementation Architecture

- **Mobile Client:** Flutter (Dart) — mendukung integrasi Contact Picker native, Push Notifications (Firebase/OneSignal), dan kemudahan kompilasi ke Android APK & Web.
- **Web Dashboard:** Flutter Web atau Next.js React Web — dashboard PC responsif dengan tampilan meja lebar dan keyboard shortcut.
- **Backend & Cloud Database:** Supabase (PostgreSQL) — Realtime sync, Auth, Edge Functions untuk cron notifikasi & integrasi email Resend.
- **AI Engine:** Google Gemini API untuk pembuatan draf pesan WhatsApp yang santun dan adaptif.
