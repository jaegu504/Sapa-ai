# Advanced CRM Features & Inline-Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Personal Relationship CRM into an advanced, proactive relationship copilot featuring instant inline-editing in the contact detail panel (without opening an edit modal), quick-schedule date chips, a sliding navigation drawer with analytics and JSON backup/export, a smart daily copilot recommendation widget, and a built-in mobile emulator frame toggle for realistic device preview.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), Vitest, Vite.

---

### File Structure Map

- **Modify:** `src/components/crm/ContactDetailModal.tsx`
  - Add inline-editable textareas for `possibleFollowUpTopic`, `lastUpdateNotes`, and `metContext`.
  - Add quick-scheduling chips (`[Besok]`, `[+3 Hari]`, `[+1 Minggu]`, `[+2 Minggu]`, `[Hapus Jadwal]`) and direct date picker for `nextSpecificFollowUp`.
  - Add inline date picker for `lastContactedDate` and cadence stepper for `followUpCycleDays`.
  - Add `onUpdateContact: (contactId: string, updates: Partial<Contact>) => Promise<void> | void`.
- **Test:** `tests/components/ContactDetailModal.test.tsx`
  - Test inline editing of follow-up topic, last notes, next follow up date, quick date chips, and update callbacks.

- **Create:** `src/components/crm/NavigationDrawer.tsx`
  - Sliding drawer triggered from top-left menu button.
  - Category breakdown & relationship health analytics.
  - Smart filter shortcuts (Overdue, Minggu Ini, Belum Pernah Disapa).
  - Interaction history timeline.
  - 1-click JSON database backup download and restore.
- **Modify:** `src/components/crm/DashboardView.tsx`
  - Add hamburger menu button in header.
  - Add Smart Daily Copilot Card highlighting priority contacts due today with 1-click WhatsApp buttons.
- **Test:** `tests/components/NavigationDrawer.test.tsx`
- **Test:** `tests/components/DashboardView.test.tsx`

- **Create:** `src/components/ui/DeviceEmulatorFrame.tsx`
  - Realistic smartphone bezel frame (notch/dynamic island, status bar with live time, home indicator bar) allowing users to test mobile ergonomics directly in desktop browser.
- **Modify:** `src/App.tsx`
  - Integrate `NavigationDrawer`, `DeviceEmulatorFrame`, and inline update handler with Dexie IndexedDB.
- **Test:** `tests/App.test.tsx`

---

### Task 1: Detail Panel Direct Inline-Editing & Quick Follow-Up Chips (TDD)

**Files:**
- Modify: `src/components/crm/ContactDetailModal.tsx`
- Modify: `tests/components/ContactDetailModal.test.tsx`

**Interfaces:**
- Props:
  ```typescript
  export interface ContactDetailModalProps {
    contact: Contact | null;
    isOpen: boolean;
    onClose: () => void;
    onEditContact?: (contact: Contact) => void;
    onOpenAiDraft?: (contact: Contact) => void;
    onLogChat?: (contact: Contact) => void;
    onUpdateContact?: (contactId: string, updates: Partial<Contact>) => Promise<void> | void;
    now?: Date;
  }
  ```

- [ ] **Step 1: Tulis test untuk inline editing dan chip tanggal**
  - Test direct editing of `possibleFollowUpTopic` triggers `onUpdateContact`.
  - Test clicking chip `+3 Hari` computes date +3 days and calls `onUpdateContact` with `nextSpecificFollowUp`.
  - Test changing `nextSpecificFollowUp` date input directly updates state.
  - Test editing `lastUpdateNotes` updates contact data.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
  - Run: `npx vitest run tests/components/ContactDetailModal.test.tsx`
  - Expected: FAIL (missing quick chips and update callback).

- [ ] **Step 3: Implementasikan inline editing di ContactDetailModal**
  - Ganti static read-only cards dengan interactive inline editors:
    - Textarea untuk `possibleFollowUpTopic` dengan status auto-save.
    - Textarea untuk `lastUpdateNotes` dengan status auto-save.
    - Date picker & deretan chips cepat: `Besok (+1 hr)`, `+3 Hari`, `+1 Minggu (+7 hr)`, `+2 Minggu (+14 hr)`, `Bulan Depan (+30 hr)`, `Hapus Jadwal`.
    - Input tanggal `lastContactedDate` & stepper `followUpCycleDays`.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  - Run: `npx vitest run tests/components/ContactDetailModal.test.tsx`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - `git add src/components/crm/ContactDetailModal.tsx tests/components/ContactDetailModal.test.tsx`
  - `git commit -m "feat: implement inline editing and quick follow up date chips in contact detail modal"`

---

### Task 2: Advanced Navigation Drawer, Health Analytics & Backup Engine (TDD)

**Files:**
- Create: `src/components/crm/NavigationDrawer.tsx`
- Modify: `src/components/crm/DashboardView.tsx`
- Create: `tests/components/NavigationDrawer.test.tsx`
- Modify: `tests/components/DashboardView.test.tsx`

**Interfaces:**
- `NavigationDrawerProps`:
  ```typescript
  export interface NavigationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    contacts: Contact[];
    interactions: InteractionLog[];
    onSelectFilter?: (filterType: 'all' | 'overdue' | 'week' | 'never_contacted') => void;
    onExportBackup: () => void;
    onImportBackup: (jsonData: string) => Promise<void>;
  }
  ```

- [ ] **Step 1: Tulis test untuk NavigationDrawer**
  - Test category distribution calculation.
  - Test clicking filter shortcuts.
  - Test JSON export trigger.

- [ ] **Step 2: Jalankan test untuk memastikan kegagalan**
  - Run: `npx vitest run tests/components/NavigationDrawer.test.tsx`
  - Expected: FAIL.

- [ ] **Step 3: Implementasikan NavigationDrawer dan perbarui DashboardView**
  - Drawer dengan animasi slide-over dari kiri.
  - Visual relationship health breakdown (% per kategori).
  - Quick status filters.
  - Riwayat log percakapan terakhir.
  - Tombol Export & Import backup JSON.
  - Tambahkan tombol hamburger di header Dashboard dan Smart Copilot Recommendation Card di atas list.

- [ ] **Step 4: Jalankan test untuk memverifikasi kelulusan**
  - Run: `npx vitest run tests/components/NavigationDrawer.test.tsx tests/components/DashboardView.test.tsx`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - `git add src/components/crm/NavigationDrawer.tsx src/components/crm/DashboardView.tsx tests/components/NavigationDrawer.test.tsx tests/components/DashboardView.test.tsx`
  - `git commit -m "feat: implement advanced navigation drawer analytics and smart copilot dashboard"`

---

### Task 3: Mobile Emulator Frame Mode, App Shell Wiring & Build Verification (TDD)

**Files:**
- Create: `src/components/ui/DeviceEmulatorFrame.tsx`
- Modify: `src/App.tsx`
- Modify: `tests/App.test.tsx`

**Interfaces:**
- Produces: Toggle mode "Emulator HP" vs "Desktop Luas" di pojok kanan atas aplikasi, menghubungkan inline update dengan Dexie database, dan verifikasi build.

- [ ] **Step 1: Tulis test integrasi untuk App shell dengan emulator toggle dan inline update**
  - Test opening drawer from top-left button.
  - Test updating contact inline updates database.
  - Test switching between emulator phone frame and responsive desktop view.

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**
  - Run: `npx vitest run tests/App.test.tsx`
  - Expected: FAIL.

- [ ] **Step 3: Implementasikan DeviceEmulatorFrame dan integrasikan di App.tsx**
  - Buat bezel mockup smartphone elegan dengan notch, status bar (waktu live, baterai, sinyal), dan home pill.
  - Hubungkan `onUpdateContact` di `App.tsx` ke `crmDb.contacts.update(id, updates)`.
  - Hubungkan backup JSON export (membuat file `growsphere-backup-YYYY-MM-DD.json` dan trigger download otomatis).

- [ ] **Step 4: Jalankan seluruh test suite Vitest**
  - Run: `npx vitest run`
  - Expected: 100% PASS across all suites.

- [ ] **Step 5: Jalankan production build**
  - Run: `npm run build`
  - Expected: PASS dengan bundle dist/ siap pakai.

- [ ] **Step 6: Commit**
  - `git add src/components/ui/DeviceEmulatorFrame.tsx src/App.tsx tests/App.test.tsx`
  - `git commit -m "feat: implement mobile device emulator frame and wire advanced crm features"`
