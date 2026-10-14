# Personal Relationship CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi Personal Relationship CRM lintas platform (Android APK & Web Dashboard PC) dengan import kontak handphone multi-select, rumus follow-up Notion, tombol aksi WhatsApp ber-AI (Gemini), notifikasi dual-mode, dan desain visual modern persis referensi Pinterest GrowSphere.

**Architecture:** Frontend dibangun dengan React 18 + TypeScript + Vite + Tailwind CSS yang dibungkus Capacitor untuk integrasi native Android (Contact Picker & Local Notifications) serta dapat dibuka langsung sebagai Web Dashboard di PC. State dan database offline-first menggunakan IndexedDB/Dexie dengan sinkronisasi Supabase cloud, dan Vitest sebagai test runner untuk pengujian TDD.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Vitest, Dexie.js, Google Gemini API, Capacitor (Android).

**Spec:** [`docs/superpowers/specs/2026-10-14-personal-crm-design.md`](file:///Users/sp/Documents/Antigravitty/docs/superpowers/specs/2026-10-14-personal-crm-design.md)

## Global Constraints
- Primary Brand Color: `#2F54EB` (Electric Royal Blue), Surface: `#FFFFFF` / `#F8F9FA`, Border: `#E5E7EB`.
- Corner Radius: Cards: 16–20px, Buttons/Pills: 28px (pill full rounded).
- Formula default cadence: 15 hari dari `last_contacted_date`.
- Status formula: JIKA `is_overdue` THEN `"Time to reach out!"` (merah) ELSE `"Aman (👍)"` (hijau).
- Phone number format: E.164 internasional (`+62...`, `+90...`).
- Tidak memerlukan migrasi data Notion lama; mengimpor langsung dari buku telepon.
- Draf WhatsApp cerdas menggunakan Gemini AI dengan nada sopan-santun sesuai tag Asosiasi (*Hoca, Ihvan, Keluarga, Profesional*).

## Review Focus
1. **Nomor telepon lokal tanpa kode negara** (misal `0812...` atau `053...`) harus otomatis dinormalisasi ke format E.164 internasional agar link WhatsApp `wa.me` berfungsi tanpa error.
2. **Import kontak duplikat** (memilih kontak yang nomor HP-nya sudah pernah diimpor) harus otomatis mendeteksi duplikasi dan memperbarui nama/info tanpa membuat duplikat kartu relasi baru.
3. **Log Chat 1-klik** harus mengupdate `last_contacted_date` ke hari ini, me-reset status menjadi "Aman (👍)", dan menghapus jadwal `next_specific_follow_up` yang sudah lewat tanpa menghilangkan catatan riwayat obrolan terdahulu.
4. **AI WhatsApp generator offline fallback** jika koneksi internet terputus atau API key belum disetel, harus otomatis menghasilkan draf kalimat ramah berbasis template deterministik tanpa gagal / crash.
5. **Kontak tanpa tanggal kontak awal** (baru diimpor) harus langsung disetel status awal siap disapa (atau netral) tanpa memicu error NaN/Invalid Date pada kalkulator status.

---

### Task 1: Project Scaffolding, Design Tokens & Test Harness

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `src/index.css`
- Create: `tests/setup.ts`

**Interfaces:**
- Produces: Lingkungan pengembangan React + TypeScript + Tailwind CSS dengan Vitest runner yang siap pakai.

- [ ] **Step 1: Inisialisasi package.json dan instalasi dependensi**
Inisialisasi dependensi: `react`, `react-dom`, `lucide-react`, `clsx`, `tailwind-merge`, `dexie`. Dev dependensi: `vite`, `typescript`, `@types/react`, `@types/react-dom`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `@testing-library/react`, `jsdom`.

- [ ] **Step 2: Konfigurasi Tailwind dengan Design Tokens GrowSphere**
Konfigurasi `tailwind.config.js` dengan palet warna spesifik: `primary: '#2F54EB'`, `surface: '#F8F9FA'`, `border: '#E5E7EB'`, `success: '#10B981'`, `warning: '#F59E0B'`, `danger: '#EF4444'`.

- [ ] **Step 3: Setup test runner Vitest di vite.config.ts**
Tambahkan konfigurasi `test: { globals: true, environment: 'jsdom', setupFiles: './tests/setup.ts' }`.

- [ ] **Step 4: Jalankan verifikasi test suite kosong**
Run: `npx vitest run`
Expected: PASS (0 tests found atau dummy test passes).

- [ ] **Step 5: Commit**
```bash
git add package.json vite.config.ts tsconfig.json tailwind.config.js src/index.css tests/setup.ts
git commit -m "chore: scaffold project with tailwind design tokens and vitest harness"
```

---

### Task 2: Core Data Types, Status Engine & Phone Normalizer (TDD)

**Files:**
- Create: `src/types/crm.ts`
- Create: `src/utils/phone.ts`
- Create: `src/utils/status.ts`
- Test: `tests/utils/phone.test.ts`
- Test: `tests/utils/status.test.ts`

**Interfaces:**
- Produces: `normalizePhoneNumber(raw: string, defaultCountryCode?: string) -> string`
- Produces: `calculateContactStatus(contact: Contact, now?: Date) -> ContactStatusResult`
- Produces: Type definition untuk `Contact`, `InteractionLog`, `ContactStatusResult`.

- [ ] **Step 1: Tulis failing test untuk normalisasi nomor telepon E.164**
```typescript
// tests/utils/phone.test.ts
import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber } from '../../src/utils/phone';

describe('normalizePhoneNumber', () => {
  it('converts Indonesian local 0812 to +62812', () => {
    expect(normalizePhoneNumber('0812-3456-7890', '62')).toBe('+6281234567890');
  });
  it('preserves existing + country code', () => {
    expect(normalizePhoneNumber('+90 532 123 4567')).toBe('+905321234567');
  });
  it('cleans non-numeric noise', () => {
    expect(normalizePhoneNumber('(0821) 9988-7766')).toBe('+6282199887766');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
Run: `npx vitest run tests/utils/phone.test.ts`
Expected: FAIL (cannot find module `../../src/utils/phone`).

- [ ] **Step 3: Implementasikan phone normalizer dan data types**
Buat `src/types/crm.ts` sesuai spec (Contact, InteractionLog) dan implementasikan `normalizePhoneNumber` di `src/utils/phone.ts`.

- [ ] **Step 4: Tulis failing test untuk kalkulator status Notion (15 hari & Next Follow Up)**
```typescript
// tests/utils/status.test.ts
import { describe, it, expect } from 'vitest';
import { calculateContactStatus } from '../../src/utils/status';
import { Contact } from '../../src/types/crm';

describe('calculateContactStatus', () => {
  const baseContact: Contact = {
    id: '1',
    name: 'Budi Santoso',
    phoneNumber: '+628123456789',
    associations: ['Keluarga'],
    isProfessional: false,
    lastContactedDate: '2026-10-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: null,
    metContext: '',
    lastUpdateNotes: '',
    possibleFollowUpTopic: '',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  it('marks as healthy (Aman) when within 15-day cycle', () => {
    const result = calculateContactStatus(baseContact, new Date('2026-10-10'));
    expect(result.isOverdue).toBe(false);
    expect(result.statusText).toBe('Aman (👍)');
    expect(result.suggestedDate).toBe('2026-10-16');
  });

  it('marks as overdue when past 15-day cycle', () => {
    const result = calculateContactStatus(baseContact, new Date('2026-10-18'));
    expect(result.isOverdue).toBe(true);
    expect(result.statusText).toBe('Time to reach out!');
    expect(result.daysOverdue).toBe(2);
  });

  it('prioritizes specific nextFollowUp date over routine 15 days', () => {
    const contactWithSpecific: Contact = {
      ...baseContact,
      nextSpecificFollowUp: '2026-10-08T09:00:00Z',
    };
    const result = calculateContactStatus(contactWithSpecific, new Date('2026-10-09'));
    expect(result.isOverdue).toBe(true);
  });
});
```

- [ ] **Step 5: Implementasikan calculateContactStatus di src/utils/status.ts dan jalankan test**
Run: `npx vitest run tests/utils/`
Expected: PASS (Semua test status dan normalisasi nomor HP berhasil).

- [ ] **Step 6: Commit**
```bash
git add src/types/crm.ts src/utils/phone.ts src/utils/status.ts tests/utils/
git commit -m "feat: implement data types, phone normalizer, and notion status calculation engine"
```

---

### Task 3: Local Database & Contact Import Deduplication Engine (TDD)

**Files:**
- Create: `src/db/crmDatabase.ts`
- Create: `src/services/contactService.ts`
- Test: `tests/services/contactService.test.ts`

**Interfaces:**
- Consumes: `Contact`, `normalizePhoneNumber`
- Produces: `crmDb: Dexie`
- Produces: `importContacts(rawContacts: RawPhoneContact[]) -> Promise<ImportResult>`
- Produces: `markChatCompleted(contactId: string, notes?: string) -> Promise<Contact>`

- [ ] **Step 1: Tulis failing test untuk import kontak batch dan deduplikasi**
```typescript
// tests/services/contactService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { crmDb } from '../../src/db/crmDatabase';
import { importContacts, markChatCompleted } from '../../src/services/contactService';

describe('ContactService', () => {
  beforeEach(async () => {
    await crmDb.contacts.clear();
    await crmDb.interactions.clear();
  });

  it('imports batch contacts without duplicates', async () => {
    const raw = [
      { name: 'Bu Siti Sarah', phoneNumber: '08123456789' },
      { name: 'Mustafa Mert', phoneNumber: '+905321112233' },
    ];
    const result = await importContacts(raw);
    expect(result.importedCount).toBe(2);

    // Re-importing same phone should update, not create duplicate
    const reImport = await importContacts([{ name: 'Bu Siti Sarah Updated', phoneNumber: '08123456789' }]);
    expect(reImport.importedCount).toBe(0);
    expect(reImport.updatedCount).toBe(1);

    const all = await crmDb.contacts.toArray();
    expect(all.length).toBe(2);
    expect(all.find(c => c.phoneNumber === '+628123456789')?.name).toBe('Bu Siti Sarah Updated');
  });

  it('markChatCompleted updates lastContactedDate to today and resets specific follow up', async () => {
    const [c] = await crmDb.contacts.bulkAdd([
      {
        id: 'c1',
        name: 'Necmiye',
        phoneNumber: '+905329998877',
        associations: ['Keluarga'],
        isProfessional: false,
        lastContactedDate: '2026-09-01',
        followUpCycleDays: 15,
        nextSpecificFollowUp: '2026-09-10T10:00:00Z',
        metContext: '',
        lastUpdateNotes: '',
        possibleFollowUpTopic: 'Kabar keluarga',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      }
    ], { allKeys: true });

    const updated = await markChatCompleted('c1', 'Ngobrol santai lewat WA');
    expect(updated.lastContactedDate).toBe(new Date().toISOString().split('T')[0]);
    expect(updated.nextSpecificFollowUp).toBeNull();

    const logs = await crmDb.interactions.where('contactId').equals('c1').toArray();
    expect(logs.length).toBe(1);
    expect(logs[0].notes).toBe('Ngobrol santai lewat WA');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
Run: `npx vitest run tests/services/contactService.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan crmDatabase.ts dan contactService.ts**
Konfigurasikan Dexie store untuk `contacts` dan `interactions`. Implementasikan `importContacts` dan `markChatCompleted`.

- [ ] **Step 4: Jalankan test untuk memverifikasi keberhasilan**
Run: `npx vitest run tests/services/contactService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/db/crmDatabase.ts src/services/contactService.ts tests/services/contactService.test.ts
git commit -m "feat: implement indexeddb storage, contact import deduplication, and chat logging"
```

---

### Task 4: AI WhatsApp Draft Generator & Deep Link Engine (TDD)

**Files:**
- Create: `src/services/aiDraftService.ts`
- Create: `src/utils/whatsapp.ts`
- Test: `tests/services/aiDraftService.test.ts`
- Test: `tests/utils/whatsapp.test.ts`

**Interfaces:**
- Consumes: `Contact`
- Produces: `generateWhatsAppDraft(contact: Contact, apiKey?: string) -> Promise<string>`
- Produces: `buildWhatsAppUrl(phoneNumber: string, message: string) -> string`

- [ ] **Step 1: Tulis failing test untuk WhatsApp URL builder dan template fallback**
```typescript
// tests/utils/whatsapp.test.ts
import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl } from '../../src/utils/whatsapp';

describe('buildWhatsAppUrl', () => {
  it('generates correct wa.me link with URL-encoded text', () => {
    const url = buildWhatsAppUrl('+628123456789', 'Halo Bu Siti, apa kabar?');
    expect(url).toBe('https://wa.me/628123456789?text=Halo%20Bu%20Siti%2C%20apa%20kabar%3F');
  });
});
```

- [ ] **Step 2: Tulis failing test untuk AI draft generator dengan fallback kesopanan kategori**
```typescript
// tests/services/aiDraftService.test.ts
import { describe, it, expect } from 'vitest';
import { generateDeterministicFallbackDraft } from '../../src/services/aiDraftService';
import { Contact } from '../../src/types/crm';

describe('aiDraftService fallback', () => {
  it('uses polite honorifics for Hoca category', () => {
    const contact: Contact = {
      id: 'h1',
      name: 'Yılmaz Kileci Abi',
      phoneNumber: '+90532000000',
      associations: ['Hoca'],
      isProfessional: true,
      lastContactedDate: '2026-09-20',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: '',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Kabar dan silaturahmi',
      createdAt: '',
      updatedAt: '',
    };
    const draft = generateDeterministicFallbackDraft(contact);
    expect(draft).toContain('Assalamu’alaikum');
    expect(draft).toContain('Yılmaz Kileci Abi');
    expect(draft).toContain('Kabar dan silaturahmi');
  });
});
```

- [ ] **Step 3: Implementasikan whatsapp.ts dan aiDraftService.ts**
Dukung panggilan Gemini API jika API key tersedia, dan fallback otomatis ke generator draf deterministik berbasis aturan kesopanan tags (*Hoca, Ihvan, Keluarga, Profesional*).

- [ ] **Step 4: Jalankan test dan verifikasi kelulusan**
Run: `npx vitest run tests/services/aiDraftService.test.ts tests/utils/whatsapp.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/services/aiDraftService.ts src/utils/whatsapp.ts tests/services/aiDraftService.test.ts tests/utils/whatsapp.test.ts
git commit -m "feat: implement whatsapp deep link builder and ai draft generator with category-aware fallback"
```

---

### Task 5: Notification Calculator & Daily Digest Engine (TDD)

**Files:**
- Create: `src/services/notificationService.ts`
- Test: `tests/services/notificationService.test.ts`

**Interfaces:**
- Consumes: `Contact[]`
- Produces: `getDailyDigestItems(contacts: Contact[], date?: Date) -> DigestResult`
- Produces: `getUpcomingAlarms(contacts: Contact[], withinHours?: number) -> AlarmItem[]`

- [ ] **Step 1: Tulis failing test untuk Daily Morning Digest**
```typescript
// tests/services/notificationService.test.ts
import { describe, it, expect } from 'vitest';
import { getDailyDigestItems } from '../../src/services/notificationService';
import { Contact } from '../../src/types/crm';

describe('notificationService', () => {
  const sampleContacts: Contact[] = [
    {
      id: '1',
      name: 'Bu Siti',
      phoneNumber: '+6281',
      associations: ['Zahiri'],
      isProfessional: true,
      lastContactedDate: '2026-09-20',
      followUpCycleDays: 15,
      nextSpecificFollowUp: null, // Overdue
      metContext: '',
      lastUpdateNotes: '',
      possibleFollowUpTopic: 'Acara keynote',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      name: 'Necmiye',
      phoneNumber: '+905',
      associations: ['Keluarga'],
      isProfessional: false,
      lastContactedDate: '2026-10-10', // Aman
      followUpCycleDays: 15,
      nextSpecificFollowUp: null,
      metContext: '',
      lastUpdateNotes: '',
      possibleFollowUpTopic: '',
      createdAt: '',
      updatedAt: '',
    }
  ];

  it('aggregates overdue contacts for morning digest', () => {
    const digest = getDailyDigestItems(sampleContacts, new Date('2026-10-14'));
    expect(digest.totalOverdue).toBe(1);
    expect(digest.contacts[0].name).toBe('Bu Siti');
    expect(digest.digestSummary).toContain('1 relasi perlu disapa hari ini');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
Run: `npx vitest run tests/services/notificationService.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan notificationService.ts**
Hitung kontak overdue dan kontak dengan `nextSpecificFollowUp` yang jatuh tempo hari ini, format ringkasan notifikasi ramah.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
Run: `npx vitest run tests/services/notificationService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/services/notificationService.ts tests/services/notificationService.test.ts
git commit -m "feat: implement daily morning digest and targeted alarm scheduler calculator"
```

---

### Task 6: GrowSphere Pinterest UI Kit Components

**Files:**
- Create: `src/components/ui/DualMetricsCard.tsx`
- Create: `src/components/ui/CircularQuickAction.tsx`
- Create: `src/components/ui/FilterPill.tsx`
- Create: `src/components/ui/MetricStrip.tsx`
- Create: `src/components/ui/BottomNavBar.tsx`
- Create: `src/components/ui/Toast.tsx`
- Test: `tests/components/DualMetricsCard.test.tsx`

**Interfaces:**
- Produces: Komponen presentasional presisi referensi Pinterest GrowSphere dengan Tailwind CSS.

- [ ] **Step 1: Tulis test untuk DualMetricsCard**
```typescript
// tests/components/DualMetricsCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { DualMetricsCard } from '../../src/components/ui/DualMetricsCard';

describe('DualMetricsCard', () => {
  it('renders overdue count and health score percentage', () => {
    render(<DualMetricsCard overdueCount={4} healthScorePercent={92} activeCount={42} />);
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('92%')).toBeDefined();
    expect(screen.getByText('Perlu Disapa')).toBeDefined();
  });
});
```

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
Run: `npx vitest run tests/components/DualMetricsCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasikan komponen UI GrowSphere**
Buat `DualMetricsCard`, `CircularQuickAction`, `FilterPill`, `MetricStrip` (3 kotak nilai di bawah foto profil), `BottomNavBar`, dan `Toast`.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
Run: `npx vitest run tests/components/`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/ui/ tests/components/
git commit -m "feat: implement growsphere pinterest design system ui components"
```

---

### Task 7: Contact Card, Board View & Notion Table View

**Files:**
- Create: `src/components/crm/ContactCard.tsx`
- Create: `src/components/crm/NotionTableView.tsx`
- Create: `src/components/crm/DashboardView.tsx`
- Test: `tests/components/ContactCard.test.tsx`

**Interfaces:**
- Consumes: `Contact`, `calculateContactStatus`, `buildWhatsAppUrl`
- Produces: Tampilan kartu relasi dengan status badge, tombol aksi cepat WhatsApp, serta toggle Notion Table View.

- [ ] **Step 1: Tulis test untuk ContactCard**
Verifikasi render nama, tag Asosiasi, status badge merah jika overdue, tombol WhatsApp hijau, dan tombol log chat.

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
Run: `npx vitest run tests/components/ContactCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasikan ContactCard, NotionTableView, dan DashboardView**
Dukung pencarian instan (nama/topik/tempat), filter Asosiasi, filter tab (*Semua, Profesional, Perguruan Tinggi*), dan toggle mode tampilan Card vs Notion Table.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
Run: `npx vitest run tests/components/ContactCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/crm/ tests/components/ContactCard.test.tsx
git commit -m "feat: implement contact cards, board view, and notion table view"
```

---

### Task 8: Contact Profile Detail Screen & AI WhatsApp Modal

**Files:**
- Create: `src/components/crm/ContactDetailModal.tsx`
- Create: `src/components/crm/AiDraftModal.tsx`
- Test: `tests/components/AiDraftModal.test.tsx`

**Interfaces:**
- Consumes: `generateWhatsAppDraft`, `markChatCompleted`
- Produces: Screen profil detail ala "John Carter" referensi kit dengan 3-metric strip, preview draf AI, dan tombol kirim WhatsApp.

- [ ] **Step 1: Tulis test untuk AiDraftModal**
Verifikasi modal memanggil draf AI Gemini, menampilkan badge nada bicara (*Santun & Formal*), dan menyediakan tombol luncurkan WhatsApp.

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
Run: `npx vitest run tests/components/AiDraftModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasikan ContactDetailModal dan AiDraftModal**
Tampilkan detail konteks lengkap dari Notion: *Ketemu di mana*, *Pembaruan Terakhir*, *Topik Follow Up*, 3-Metric strip, dan integrasi WhatsApp.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
Run: `npx vitest run tests/components/AiDraftModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/crm/ContactDetailModal.tsx src/components/crm/AiDraftModal.tsx tests/components/AiDraftModal.test.tsx
git commit -m "feat: implement contact detail screen and ai whatsapp draft modal"
```

---

### Task 9: Phone Contact Picker & Add/Edit Contact Modal

**Files:**
- Create: `src/components/crm/ContactImportModal.tsx`
- Create: `src/components/crm/EditContactModal.tsx`
- Create: `src/services/nativeContactsAdapter.ts`
- Test: `tests/services/nativeContactsAdapter.test.ts`

**Interfaces:**
- Consumes: `importContacts`
- Produces: Modal pemilihan kontak multi-select dari buku telepon handphone dengan fallback simulasi web untuk pengujian PC.

- [ ] **Step 1: Tulis test untuk adapter contact picker**
Verifikasi pemfilteran kontak dengan nomor telepon valid dan normalisasi batch.

- [ ] **Step 2: Jalankan test untuk memastikan test gagal**
Run: `npx vitest run tests/services/nativeContactsAdapter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan nativeContactsAdapter dan ContactImportModal**
Gunakan `@capacitor-community/contacts` saat berjalan di Android, dan Web Contact Picker API / file import saat dibuka di browser PC.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
Run: `npx vitest run tests/services/nativeContactsAdapter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/crm/ContactImportModal.tsx src/components/crm/EditContactModal.tsx src/services/nativeContactsAdapter.ts tests/services/nativeContactsAdapter.test.ts
git commit -m "feat: implement native contact picker adapter and multi-select import modal"
```

---

### Task 10: App Shell Assembly, Build Verification & Documentation

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `index.html`
- Create: `README.md`

**Interfaces:**
- Menyatukan seluruh modul menjadi aplikasi lengkap yang responsif untuk Android dan PC Web Dashboard.

- [ ] **Step 1: Rakit App.tsx dengan Navigasi dan Global State**
Hubungkan Dashboard, Profil Detail, Modal Import Kontak, Toast notifikasi, dan Settings.

- [ ] **Step 2: Jalankan seluruh test suite Vitest**
Run: `npx vitest run`
Expected: PASS (Seluruh unit test lulus 100%).

- [ ] **Step 3: Jalankan production build Vite**
Run: `npm run build`
Expected: PASS (Output build di folder `dist/` tanpa error TypeScript).

- [ ] **Step 4: Commit dan dokumentasikan petunjuk instalasi APK & Web**
```bash
git add src/App.tsx src/main.tsx index.html README.md
git commit -m "feat: assemble complete personal crm app and verify production build"
```
