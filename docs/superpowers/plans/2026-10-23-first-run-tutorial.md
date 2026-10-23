# First-Run Guided Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New Sapa users get a one-time intro (welcome → features → permissions) followed by a spotlight tour over the real UI that ends when they open WhatsApp with an AI draft for a real contact.

**Architecture:** A small persisted state machine (`tutorialService.ts`) owns status/step/contactId. The intro reuses `OnboardingModal` (welcome slide prepended, permission screen appended). A portal `TourSpotlight` overlay finds real elements by `data-tour="…"` attributes, dims the rest, and lets taps pass through only the highlighted element. `App.tsx` drives tabs/modals per step and tells the tour which "context" (shell / dossier / draft) is on screen, so the overlay hides while other modals (add/edit/import) are open.

**Tech Stack:** React 18, TypeScript, Tailwind, Capacitor 8 (Android), Vitest + Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-23-first-run-tutorial-design.md`

## Global Constraints

- All user-facing copy in Indonesian.
- No new npm dependencies.
- Tutorial shows only when tutorial state is absent AND `localStorage['sapa_onboarding_completed'] !== 'true'` (existing users skip), or after "Ulangi Tutorial".
- "Lewati" visible on every intro screen and every tour tooltip; it sets status `done` permanently.
- No message is ever sent automatically; WhatsApp step copy says the user sends it themselves.
- Light and dark themes both supported (`dark:` classes like surrounding code).
- localStorage access always wrapped in try/catch (pattern in `OnboardingModal.tsx:152`).

## Review Focus

1. Target element not in DOM (e.g. contact list empty, modal not open yet) → after 1500 ms tooltip shows centered with "Berikutnya" so the user is never stuck. Test in Task 4.
2. Chosen tutorial contact deleted before resume → resume falls back to `pick-contact`. Test in Task 1 (`resolveResumeStep`).
3. User opens Tambah Kontak / Impor HP from the tour → overlay hidden while that modal is open, reappears after. Test in Task 6.
4. Corrupted JSON in `sapa_tutorial_state` → treated as absent (no crash). Test in Task 1.
5. Typing in "Bahan Obrolan Follow Up" then tapping Berikutnya → value saved (blur fires before advancing). Test in Task 4 (`onNext` blurs active element).

---

### Task 1: Tutorial state service and step definitions

**Files:**
- Create: `src/services/tutorialService.ts`
- Test: `tests/services/tutorialService.test.ts`

**Interfaces:**
- Produces:
  - `type TourContext = 'shell' | 'dossier' | 'draft'`
  - `type TourStepId = 'radar-tab' | 'contacts-tab' | 'add-contact' | 'pick-contact' | 'field-met' | 'field-notes' | 'field-topic' | 'field-schedule' | 'jadwal-tab' | 'draft-ai' | 'draft-pick' | 'whatsapp'`
  - `interface TourStep { id: TourStepId; target: string /* data-tour value */; context: TourContext; tab?: 'radar' | 'contacts' | 'notifications'; advance: 'next' | 'click'; title: string; body: string }`
  - `const TOUR_STEPS: TourStep[]` (order = `TourStepId` order above)
  - `type TutorialStatus = 'intro' | 'tour' | 'done'`
  - `interface TutorialState { status: TutorialStatus; stepId?: TourStepId; contactId?: string }`
  - `const TUTORIAL_STORAGE_KEY = 'sapa_tutorial_state'`
  - `loadTutorialState(): TutorialState` — absent/corrupt → `{status:'done'}` if `sapa_onboarding_completed === 'true'`, else `{status:'intro'}`
  - `saveTutorialState(state: TutorialState): void`
  - `resetTutorial(): TutorialState` — saves and returns `{status:'intro'}`
  - `nextStepId(id: TourStepId): TourStepId | null`
  - `resolveResumeStep(state: TutorialState, contactExists: (id: string) => boolean): TourStepId` — if step context is `dossier`/`draft` and contact missing → `'pick-contact'`; if step is `draft-pick`/`whatsapp` → `'draft-ai'` (modal must be reopened by tap); else the saved step (default `'radar-tab'`).

Step table (targets and copy are fixed):

| id | target | context | tab | advance | title | body |
|---|---|---|---|---|---|---|
| radar-tab | nav-radar | shell | radar | next | Beranda Radar | Di sini Sapa menunjukkan siapa saja yang sudah waktunya disapa dan seberapa hangat silaturahmi Anda. |
| contacts-tab | nav-contacts | shell | radar | click | Buka Daftar Kontak | Ketuk tab Kontak untuk melihat semua relasi Anda. |
| add-contact | add-actions | shell | contacts | click | Tambahkan Kontak untuk Tutorial | Untuk tutorial ini, tambahkan satu kontak sungguhan lewat + Tambah Kontak, atau ambil dari buku telepon lewat Impor HP. Sudah punya kontak? Ketuk Berikutnya. |
| pick-contact | contact-list | shell | contacts | click | Pilih Satu Kontak untuk Latihan | Ketuk salah satu kontak. Kontak ini akan kita pakai sampai akhir tutorial. |
| field-met | field-met | dossier | – | next | Pertama Ketemu & Konteks | Catat di mana dan bagaimana Anda kenal orang ini, misalnya "kenal di kajian Ahad di masjid kampus". |
| field-notes | field-notes | dossier | – | next | Pembaruan Kabar Terakhir | Tulis kabar terbaru tentang dia: pekerjaan, keluarga, kesehatan. Ini membantu Anda ingat konteks saat menyapa. |
| field-topic | field-topic | dossier | – | next | Bahan Obrolan Follow Up Berikutnya | Ini kolom terpenting. Tulis apa yang ingin Anda tanyakan atau bahas saat menyapa berikutnya, misalnya "tanya kabar ibunya yang baru operasi". Draf AI memakai kolom ini untuk menyusun pesan yang personal. Coba ketik satu kalimat sekarang (ini mengubah kontak Anda sungguhan). |
| field-schedule | field-schedule | dossier | – | next | Jadwal & Ritme Sapa | Atur tanggal follow up khusus untuk mendapat alarm, dan Ritme Sapa (hari) supaya Sapa mengingatkan Anda secara berkala. |
| jadwal-tab | nav-notifications | shell | notifications | next | Jadwal & Pengingat | Di tab Jadwal ada rangkuman pagi dan daftar sapaan yang terjadwal. Sapa akan mengirim notifikasi pengingat ke HP Anda. |
| draft-ai | dossier-draft-ai | dossier | – | click | Buat Draf dengan AI | Ketuk Draf AI. Sapa akan menyusun 3 pilihan pesan pembuka berdasarkan catatan kontak ini. |
| draft-pick | draft-options | draft | – | click | Pilih Satu Draf | Ketuk salah satu dari 3 pilihan pesan. Anda masih bisa mengedit teksnya. |
| whatsapp | draft-whatsapp | draft | – | click | Kirim lewat WhatsApp | Ketuk WhatsApp atau WhatsApp Business. Pesan tidak terkirim otomatis: WhatsApp terbuka dengan draf siap, lalu Anda sendiri yang menekan kirim. |

Note: `add-contact` is `click` but its tooltip also shows "Berikutnya" (Task 4 shows Berikutnya on every step; `click` steps additionally advance on target tap).

- [ ] **Step 1: Write failing tests** in `tests/services/tutorialService.test.ts`:
  - `loadTutorialState returns intro for fresh install` → `{status:'intro'}`
  - `loadTutorialState returns done for existing users` (set `sapa_onboarding_completed`='true') → `{status:'done'}`
  - `loadTutorialState treats corrupt JSON as absent` (set key to `'{oops'`) → `{status:'intro'}`
  - `save then load round-trips` `{status:'tour', stepId:'field-topic', contactId:'c1'}`
  - `resetTutorial returns intro even after done`
  - `nextStepId('radar-tab') === 'contacts-tab'` and `nextStepId('whatsapp') === null`
  - `TOUR_STEPS has 12 steps and field-topic body mentions Draf AI`
  - `resolveResumeStep falls back to pick-contact when contact deleted` (`{status:'tour',stepId:'field-notes',contactId:'x'}`, `() => false`) → `'pick-contact'`
  - `resolveResumeStep maps draft-pick to draft-ai` (contact exists) → `'draft-ai'`
- [ ] **Step 2: Run** `npx vitest run tests/services/tutorialService.test.ts` → FAIL (module not found)
- [ ] **Step 3: Implement** `src/services/tutorialService.ts` per Interfaces and table.
- [ ] **Step 4: Run** same command → PASS
- [ ] **Step 5: Commit** `feat(tutorial): add tutorial state service and tour step definitions`

---

### Task 2: Permission helpers and native "open app settings"

**Files:**
- Modify: `src/utils/whatsapp.ts` (extend `WhatsAppLauncherPluginType` with `openAppSettings(): Promise<void>`)
- Modify: `android/app/src/main/java/com/growsphere/crm/WhatsAppLauncherPlugin.java` (add `@PluginMethod openAppSettings` using `Settings.ACTION_APPLICATION_DETAILS_SETTINGS` with `Uri.fromParts("package", getContext().getPackageName(), null)`, `FLAG_ACTIVITY_NEW_TASK`, `call.resolve()`)
- Modify: `src/services/nativeContactsAdapter.ts`
- Create: `src/services/permissionService.ts`
- Test: `tests/services/permissionService.test.ts`

**Interfaces:**
- Produces (in `permissionService.ts`):
  - `type PermissionState = 'granted' | 'denied' | 'unavailable'`
  - `checkContactsPermission(): Promise<PermissionState>` / `requestContactsPermission(): Promise<PermissionState>` — use the same contacts plugin access as `getDeviceContactsWithStatus()`; non-native → `'unavailable'`
  - `checkNotificationsPermission(): Promise<PermissionState>` / `requestNotificationsPermission(): Promise<PermissionState>` — wrap existing `checkNotificationPermission`/`requestNotificationPermission` from `notificationService.ts`; non-native → `'unavailable'`
  - `openAppSettings(): Promise<void>` — native android → `WhatsAppLauncher.openAppSettings()`; otherwise no-op; never throws
- Consumes: `isNativePlatform()` from `notificationService.ts`.

If the contacts plugin access is private inside `nativeContactsAdapter.ts`, export a small `getContactsPlugin()` there rather than duplicating it.

- [ ] **Step 1: Write failing tests** (mock `@capacitor/core` / plugin modules the way `tests/services/nativeContactsAdapter.test.ts` and `notificationService.test.ts` already do):
  - `returns unavailable on web for all four check/request functions`
  - `requestContactsPermission returns granted when plugin grants` (native mocked)
  - `requestContactsPermission returns denied when plugin denies`
  - `openAppSettings calls WhatsAppLauncher.openAppSettings on android`
  - `openAppSettings swallows plugin errors`
- [ ] **Step 2: Run** `npx vitest run tests/services/permissionService.test.ts` → FAIL
- [ ] **Step 3: Implement** the TS functions and the Java method.
- [ ] **Step 4: Run** tests → PASS; also `npx tsc --noEmit` → no errors
- [ ] **Step 5: Commit** `feat(permissions): add permission helpers and open app settings native method`

---

### Task 3: Intro — welcome slide and permission screen in OnboardingModal

**Files:**
- Modify: `src/components/onboarding/OnboardingModal.tsx`
- Create: `src/components/onboarding/PermissionStep.tsx`
- Test: `tests/components/OnboardingModal.test.tsx` (update), `tests/components/PermissionStep.test.tsx`

**Interfaces:**
- Consumes: Task 2 `PermissionState`, check/request/openAppSettings functions.
- Produces:
  - `OnboardingModalProps` becomes `{ isOpen: boolean; onSkip: () => void; onFinish: () => void }` (drop `onClose`/`onComplete`; remove its own localStorage write — `App` persists via tutorialService).
  - `PermissionStep: React.FC<{ onContinue: () => void }>`

Behavior:
- Slide order: new **welcome** slide first — badge `Selamat Datang`, title `Assalamu'alaikum, Selamat Datang di Sapa`, description `Sapa membantu Anda menjaga silaturahmi: mengingatkan siapa yang sudah waktunya disapa, mencatat kabar mereka, dan membantu menyusun pesan WhatsApp yang santun.` — then the 3 existing slides unchanged, then the permission screen. Last feature slide's primary button says `Lanjutkan`, not finish.
- "Lewati" in header → `onSkip()` on every screen including permissions.
- `PermissionStep`: two cards (`Akses Kontak` — "Agar Anda bisa mengimpor kontak dari buku telepon."; `Notifikasi` — "Agar Sapa bisa mengingatkan Anda untuk menyapa."). Each shows status: granted → `✓ Diizinkan`; else button `Izinkan` (calls request). After a request that returns `denied`, the card shows `Buka Pengaturan` (calls `openAppSettings`) and note `Izin belum aktif. Aktifkan di Pengaturan HP, lalu kembali ke Sapa.` `unavailable` → `Tidak tersedia di perangkat ini`. Re-check both on mount and on `document` `visibilitychange` to visible. Bottom button `Mulai Tutorial` → `onContinue()` (always enabled).
- After permission screen → `onFinish()`.

- [ ] **Step 1: Write failing tests**
  - OnboardingModal: `first slide is the welcome slide` (title text), `Lewati calls onSkip`, `going through 4 slides then Mulai Tutorial calls onFinish` (mock permissionService to `'unavailable'`).
  - PermissionStep: `Izinkan requests contacts permission and shows Diizinkan when granted`; `shows Buka Pengaturan after denial and calls openAppSettings`; `rechecks permissions on visibilitychange`; `Mulai Tutorial calls onContinue even when denied`.
  - Update existing OnboardingModal tests that used `onClose`/storage to the new props.
- [ ] **Step 2: Run** `npx vitest run tests/components/OnboardingModal.test.tsx tests/components/PermissionStep.test.tsx` → FAIL
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `feat(onboarding): add welcome slide and permission request step`

---

### Task 4: TourSpotlight overlay

**Files:**
- Create: `src/components/tutorial/TourSpotlight.tsx`
- Test: `tests/components/TourSpotlight.test.tsx`

**Interfaces:**
- Consumes: Task 1 `TourStep`.
- Produces: `TourSpotlight: React.FC<{ step: TourStep; stepIndex: number; total: number; onNext: () => void; onSkip: () => void }>`

Behavior:
- Rendered via `createPortal` into `document.body`, `fixed inset-0`, z-index above every modal (`z-[100]`).
- Finds `document.querySelector('[data-tour="' + step.target + '"]')`; `scrollIntoView({block:'center', behavior:'smooth'})` once found; re-measures `getBoundingClientRect()` on resize/scroll and every 300 ms while mounted (targets move with animations).
- Dimming = four `rgba(10,15,30,0.62)` panels around the hole (they block taps); the hole itself has no element, so taps reach the real target. Highlight ring around the hole (`box-shadow` like the mockup).
- For `advance: 'click'`, a capture-phase `click` listener on `document` calls `onNext()` when the event target is inside the target element (does not `preventDefault`, so the real action still happens).
- Tooltip card placed below the hole, or above if no room; content: title, body, `Langkah {stepIndex+1} dari {total}`, buttons `Lewati` (→ `onSkip`) and `Berikutnya` (→ blur `document.activeElement` if it is an input/textarea, then `onNext`). `Berikutnya` is shown on every step.
- Target not found within 1500 ms → no hole, full dim, tooltip centered (Berikutnya still works).

- [ ] **Step 1: Write failing tests**
  - `renders title, body and step counter`
  - `Lewati calls onSkip`
  - `Berikutnya blurs a focused textarea before calling onNext` (render a textarea with onBlur spy, focus it, click Berikutnya → blur spy called before onNext; assert call order)
  - `click step advances when the real target is clicked` (render `<button data-tour="x">`, step target `x`, advance `click`; click button → onNext called and button's own onClick also called)
  - `shows centered fallback when target is missing after 1500ms` (fake timers; tooltip has `data-fallback="true"`)
- [ ] **Step 2: Run** `npx vitest run tests/components/TourSpotlight.test.tsx` → FAIL
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `feat(tutorial): add TourSpotlight overlay`

---

### Task 5: Tour anchors on real UI elements

**Files:**
- Modify: `src/components/ui/BottomNavBar.tsx:42` — `data-tour={\`nav-${tab.id}\`}` on each tab button
- Modify: `src/App.tsx:756` — `data-tour="add-actions"` on the header div holding Impor HP + Tambah Kontak
- Modify: `src/App.tsx:857` — `data-tour="contact-list"` on the cards wrapper `div.space-y-3` (covers both empty state and grid)
- Modify: `src/components/kinship/KinshipContactDossierModal.tsx` — `data-tour="field-met"` / `"field-notes"` / `"field-topic"` on the wrapper of each of the fields `dossier-met-context` / `dossier-last-notes` / `dossier-topic`; `data-tour="field-schedule"` on a wrapper spanning `dossier-next-followup` + the Terakhir Sapa/Ritme grid (add a wrapper div if none exists); `data-tour="dossier-draft-ai"` on the Draf AI button (~line 466)
- Modify: `src/components/crm/AiDraftModal.tsx` — `data-tour="draft-options"` on the container of the 3 option cards (~line 311); `data-tour="draft-whatsapp"` on the div wrapping `DualWhatsAppButton` (~line 403)
- Test: `tests/components/TourAnchors.test.tsx`

**Interfaces:** Produces the DOM anchors named in Task 1's `target` column. Nothing else changes.

- [ ] **Step 1: Write failing test** `every tour target exists in its screen`: render `BottomNavBar` with the App's 4 tabs, `KinshipContactDossierModal` (open, mock contact), `AiDraftModal` (open, mock contact, drafts resolved via the module's existing test mocks) and assert `container.querySelector('[data-tour="…"]')` is non-null for every target of `TOUR_STEPS` that belongs to that screen. App-level anchors (`add-actions`, `contact-list`) are asserted in Task 6.
- [ ] **Step 2: Run** `npx vitest run tests/components/TourAnchors.test.tsx` → FAIL
- [ ] **Step 3: Add the attributes.**
- [ ] **Step 4: Run** → PASS, and full `npx vitest run` → all pass (no layout/test regressions)
- [ ] **Step 5: Commit** `feat(tutorial): add data-tour anchors to real UI elements`

---

### Task 6: Wire tutorial into App (+ Ulangi Tutorial)

**Files:**
- Create: `src/components/tutorial/useTutorial.ts`
- Modify: `src/App.tsx` (replace `isOnboardingOpen` state at ~188 and the `<OnboardingModal>` at ~1376; render `TourSpotlight`; settings card)
- Test: `tests/components/useTutorial.test.tsx`, `tests/App.test.tsx` (add cases)

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: `useTutorial(opts: { context: TourContext | 'other'; selectedContactId: string | null; contactExists: (id: string) => boolean; setActiveTab: (tab: string) => void; openContact: (id: string) => void; closeContact: () => void; onComplete: () => void }): { state: TutorialState; currentStep: TourStep | null; showIntro: boolean; showTour: boolean; skip: () => void; finishIntro: () => void; next: () => void; replay: () => void }`

Rules inside the hook:
- Init: `loadTutorialState()`; if `status === 'tour'` use `resolveResumeStep`.
- `finishIntro` → `{status:'tour', stepId:'radar-tab'}`; `skip` → `{status:'done'}`; `replay` → `resetTutorial()`. Every change is saved.
- On entering a step: if `step.tab` set → `setActiveTab(step.tab)`; if step context is `shell` and a contact is open → `closeContact()` (this is how `jadwal-tab` leaves the dossier); if step is `draft-ai` and no contact open → `openContact(state.contactId)`.
- `pick-contact` advances (and stores `contactId = selectedContactId`) when `context` becomes `'dossier'`, not on the click itself; `next()` is a no-op on `pick-contact` and its tooltip hides Berikutnya (add `hideNext?: boolean` to `TourStep`, set only on `pick-contact`; TourSpotlight respects it).
- Entering any `dossier`-context step with no contact open: `contactId` stored → `openContact(contactId)`; none → go to `pick-contact`.
- User closes a modal mid-step (track previous context in a ref): context goes `dossier → shell` during a dossier step → go to `pick-contact`; context goes `draft → dossier` during `draft-pick`/`whatsapp` → go to `draft-ai`. This is what keeps the tour from getting stuck hidden.
- `next` on `whatsapp` → `{status:'done'}` and `onComplete()`.
- `showTour` = `status==='tour' && currentStep.context === context` (so `'other'` — edit/import/log modals open — hides it).

App wiring:
- `context`: `draftContact ? 'draft' : selectedContact ? 'dossier' : (isEditModalOpen || isSyncOpen || logEncounterContact || isDrawerOpen || isUpdateModalOpen) ? 'other' : 'shell'`.
- `onComplete` → `showToast('Tutorial selesai 🎉 Selamat menyapa!', 'success')` (use the existing toast type that matches).
- Render `<OnboardingModal isOpen={showIntro} onSkip={skip} onFinish={finishIntro} />` and `{showTour && currentStep && <TourSpotlight … onNext={next} onSkip={skip} />}`.
- Settings tab: new card `Tutorial Penggunaan` with button `Ulangi Tutorial` → `replay()` then `setActiveTab('radar')`.

- [ ] **Step 1: Write failing tests**
  - useTutorial (renderHook): `fresh install shows intro`; `finishIntro starts tour at radar-tab and switches to radar tab`; `skip sets done and persists`; `pick-contact advances when dossier opens and stores contactId`; `jadwal-tab closes the open contact`; `draft-ai reopens the stored contact`; `whatsapp next completes and calls onComplete`; `tour hidden while context is other` (Review Focus 3); `replay restarts intro`; `closing the draft modal during draft-pick returns to draft-ai`; `closing the dossier during field-notes returns to pick-contact`; `next on pick-contact does nothing`.
  - App.test: `existing user with sapa_onboarding_completed does not see intro`; `Pengaturan has Ulangi Tutorial which reopens the intro`; `add-actions and contact-list anchors render`.
- [ ] **Step 2: Run** `npx vitest run tests/components/useTutorial.test.tsx tests/App.test.tsx` → FAIL
- [ ] **Step 3: Implement** the hook and the App changes.
- [ ] **Step 4: Run** full `npx vitest run` and `npx tsc --noEmit` → all pass
- [ ] **Step 5: Manual check** with `npm run dev` in the browser pane: fresh localStorage → intro → tour through all 12 steps with one real contact; Lewati works; reload mid-tour resumes; light + dark.
- [ ] **Step 6: Commit** `feat(tutorial): wire first-run guided tour into app with replay in settings`

---

### Task 7: Release v1.1.0

Minor bump (new feature). Follow the release routine already used for 1.0.2/1.0.3:

- [ ] Bump to `1.1.0` in `package.json`, `package-lock.json` (root + `packages[""]`), `src/services/updateService.ts` (`CURRENT_APP_VERSION`), `android/app/build.gradle` (`versionCode 5`, `versionName "1.1.0"`).
- [ ] `npx vitest run` → all pass; `npm run build && npx cap sync android`; `cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew assembleRelease`.
- [ ] Verify APK: `aapt2 dump badging` shows `versionCode='5' versionName='1.1.0'`; `apksigner verify --print-certs` SHA-256 `22ffc94829f77abb8707e7bcc5360b7c643c674f25f8e01474e5feb5bc8e9648`.
- [ ] Commit `chore: bump version to 1.1.0`, tag `v1.1.0`, push `main` + tag.
- [ ] Create GitHub Release `v1.1.0` (title `Sapa-ai v1.1.0 — Tutorial Penggunaan untuk Pengguna Baru`, Indonesian notes: new first-run tutorial, permission prompt with Buka Pengaturan fallback, Ulangi Tutorial in Pengaturan) via the GitHub API with the token from `git credential fill`; upload `sapa-ai-v1.1.0.apk`; confirm `releases/latest` = `v1.1.0`.
