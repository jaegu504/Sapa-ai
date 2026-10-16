# Kinship UI/UX Redesign & Native Android Hardening Spec

## 1. Intent & Problem Statement
The user has created a new, refined UI/UX design via Stitch called **"Kinship"** (Warm Editorial Modernism). The previous UI (GrowSphere Pinterest style) needs to be upgraded to match the 5 Stitch screens provided in the design zip archive:
1. `dashboard_follow_up_radar` (Radar & Kinship Pulse)
2. `contact_detail_relationship_dossier` (Contact Dossier & Notion Properties)
3. `import_contacts_phonebook_sync` (Phonebook Sync & Cadence Configuration)
4. `notifications_scheduled_catch_ups` (Today's Reminders & Agenda)
5. `log_interaction_catatan_ketemu` (Interaction Log & Encounter Sheet)

In addition, two critical native Android platform capabilities must be fixed and hardened:
1. **Phone Contacts Sync & Permission**: The app previously lacked `READ_CONTACTS` in `AndroidManifest.xml` and had no native Capacitor contact plugin with runtime permission handling. When running on Android, opening the sync screen must prompt the native system permission dialog (`"Allow GrowSphere to access your contacts?"`), read real phonebook contacts, and gracefully fall back on web/desktop.
2. **Android Native Push / Local Notifications**: Android 13+ requires `POST_NOTIFICATIONS` and `SCHEDULE_EXACT_ALARM`. The app must schedule real local alarms for:
   - Daily Morning Digest (08:00 WIB / local time)
   - Targeted Alarms on specific follow-up dates (`nextSpecificFollowUp`)
3. **Dual WhatsApp Intent Dispatch**:
   - The user has both WhatsApp Regular and WhatsApp Business installed on Android.
   - The outreach modal must provide two distinct buttons:
     - `[💬 Kirim via WhatsApp]` (targeted package `com.whatsapp`)
     - `[💼 Kirim via WhatsApp Business]` (targeted package `com.whatsapp.w4b`)

---

## 2. Goals & Non-Goals

### Goals
- **Full Kinship Visual System Adoption**: Implement the exact colors, typography, layout, and component aesthetics from `docs/stitch_design/stitch_mobile_recommendation_ui_screens/kinship/DESIGN.md`:
  - Primary text & accents: Deep Slate (`#0F172A`)
  - Health & success: Emerald Green (`#10B981`)
  - Overdue alerts: Coral Rose (`#F43F5E`) & Amber (`#F59E0B`)
  - Canvas surface: `#F8FAFC` & `#FFFFFF`
  - WhatsApp action: `#25D366`
  - Typography: Plus Jakarta Sans for headings & labels, Inter for body/notes
- **Native Android Contact Picker**:
  - Add `READ_CONTACTS` to `android/app/src/main/AndroidManifest.xml`.
  - Install `@capacitor-community/contacts` (or official Capacitor contacts wrapper).
  - Support runtime permission requests (`requestPermissions()`) on Android.
  - Display contacts with name, phone numbers, and fast selection.
  - Provide fallback to mock/web demo contacts when running in desktop browser.
- **Native Android Local Notifications**:
  - Add `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, and `RECEIVE_BOOT_COMPLETED` to `AndroidManifest.xml`.
  - Install `@capacitor/local-notifications`.
  - Schedule local notifications that fire at 08:00 WIB and on specific scheduled follow-up dates.
- **Dual WhatsApp Direct Buttons**:
  - Two explicit buttons in the message outreach view:
    1. `Kirim via WhatsApp` -> URL scheme / intent targeting `com.whatsapp`
    2. `Kirim via WhatsApp Business` -> URL scheme / intent targeting `com.whatsapp.w4b`
  - Deep linking includes pre-filled AI generated greeting and etiquette.
- **Notion 10-Column Data Integrity**:
  - Maintain 100% backwards compatibility with existing Dexie IndexedDB records (`Nama`, `Asosiasi`, `Pembaruan Terakhir`, `Status`, `Terakhir Dihubungi`, `Kontak Profesional`, `Ketemu di mana & bagaimana`, `Next Follow Up`, `Possible Follow Up`, `Saran Follow Up`).
- **All Automated Tests Pass 100%**:
  - Update and expand test suites to cover Kinship components, contacts adapter, notification scheduler, and dual WhatsApp link builder.

### Non-Goals
- **Automated Background Email Dispatch**: As agreed with the user, silent background email sending is excluded to keep the application 100% offline, zero-maintenance, and free from external API keys. (If needed in the future, a simple `mailto:` draft button can be added).
- **External Cloud Sync / Server Backend**: The database remains local-first IndexedDB (`crmDb`), preserving complete privacy with local JSON backup/export.

---

## 3. UI/UX Architecture & Screens (Kinship System)

### Screen 1: Radar & Kinship Pulse (Dashboard)
- **Top App Bar**: App brand `"Kinship · Radar"`, logo mark squircle, user avatar.
- **Kinship Pulse Card**:
  - Circular SVG score gauge (`"92% SCORE"` in Emerald `#10B981`).
  - Stat pills: `Due Today` (Coral Rose), `Warm & Healthy` (Emerald), `Avg Touchpoint` (Slate).
- **Needs Attention Today (Proactive Follow-Up)**:
  - Cards for contacts due or overdue today.
  - Avatar with status dot (coral for overdue, green for safe).
  - Name, associations/tags, days since last contact.
  - Quote bubble with context: last meetup note + AI recommended conversation starter.
  - Quick action: `[💬 Chat on WhatsApp]` (opens dual WhatsApp modal or default) and Call icon.
- **Cadence Radar**:
  - Horizontal cards for contacts coming due this week (`In 2 days`, `In 4 days`).
  - Cadence pill: `[Inner Circle · Weekly]`, `[Mentor · Bi-weekly]`.
- **Bottom Navigation**:
  - 4 tabs: `[◎ Radar]`, `[📇 Contacts]`, `[📅 Schedule]`, `[🔄 Sync & Import]`.

### Screen 2: Contact Dossier (Detail View)
- **Header**: Back arrow, avatar with status dot, Name, Badges (`[MENTOR & SAHABAT]`), Title/Company, Location, Phone number.
- **Schedule Banner**: `📅 Jadwal Sapa: Hari ini (Target 3 Minggu) 09:00 WIB`.
- **Primary Outreach Action**:
  - Large WhatsApp pill (`#25D366`), Call button, Email button, `+ Log Note` button.
- **Dossier & Properties (Notion Mappings)**:
  - `Pertama Ketemu`: `metContext` (inline editable)
  - `Terakhir Ngobrol`: `lastContactedDate` + delta days
  - `Cadence`: `followUpCycleDays` (14d, 21d, 30d, etc.) with quick adjustment
  - `Next Follow-Up`: `nextSpecificFollowUp` with quick chip helpers
  - `Personal Context`: `lastUpdateNotes` & `possibleFollowUpTopic`
- **Interaction Timeline**:
  - Chronological list of logged encounters, calls, and WhatsApp chats.

### Screen 3: Sync & Import Contacts (Phonebook Sync)
- **Header**: Sync & Import Contacts description.
- **Source Tabs**: `[Phonebook]`, `[Google Contacts]`, `[File Import]`.
- **Permission Flow**:
  - If Android permission not granted, prominent card: `[🔓 Izinkan Akses Kontak HP]` calling `requestPermissions()`.
  - Once granted, lists contacts with avatars, names, phone numbers, and checkboxes.
- **Cadence Assignment**:
  - Radio pills: `Weekly (Inner Circle)`, `Bi-weekly (Mentor & VIP)`, `Monthly (Casual)`.
  - Meeting origin pills: `[Event/Conference]`, `[Kantor]`, `[Teman Lama]`, `[+ Custom]`.
- **Bottom Action**:
  - `[💬 Import N Contacts & Set Reminders]`.

### Screen 4: Schedule & Notifications
- **Header Tabs**: `[Upcoming Catch-ups]`, `[Inbox]`, `[Cadence Rules]`.
- **Today's Reminders**:
  - Contact cards with suggested AI icebreaker.
  - Actions: `[💬 Direct WhatsApp Chat]`, `[⏰ Snooze 2 Days]`, `[✓ Tandai Selesai]`.
- **Agenda Minggu Ini**:
  - Daily breakdown (e.g. Besok, Senin) with scheduled touchpoints.
- **Queue & Dispatch Settings**:
  - `[🔔 Receive Push Notifications]` (Toggles Android local notification reminders).
  - `[🚀 Auto-open WhatsApp]` (Toggles immediate redirect vs draft preview).

### Screen 5: Log Encounter / Catatan Ketemu (Sheet/Modal)
- **Trigger**: Accessible via floating `[+ Log Encounter / Meetup]` or `Log Chat` on any contact.
- **Fields**:
  - Related Contact selector
  - Format Interaksi: `[Kopi Darat]`, `[Lunch/Makan]`, `[Virtual Call]`, `[Pesan Chat]`, `[Telepon]`, `[Konferensi]`
  - Waktu & Tempat: Date picker & Location input
  - Poin Obrolan & Catatan Penting: Textarea with Notion-like styling
  - Fakta Baru / Topik Personal: Tag chips
  - Reset Siklus / Cadence toggle: automatically updates `lastContactedDate` to today and resets countdown
- **Action**: `[💾 Simpan Catatan & Update Cadence]`.

---

## 4. Dual WhatsApp Deep-Linking Engine

### Implementation Specification
```typescript
export interface WhatsAppDispatchOptions {
  phoneNumber: string;
  message: string;
  targetApp: 'whatsapp' | 'whatsapp_business';
}

export function buildDualWhatsAppUrl(options: WhatsAppDispatchOptions): string {
  const cleanPhone = normalizePhoneNumber(options.phoneNumber).replace(/\+/g, '');
  const encodedText = encodeURIComponent(options.message);

  if (options.targetApp === 'whatsapp_business') {
    // Android Intent format for WhatsApp Business package
    return `intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
  }

  // Standard WhatsApp regular package
  return `intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;package=com.whatsapp;scheme=whatsapp;end`;
}

export function openWhatsApp(options: WhatsAppDispatchOptions): void {
  const isAndroidNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  if (isAndroidNative) {
    window.location.href = buildDualWhatsAppUrl(options);
  } else {
    // Browser fallback
    const cleanPhone = normalizePhoneNumber(options.phoneNumber).replace(/\+/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(options.message)}`, '_blank');
  }
}
```

### UI Presentation in AI Draft Modal
The modal presents two distinct, accessible action buttons:
1. `[💬 Kirim via WhatsApp]` (`bg-[#25D366] text-white hover:bg-emerald-600`)
2. `[💼 Kirim via WhatsApp Business]` (`bg-slate-900 text-white hover:bg-slate-800 border border-slate-700`)

---

## 5. Android Native Permissions & Local Notifications

### Manifest Declarations in `android/app/src/main/AndroidManifest.xml`
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

### Capacitor Plugin Setup
- `@capacitor-community/contacts` for reading native phonebook contacts with runtime permission check.
- `@capacitor/local-notifications` for scheduling daily morning digest at 08:00 WIB and targeted follow-up alarms.

---

## 6. Verification Criteria
1. **Compilation**: `npm run build` succeeds without type errors or lint warnings.
2. **Automated Tests**: 100% test pass rate across all existing and new test suites.
3. **Android Build**: `./gradlew assembleDebug` compiles `GrowSphere.apk` cleanly.
4. **Emulator Run & Verification**:
   - Tested on Android emulator (`emulator-5554`, Android 16).
   - Permission dialog prompts when clicking "Izinkan Akses Kontak".
   - Local notification permission requested and notifications scheduled.
   - Dual WhatsApp buttons tested.
   - Full 5 Kinship screens render beautifully without visual glitches.
