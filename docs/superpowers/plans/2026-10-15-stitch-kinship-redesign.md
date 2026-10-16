# Kinship UI/UX Redesign & Native Android Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Personal Relationship CRM to the 5 Stitch AI "Kinship" screens (Radar Dashboard, Contact Dossier, Phonebook Sync, Scheduled Catch-ups, and Interaction Log Encounter), harden native Android contacts access (`READ_CONTACTS`), native local notifications (`POST_NOTIFICATIONS`, 08:00 WIB daily digest & targeted alarms), and dual WhatsApp intent dispatching (`com.whatsapp` & `com.whatsapp.w4b`).

**Architecture:** React 18 + TypeScript + Tailwind CSS with Kinship design tokens (Warm Editorial Modernism), local-first Dexie.js IndexedDB, Capacitor 8 native platform plugins (`@capacitor-community/contacts`, `@capacitor/local-notifications`), and dual WhatsApp deep-linking with fallback.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Dexie, Capacitor 8, Android 16 / Gradle 8.11, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-15-stitch-kinship-redesign.md`](file:///Users/sp/Documents/Antigravitty/docs/superpowers/specs/2026-10-15-stitch-kinship-redesign.md)

## Global Constraints

- Primary Background & Surfaces: `#F8F9FF` / `#F8F9FA` (Soft warm slate), `#FFFFFF` (Card surfaces), `#EFF4FF` (Tinted containers).
- Accent Colors: `#10B981` / Emerald (Strong cadence / On track), `#F43F5E` / Coral Rose (Overdue / Attention), `#F59E0B` / Amber (Approaching check-in), `#25D366` / WhatsApp Green.
- Typography: Headings Plus Jakarta Sans (bold / 700), Body Inter (400 / 500 / 600).
- Corner Radii: Cards 16–24px, Pills/Badges/Buttons 9999px (full pill).
- Cadence Default: 15 days from `lastContactedDate`.
- Phone Number Normalization: E.164 (+62..., +90...).
- Dual WhatsApp Package Targets: Regular WhatsApp (`com.whatsapp`) and WhatsApp Business (`com.whatsapp.w4b`), fallback `https://wa.me/...`.
- Android Native Permissions: `READ_CONTACTS`, `WRITE_CONTACTS`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`.
- Notion 10-Column Data Integrity: All 10 Notion columns preserved in Dexie schema and viewable in the Notion Table secondary view.
- 100% Zero-Regression Floor: All existing 163 tests across 18 test files must remain passing at all times.

## Review Focus

1. **Android Permission Denied Graceful Handling**: When a user denies `READ_CONTACTS` or `POST_NOTIFICATIONS`, the app must display a polite fallback banner and allow manual contact entry without crashing.
2. **Dual WhatsApp Fallback on Devices Without Both Apps**: When tapping "Kirim via WhatsApp Business" on a device that only has regular WhatsApp (or vice versa), the app must gracefully fall back to web/direct WhatsApp (`https://wa.me/...`) instead of crashing the webview with an unhandled intent scheme error.
3. **UTC vs Local Timezone Shifts in Follow-Up Alarms**: Dates stored as `YYYY-MM-DD` must not shift backward to the previous calendar day when converted to local timezone alarms at 08:00 WIB.
4. **Phonebook Batch Import Deduplication**: Importing 50+ contacts from the phonebook must match existing contacts by normalized E.164 phone number, updating their name/associations without wiping existing interaction logs or customized follow-up notes.
5. **Notion 10-Column Properties Inline-Edit Synchronization**: Live editing `possibleFollowUpTopic`, `lastUpdateNotes`, or `nextSpecificFollowUp` in the Kinship Dossier must immediately update Dexie IndexedDB and reflect on the Radar dashboard without page refresh.

---

### Task 1: Capacitor Native Plugins & AndroidManifest Permissions

**Files:**
- Modify: `package.json`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Test: `tests/sanity.test.ts`

**Interfaces:**
- Consumes: Capacitor 8 core framework.
- Produces: `@capacitor-community/contacts@^8.0.0` and `@capacitor/local-notifications@^8.0.0` installed in `node_modules`, permissions declared in `AndroidManifest.xml`.

- [ ] **Step 1: Write test verifying native plugin registration and manifest permissions**

```typescript
// tests/services/pluginRegistration.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Capacitor Plugins & Android Manifest Declarations', () => {
  it('has contacts and local-notifications declared in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
    expect(pkg.dependencies['@capacitor-community/contacts']).toBeDefined();
    expect(pkg.dependencies['@capacitor/local-notifications']).toBeDefined();
  });

  it('declares READ_CONTACTS and POST_NOTIFICATIONS in AndroidManifest.xml', () => {
    const manifest = fs.readFileSync(path.resolve(__dirname, '../../android/app/src/main/AndroidManifest.xml'), 'utf8');
    expect(manifest).toContain('android.permission.READ_CONTACTS');
    expect(manifest).toContain('android.permission.POST_NOTIFICATIONS');
    expect(manifest).toContain('android.permission.SCHEDULE_EXACT_ALARM');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/pluginRegistration.test.ts`
Expected: FAIL (plugins not in package.json, permissions not in manifest).

- [ ] **Step 3: Install plugins and add permissions to AndroidManifest.xml**

1. Run `npm install @capacitor-community/contacts@^8.0.0 @capacitor/local-notifications@^8.0.0`.
2. Add the required `<uses-permission>` tags into `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.READ_CONTACTS" />
   <uses-permission android:name="android.permission.WRITE_CONTACTS" />
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
   <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
   <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
   <uses-permission android:name="android.permission.VIBRATE" />
   ```
3. Run `npx cap sync android` to sync plugins to the native Android Gradle project.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/pluginRegistration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json android/app/src/main/AndroidManifest.xml tests/services/pluginRegistration.test.ts
git commit -m "chore: install capacitor contacts and local-notifications plugins with android permissions"
```

---

### Task 2: Dual WhatsApp Intent URL Builder & Unit Tests

**Files:**
- Modify: `src/utils/whatsapp.ts`
- Modify: `tests/utils/whatsapp.test.ts`

**Interfaces:**
- Consumes: `normalizePhoneNumber(phone)` from `src/utils/phone.ts`.
- Produces: `buildDualWhatsAppUrl(phone: string, text?: string, appType?: 'regular' | 'business')` returning `{ url: string; fallbackUrl: string; appType: 'regular' | 'business' }` and `openWhatsApp(phone: string, text?: string, appType?: 'regular' | 'business')`.

- [ ] **Step 1: Write failing tests for dual WhatsApp intent generation**

```typescript
// tests/utils/whatsapp.test.ts addition
describe('buildDualWhatsAppUrl', () => {
  it('generates regular WhatsApp intent URL on Android with com.whatsapp package', () => {
    const result = buildDualWhatsAppUrl('+628123456789', 'Halo!', 'regular', true);
    expect(result.url).toContain('package=com.whatsapp');
    expect(result.url).toContain('phone=628123456789');
    expect(result.fallbackUrl).toBe('https://wa.me/628123456789?text=Halo%21');
  });

  it('generates WhatsApp Business intent URL on Android with com.whatsapp.w4b package', () => {
    const result = buildDualWhatsAppUrl('+628123456789', 'Halo!', 'business', true);
    expect(result.url).toContain('package=com.whatsapp.w4b');
    expect(result.fallbackUrl).toBe('https://wa.me/628123456789?text=Halo%21');
  });

  it('generates standard wa.me URL for desktop/web platform', () => {
    const result = buildDualWhatsAppUrl('+628123456789', 'Halo!', 'regular', false);
    expect(result.url).toBe('https://wa.me/628123456789?text=Halo%21');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/utils/whatsapp.test.ts`
Expected: FAIL (`buildDualWhatsAppUrl` is not exported).

- [ ] **Step 3: Implement `buildDualWhatsAppUrl` and `openWhatsApp` in `src/utils/whatsapp.ts`**

Implement helper detecting Android platform (`Capacitor.getPlatform() === 'android'`) and constructing the proper `intent://` URI or `https://wa.me/` URI, with safe window/Capacitor opening.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/whatsapp.test.ts`
Expected: PASS across all WhatsApp utility tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/whatsapp.ts tests/utils/whatsapp.test.ts
git commit -m "feat: implement dual whatsapp url builder for regular and business accounts"
```

---

### Task 3: Hardened Native Contacts Adapter with Android Runtime Permission Prompt

**Files:**
- Modify: `src/services/nativeContactsAdapter.ts`
- Modify: `tests/services/nativeContactsAdapter.test.ts`

**Interfaces:**
- Consumes: `@capacitor-community/contacts` (`Contacts.checkPermissions()`, `Contacts.requestPermissions()`, `Contacts.getContacts()`).
- Produces: `getDeviceContactsWithStatus(): Promise<{ contacts: RawPhoneContact[]; permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' }>`.

- [ ] **Step 1: Write failing tests for permission checks and native contacts parsing**

```typescript
// tests/services/nativeContactsAdapter.test.ts additions
it('returns permissionStatus: granted and mapped contacts when Contacts plugin grants permission', async () => {
  // Mock Contacts plugin
  const result = await getDeviceContactsWithStatus();
  expect(result.permissionStatus).toBe('granted');
  expect(Array.isArray(result.contacts)).toBe(true);
});

it('returns permissionStatus: denied gracefully when user rejects contacts permission', async () => {
  // Mock Contacts plugin rejection
  const result = await getDeviceContactsWithStatus();
  expect(result.permissionStatus).toBe('denied');
  expect(result.contacts).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/services/nativeContactsAdapter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement runtime permission request and native contact retrieval in `src/services/nativeContactsAdapter.ts`**

1. Import `Contacts` from `@capacitor-community/contacts`.
2. Check `Capacitor.isNativePlatform()`. If true, check `Contacts.checkPermissions()`. If not granted, call `Contacts.requestPermissions()`.
3. If granted, call `Contacts.getContacts({ projection: { name: true, phones: true } })` and map phone numbers through `filterValidContacts`.
4. If permission denied, return `{ contacts: [], permissionStatus: 'denied' }`.
5. If running on Web/Desktop, fall back to Web Contacts API or `mockSampleDeviceContacts` with `permissionStatus: 'unsupported'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/nativeContactsAdapter.test.ts`
Expected: PASS across all 12+ contact adapter tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/nativeContactsAdapter.ts tests/services/nativeContactsAdapter.test.ts
git commit -m "feat: implement runtime contacts permission request and native device contacts reading"
```

---

### Task 4: Native Local Notification Service with 08:00 WIB Daily Digest & Targeted Alarms Scheduler

**Files:**
- Modify: `src/services/notificationService.ts`
- Modify: `tests/services/notificationService.test.ts`

**Interfaces:**
- Consumes: `@capacitor/local-notifications` (`LocalNotifications.requestPermissions()`, `LocalNotifications.schedule()`, `LocalNotifications.cancel()`).
- Produces: `initNotificationService()`, `requestNotificationPermission()`, `scheduleDailyMorningDigest(contacts: Contact[])`, `scheduleTargetedFollowUpAlarm(contact: Contact)`.

- [ ] **Step 1: Write failing tests for local notification scheduling and daily digest**

```typescript
// tests/services/notificationService.test.ts additions
it('schedules 08:00 WIB daily morning digest with overdue contacts count', async () => {
  const contacts: Contact[] = [/* sample overdue contacts */];
  const scheduledCount = await scheduleDailyMorningDigest(contacts);
  expect(scheduledCount).toBeGreaterThan(0);
});

it('schedules targeted exact alarm on contact nextSpecificFollowUp date', async () => {
  const contact: Contact = {
    id: 'test-1',
    name: 'Ahmad Faiz',
    phoneNumber: '+628123456789',
    associations: ['Ihvan'],
    isProfessional: false,
    lastContactedDate: '2026-09-01',
    followUpCycleDays: 15,
    nextSpecificFollowUp: '2026-10-20T08:00:00.000Z',
    metContext: '',
    lastUpdateNotes: '',
    possibleFollowUpTopic: 'Diskusi proyek',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  };
  const success = await scheduleTargetedFollowUpAlarm(contact);
  expect(success).toBe(true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/services/notificationService.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement native local notification scheduler in `src/services/notificationService.ts`**

1. Import `LocalNotifications` from `@capacitor/local-notifications`.
2. Create notification channels: `'crm_morning_digest'` and `'crm_targeted_alarms'`.
3. Schedule repeating notification at 08:00 AM local time with title "Kinship: Waktunya Sapa Relasi" and summary of overdue contacts.
4. Schedule individual notification for contacts with `nextSpecificFollowUp`.
5. Provide web fallback (browser Notification API or console log) for desktop browser mode.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/notificationService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/notificationService.ts tests/services/notificationService.test.ts
git commit -m "feat: implement native local notifications with 08:00 daily digest and targeted alarms"
```

---

### Task 5: Kinship Design Tokens & Reusable UI Components

**Files:**
- Create: `src/components/kinship/KinshipPulseArc.tsx`
- Create: `src/components/kinship/CadenceBadge.tsx`
- Create: `src/components/kinship/DualWhatsAppButton.tsx`
- Test: `tests/components/KinshipComponents.test.tsx`

**Interfaces:**
- Consumes: Tailwind classes and Lucide icons.
- Produces:
  - `<KinshipPulseArc score={number} activeCount={number} dueCount={number} pausedCount={number} />`
  - `<CadenceBadge cadenceDays={number} isOverdue={boolean} daysLeftOrOverdue={number} />`
  - `<DualWhatsAppButton phoneNumber={string} draftText?: string; onChatLogged?: () => void; />`

- [ ] **Step 1: Write failing tests for Kinship UI components**

```typescript
// tests/components/KinshipComponents.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { KinshipPulseArc } from '../../src/components/kinship/KinshipPulseArc';
import { CadenceBadge } from '../../src/components/kinship/CadenceBadge';
import { DualWhatsAppButton } from '../../src/components/kinship/DualWhatsAppButton';

describe('Kinship UI Components', () => {
  it('renders KinshipPulseArc with score percentage and stat pills', () => {
    render(<KinshipPulseArc score={92} activeCount={42} dueCount={3} pausedCount={2} />);
    expect(screen.getByText('92%')).toBeDefined();
    expect(screen.getByText('Kinship Pulse')).toBeDefined();
    expect(screen.getByText('3 Due')).toBeDefined();
  });

  it('renders CadenceBadge with on track or reach out indicator', () => {
    render(<CadenceBadge cadenceDays={15} isOverdue={true} daysLeftOrOverdue={3} />);
    expect(screen.getByText(/Perlu Disapa/i)).toBeDefined();
  });

  it('renders DualWhatsAppButton with two separate buttons', () => {
    render(<DualWhatsAppButton phoneNumber="+628123456789" draftText="Halo!" />);
    expect(screen.getByText(/Kirim via WhatsApp$/i)).toBeDefined();
    expect(screen.getByText(/Kirim via WhatsApp Business/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/KinshipComponents.test.tsx`
Expected: FAIL (modules do not exist).

- [ ] **Step 3: Implement `KinshipPulseArc.tsx`, `CadenceBadge.tsx`, and `DualWhatsAppButton.tsx`**

1. `KinshipPulseArc`: SVG circular progress arc with emerald `#10B981` stroke, center score percentage, label "Kinship Pulse", and 3 status pills (`Active`, `Due`, `Paused`).
2. `CadenceBadge`: Small capsule pill with 6px status dot (emerald for on-track, coral for overdue, amber for approaching).
3. `DualWhatsAppButton`: Two distinct action buttons:
   - Button 1: `[💬 Kirim via WhatsApp]` (`bg-[#25D366] text-white`)
   - Button 2: `[💼 Kirim via WhatsApp Business]` (`bg-slate-900 text-white`)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/KinshipComponents.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/kinship/ tests/components/KinshipComponents.test.tsx
git commit -m "feat: implement kinship pulse arc, cadence badge, and dual whatsapp buttons"
```

---

### Task 6: Kinship Dashboard Screen (`KinshipDashboardView`)

**Files:**
- Create: `src/components/kinship/KinshipDashboardView.tsx`
- Test: `tests/components/KinshipDashboardView.test.tsx`

**Interfaces:**
- Consumes: `Contact[]`, `KinshipPulseArc`, `CadenceBadge`, `calculateContactStatus()`.
- Produces: `<KinshipDashboardView contacts={contacts} onSelectContact={fn} onOpenSync={fn} onOpenAiDraft={fn} onLogChat={fn} />` matching Stitch Screen 1 `dashboard_follow_up_radar`.

- [ ] **Step 1: Write failing tests for KinshipDashboardView**

```typescript
// tests/components/KinshipDashboardView.test.tsx
describe('KinshipDashboardView', () => {
  it('renders Kinship Pulse card and Needs Attention Today card stack', () => {
    // verify pulse arc, due contacts, and cadence radar filters
  });

  it('filters contacts when tapping Cadence Radar tabs (All, Weekly, Bi-weekly, Monthly)', () => {
    // verify segmented filter
  });

  it('triggers onSelectContact when tapping a contact item', () => {
    // verify click callback
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/KinshipDashboardView.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `KinshipDashboardView.tsx` matching Stitch design**

1. Top bar: Avatar profile, App title "Kinship", notification bell icon with badge.
2. Kinship Pulse card: Large SVG arc gauge with calculated health score, Active / Due / Paused pills.
3. "Needs Attention Today" urgent card stack: Coral accent indicator, contact name, association tag, days overdue badge, and quick dual WhatsApp button.
4. Cadence Radar: Segmented filter pills (`Semua`, `Mingguan`, `2 Mingguan`, `Bulanan`).
5. Contact feed: Sleek card list with squircle avatar, name, cadence chip, and 1-click log button.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/KinshipDashboardView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/kinship/KinshipDashboardView.tsx tests/components/KinshipDashboardView.test.tsx
git commit -m "feat: implement stitch kinship follow-up radar dashboard view"
```

---

### Task 7: Kinship Contact Dossier Modal & Interaction Log Sheet

**Files:**
- Create: `src/components/kinship/KinshipContactDossierModal.tsx`
- Create: `src/components/kinship/KinshipLogInteractionModal.tsx`
- Test: `tests/components/KinshipContactDossierModal.test.tsx`
- Test: `tests/components/KinshipLogInteractionModal.test.tsx`

**Interfaces:**
- Consumes: `Contact`, `InteractionLog`, Dexie update callbacks.
- Produces: Modal matching Stitch Screen 2 `contact_detail_relationship_dossier` and bottom sheet matching Screen 5 `log_interaction_catatan_ketemu`.

- [ ] **Step 1: Write failing tests for Dossier & Log Encounter sheet**

```typescript
// tests/components/KinshipContactDossierModal.test.tsx
describe('KinshipContactDossierModal', () => {
  it('renders contact dossier hero, Notion properties, and inline editable fields', () => {
    // verify hero, notion fields, chips
  });

  it('renders Dual WhatsApp buttons for sapa', () => {
    // verify dual buttons
  });
});

// tests/components/KinshipLogInteractionModal.test.tsx
describe('KinshipLogInteractionModal', () => {
  it('saves new interaction encounter and resets follow up cadence', () => {
    // verify format select, notes, tags, submit
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/KinshipContactDossierModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `KinshipContactDossierModal.tsx` and `KinshipLogInteractionModal.tsx`**

1. Dossier:
   - Hero: Avatar, star toggle, name, phone, cadence badge, last contacted text.
   - Notion Properties: 10-column properties rendered in clean editorial rows with live inline editing.
   - Quick date schedule chips: `[Besok]`, `[+3 Hari]`, `[+1 Minggu]`, `[+2 Minggu]`, `[Bulan Depan]`, `[Hapus Jadwal]`.
   - Action bar: `[💬 Kirim via WhatsApp]` & `[💼 Kirim via WhatsApp Business]`, plus `[+ Catat Interaksi]` button.
2. Log Encounter:
   - Bottom sheet drawer: Format options (Kopi/Makan, Telepon, WhatsApp, Acara).
   - Date & location inputs.
   - Key talking points (Notion bullet style textarea).
   - Personal insights / facts tags.
   - "Reset siklus follow-up" toggle switch (default: ON).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/KinshipContactDossierModal.test.tsx tests/components/KinshipLogInteractionModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/kinship/KinshipContactDossierModal.tsx src/components/kinship/KinshipLogInteractionModal.tsx tests/components/KinshipContactDossierModal.test.tsx tests/components/KinshipLogInteractionModal.test.tsx
git commit -m "feat: implement kinship contact dossier and log encounter bottom sheet"
```

---

### Task 8: Kinship Phonebook Sync & Import Screen

**Files:**
- Create: `src/components/kinship/KinshipPhonebookSyncView.tsx`
- Test: `tests/components/KinshipPhonebookSyncView.test.tsx`

**Interfaces:**
- Consumes: `getDeviceContactsWithStatus()` from `src/services/nativeContactsAdapter.ts`, `importContacts()` from `src/services/contactService.ts`.
- Produces: View matching Stitch Screen 3 `import_contacts_phonebook_sync`.

- [ ] **Step 1: Write failing tests for KinshipPhonebookSyncView**

```typescript
// tests/components/KinshipPhonebookSyncView.test.tsx
describe('KinshipPhonebookSyncView', () => {
  it('displays native permission prompt button when contacts permission is not yet granted', () => {
    // test permission button
  });

  it('allows multi-selecting contacts and choosing Intentional Care cadence', () => {
    // test multi-select and cadence radios (7, 14, 30 days)
  });

  it('imports selected contacts into Dexie database with applied cadence', () => {
    // test import submit
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/KinshipPhonebookSyncView.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `KinshipPhonebookSyncView.tsx`**

1. Source tabs: "Buku Telepon (HP)", "Google Kontak", "File CSV/VCF".
2. System Permission card: "Izinkan Akses Kontak" button with explanatory note ("Diperlukan untuk sinkronisasi relasi lokal").
3. Search & multi-select contact checklist with select-all pill.
4. Intentional Care cadence radio buttons (Mingguan / 7 hari, 2 Mingguan / 14 hari, Bulanan / 30 hari).
5. "Sinkronkan {N} Kontak" primary pill button (`bg-slate-900 text-white rounded-full py-3.5`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/KinshipPhonebookSyncView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/kinship/KinshipPhonebookSyncView.tsx tests/components/KinshipPhonebookSyncView.test.tsx
git commit -m "feat: implement stitch kinship phonebook sync and cadence import screen"
```

---

### Task 9: Kinship Scheduled Catch-ups & Notifications Screen

**Files:**
- Create: `src/components/kinship/KinshipNotificationsView.tsx`
- Test: `tests/components/KinshipNotificationsView.test.tsx`

**Interfaces:**
- Consumes: `getUpcomingAlarms()`, `getDailyDigestItems()`, `notificationService`.
- Produces: View matching Stitch Screen 4 `notifications_scheduled_catch_ups`.

- [ ] **Step 1: Write failing tests for KinshipNotificationsView**

```typescript
// tests/components/KinshipNotificationsView.test.tsx
describe('KinshipNotificationsView', () => {
  it('renders Today Reminders with AI icebreaker suggestion', () => {
    // test today reminders card
  });

  it('provides snooze buttons (+3 Hari, Akhir Pekan, Minggu Depan)', () => {
    // test snooze
  });

  it('renders dual WhatsApp dispatch buttons', () => {
    // test dual buttons
  });

  it('displays Queue & Dispatch Settings with Daily Morning Digest toggle', () => {
    // test settings
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/KinshipNotificationsView.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `KinshipNotificationsView.tsx`**

1. "Today's Catch-ups" card: Contact card with relationship tag, days overdue badge, and AI Icebreaker suggestion ("Hai [Nama], kemarin sempat dengar cerita tentang...").
2. Snooze bar: Pills for `[+3 Hari]`, `[Akhir Pekan]`, `[Minggu Depan]`.
3. Dual WhatsApp buttons: `[💬 Kirim via WhatsApp]` and `[💼 Kirim via WhatsApp Business]`.
4. "Agenda Minggu Ini": Day-by-day scheduled catch-up list.
5. "Queue & Dispatch Settings": Daily Morning Digest toggle (08:00 WIB), Notification permission status badge.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/KinshipNotificationsView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/kinship/KinshipNotificationsView.tsx tests/components/KinshipNotificationsView.test.tsx
git commit -m "feat: implement stitch kinship scheduled catch-ups and notifications screen"
```

---

### Task 10: App Shell Integration, Full Vitest Verification, Gradle APK Build & Live Android Emulator Run

**Files:**
- Modify: `src/App.tsx`
- Modify: `tests/App.test.tsx`

**Interfaces:**
- Consumes: All Kinship components, Dexie database, notification scheduler, dual WhatsApp service.
- Produces: Unified Kinship CRM application with 4 bottom tabs, Notion table secondary view toggle, full test pass, and built Android APK deployed on `emulator-5554`.

- [ ] **Step 1: Update `src/App.tsx` to integrate Kinship screens & bottom navigation**

1. Replace legacy views with Kinship components:
   - Tab 1: `KinshipDashboardView` (Radar & Pulse)
   - Tab 2: `KinshipContactsView` (Dossier card list + Notion 10-column table toggle)
   - Tab 3: `KinshipNotificationsView` (Scheduled catch-ups & daily digest)
   - Tab 4: `SettingsView` (API key, Sync phonebook button, JSON backup export/restore)
2. Connect `KinshipContactDossierModal`, `KinshipLogInteractionModal`, `AiDraftModal` (with dual WhatsApp buttons), and `KinshipPhonebookSyncView`.
3. Initialize notification service and register 08:00 WIB daily morning digest on app load.

- [ ] **Step 2: Update integration tests in `tests/App.test.tsx`**

Verify navigation between Kinship tabs, modal openers, dual WhatsApp actions, and Notion table toggle.

- [ ] **Step 3: Run full automated test suite**

Run: `npx vitest run`
Expected: 100% PASS across all 25+ test suites with zero failures.

- [ ] **Step 4: Build web bundle & sync to Android**

Run: `npm run build && npx cap sync android`
Expected: Clean build in `dist/` and successful Capacitor sync.

- [ ] **Step 5: Build Android APK with Gradle & deploy to emulator**

Run: `cd android && ./gradlew assembleDebug && cd ..`
Install to emulator: `adb -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk`
Launch app: `adb -s emulator-5554 shell am start -n com.growsphere.crm/.MainActivity`

- [ ] **Step 6: Capture screenshot evidence on emulator**

Capture screens from `emulator-5554`:
1. Kinship Radar Dashboard with Pulse Arc
2. Kinship Contact Dossier with Dual WhatsApp buttons
3. Kinship Phonebook Sync with permission request
4. Kinship Notifications & Catch-ups
Save screenshots to artifact directory.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx tests/App.test.tsx
git commit -m "feat: complete kinship redesign integration and verify on android emulator"
```
