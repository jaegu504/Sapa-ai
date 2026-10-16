# Sapa AI Natural Phrasing, Visual Identity & iOS Micro-Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Personal Relationship CRM into "Sapa" with an intelligent, multi-label bilingual (ID & TR) natural phrasing AI engine, 3 instant draft options with anti-repetition memory, fluid Gemini Live iridescent thinking glow, iOS spring micro-interactions, and 100% Indonesian localization.

**Architecture:** A zero-config Cloudflare Worker proxy (`https://sapa-ai.jaegu108.workers.dev/`) securely routes prompts to Gemini 3 Flash without exposing keys in client APKs, backing up to offline combinatorial sentence synthesis when unreachable. An upgraded `AiDraftModal` renders an iOS segmented language toggle (🇮🇩 / 🇹🇷), 3 distinct conversational angle cards, and an iridescent CSS aura glow with spring transitions. All user-facing brand text and remaining English strings are localized to Indonesian while preserving the Dexie 10-column database schema.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Dexie.js (IndexedDB), Capacitor 6 Android, Vitest & React Testing Library, Cloudflare Workers, Google Gemini API (gemini-3-flash-preview).

**Spec:** [docs/superpowers/specs/2026-10-16-sapa-ai-natural-phrasing-and-branding.md](file:///Users/sp/Documents/Antigravitty/docs/superpowers/specs/2026-10-16-sapa-ai-natural-phrasing-and-branding.md)

## Global Constraints

- **Brand Name:** "Sapa" replaces all mentions of "Kinship" and "GrowSphere" across all user-facing UI screens, titles, headers, and notification channels.
- **Header Avatar:** The "KS" monogram avatar in the top navbar is replaced with the official Sapa conversation logo SVG.
- **Language & Tone Support:** Bilingual support for Indonesian (`id`) and Turkish (`tr`). Phone numbers starting with `+90` default to Turkish, while others default to Indonesian, with manual toggle override.
- **Multi-Label Tone Blending:** Support blending multiple etiquette categories (`Hoca` + `Teman` = takzim greeting with warm brotherly body; `Ihvan` + `Teman` = ukhuwah karib; `Keluarga` + `Profesional` = warm caring with concise business clarity).
- **Anti-Repetition & 3 Options:** Provide 3 distinct draft angles simultaneously (Warm Greeting, Topic Discussion, Meet / Çay Invitation). Unlimited "Generate Ulang" must generate unique, non-repetitive drafts using `previousDrafts` memory and `temperature: 0.85`.
- **iOS Micro-Interactions:** Smooth spring physics curves `cubic-bezier(0.32, 0.72, 0, 1)`, tactile press feedback `active:scale-[0.96]`, and frosted glass `backdrop-blur-xl bg-white/80`.
- **Gemini Live Thinking Aura:** Fluid iridescent gradient aura (`geminiAura`) with blur filter on the modal card border during generation, accompanied by an internal shimmer wave (`shimmerWave`).
- **Data Integrity:** Preserve the 10-column Notion Dexie database schema and existing contact data completely intact.
- **Quality Standard:** 100% automated test pass rate across all test suites (zero regressions) and successful Android debug APK compilation.

## Review Focus

1. **Turkish (+90) Phone Detection:** A contact with a Turkish phone number (`+90...`) must automatically default to Turkish language mode (`tr`) in the draft modal, while still allowing the user to tap the Indonesian (`id`) segment to switch back.
2. **Multi-Label Priority & Blending:** A contact tagged with both `Hoca` and `Teman` must produce a draft honoring both: respectful honorific greeting (`Assalamu'alaikum Hoca...` or `Selamün aleyküm Hocam...`) without stiff/robotic boilerplate, followed by a warm, friendly conversational body.
3. **Empty / Shorthand Topic Synthesis:** A contact with brief shorthand notes (e.g. `"progres rumah BSD"`) or no notes at all must produce natural, fluent conversational sentences without rendering `undefined`, `null`, or raw verbatim sentence fragments.
4. **Cloudflare Worker Offline Fallback:** If the Cloudflare Worker URL or Gemini API fails (HTTP 4xx/5xx, rate limit 503, or network offline), the system must immediately fall back to the rich deterministic offline generator without crashing, throwing errors, or leaving the user with an empty screen.
5. **Anti-Repetition Memory:** When "Generate Ulang" is clicked multiple times, `previousDrafts` must accumulate and prevent verbatim re-generation of identical opening lines or structures.

---

### Task 1: Cloudflare Worker Endpoint Hardening

**Files:**
- Modify: `cloudflare-worker/worker.js:35-50`

**Interfaces:**
- Consumes: Cloudflare Worker environment (`env.GEMINI_API_KEY`) and POST request JSON body `{ prompt: string, model?: string, temperature?: number }`.
- Produces: JSON response with `{ candidates: [...] }` or `{ error: ... }`, defaulting to model `gemini-3-flash-preview` and providing fallback if 503 is returned.

- [ ] **Step 1: Write test or curl verification expectation for worker model fallback**
Update `cloudflare-worker/worker.js` so line 37 defaults to `"gemini-3-flash-preview"` rather than `"gemini-1.5-flash"`:
```javascript
const model = body.model || "gemini-3-flash-preview";
```

- [ ] **Step 2: Update `cloudflare-worker/worker.js`**
Ensure CORS headers allow `Content-Type`, `Authorization`, and methods `POST, OPTIONS`. If Gemini returns 503 or 404, capture error gracefully.

- [ ] **Step 3: Verify with curl command**
Run: `curl -s -X POST https://sapa-ai.jaegu108.workers.dev/ -H "Content-Type: application/json" -d '{"prompt": "halo, jawab satu kata: oke", "model": "gemini-3-flash-preview"}'`
Expected: HTTP 200 with JSON containing `"candidates":[{"content":{"parts":[{"text": ...`

- [ ] **Step 4: Commit**
```bash
git add cloudflare-worker/worker.js
git commit -m "feat(worker): set default model to gemini-3-flash-preview and enhance error handling"
```

---

### Task 2: Multi-Label Tone Blending, Shorthand Parsing & Bilingual (ID/TR) AI Sapaan Engine

**Files:**
- Modify: `src/services/aiDraftService.ts`
- Modify: `tests/services/aiDraftService.test.ts`

**Interfaces:**
- Consumes: `Contact` from `src/types/crm.ts`.
- Produces:
  ```typescript
  export type SapaLanguage = 'id' | 'tr';
  export type SapaAngle = 'warm_greeting' | 'topic_discussion' | 'catchup_meet';

  export interface SapaDraftOption {
    id: string;
    angle: SapaAngle;
    title: string;
    text: string;
  }

  export interface GenerateSapaOptions {
    contact: Contact;
    language: SapaLanguage;
    targetAngle?: SapaAngle;
    previousDrafts?: string[];
    now?: Date;
  }

  export async function generateSapaDrafts(
    options: GenerateSapaOptions,
    proxyUrl?: string,
    apiKey?: string
  ): Promise<{ drafts: SapaDraftOption[]; source: 'worker' | 'gemini_direct' | 'offline_rule' }>;

  export function generateDeterministicFallbackDraft(
    contact: Contact,
    language?: SapaLanguage,
    angle?: SapaAngle,
    variationIndex?: number
  ): string;

  export async function generateWhatsAppDraft(
    contact: Contact,
    apiKey?: string,
    language?: SapaLanguage
  ): Promise<string>;
  ```

- [ ] **Step 1: Write failing unit tests in `tests/services/aiDraftService.test.ts`**
Add tests for:
1. `generateDeterministicFallbackDraft` with Turkish language (`language: 'tr'`) producing authentic Turkish honorifics (`Hocam`, `Abim`, `Kardeşim`, `selamün aleyküm`, `çay içelim`).
2. Multi-label tone blending for `Hoca` + `Teman` (combines takzim greeting with warm brotherly body).
3. Multi-label tone blending for `Keluarga` + `Profesional` (family care + professional clarity).
4. `generateSapaDrafts` returning 3 distinct draft options (`warm_greeting`, `topic_discussion`, `catchup_meet`).
5. Offline fallback when Cloudflare Worker proxy or Gemini API throws an error.
6. Anti-repetition when `previousDrafts` is supplied.

- [ ] **Step 2: Run tests to verify failure (RED)**
Run: `npx vitest run tests/services/aiDraftService.test.ts`
Expected: FAIL on new functions and Turkish/multi-label assertions.

- [ ] **Step 3: Implement `src/services/aiDraftService.ts`**
1. Add `SapaLanguage`, `SapaAngle`, `SapaDraftOption`, `GenerateSapaOptions` types.
2. Build combinatorial rich phrase banks for Indonesian (`id`) and Turkish (`tr`) with angles:
   - `warm_greeting` (Kabar & Doa)
   - `topic_discussion` (Bahasan Topik Inti)
   - `catchup_meet` (Ajak Temu / Ngopi / Çay)
3. Implement multi-label blending logic checking combinations of `Hoca`, `Ihvan`, `Keluarga`, `Teman`, `Profesional`.
4. Implement `generateSapaDrafts` targeting the default Cloudflare proxy `https://sapa-ai.jaegu108.workers.dev/` with fallback to direct Gemini API or deterministic offline generator.
5. Support `variationIndex` and `previousDrafts` to prevent repetitive phrases.
6. Preserve `generateWhatsAppDraft(contact, apiKey, language)` for full backward compatibility.

- [ ] **Step 4: Run tests to verify all pass (GREEN)**
Run: `npx vitest run tests/services/aiDraftService.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Verify zero TypeScript errors**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/services/aiDraftService.ts tests/services/aiDraftService.test.ts
git commit -m "feat(ai): implement multi-label tone blending, bilingual id/tr generator and 3 draft angles"
```

---

### Task 3: CSS Tokens for iOS Spring Physics, Tap Feedback & Gemini Live Iridescent Glow

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.js`

**Interfaces:**
- Consumes: Tailwind CSS base configuration.
- Produces:
  - `@keyframes geminiAura` and `.gemini-aura-glow`
  - `@keyframes shimmerWave` and `.shimmer-wave`
  - `.ios-spring` (`cubic-bezier(0.32, 0.72, 0, 1)`)
  - `.ios-tap` (`active:scale-[0.96] transition-transform duration-150`)

- [ ] **Step 1: Add keyframes and utility classes in `src/index.css`**
Add:
```css
@keyframes geminiAura {
  0% {
    background-position: 0% 50%;
    filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.45));
  }
  50% {
    background-position: 100% 50%;
    filter: drop-shadow(0 0 18px rgba(139, 92, 246, 0.55));
  }
  100% {
    background-position: 0% 50%;
    filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.45));
  }
}

@keyframes shimmerWave {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.gemini-aura-glow {
  background: linear-gradient(135deg, #3B82F6, #8B5CF6, #06B6D4, #10B981, #3B82F6);
  background-size: 300% 300%;
  animation: geminiAura 4s ease infinite;
}

.shimmer-wave {
  animation: shimmerWave 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.ios-spring {
  transition: all 400ms cubic-bezier(0.32, 0.72, 0, 1);
}

.ios-tap {
  transition: transform 150ms cubic-bezier(0.32, 0.72, 0, 1);
}
.ios-tap:active {
  transform: scale(0.96);
}
```

- [ ] **Step 2: Update `tailwind.config.js`**
Extend animation and transition timing functions for `ios-spring`.

- [ ] **Step 3: Verify build passes**
Run: `npm run build`
Expected: Build succeeds with 0 CSS errors.

- [ ] **Step 4: Commit**
```bash
git add src/index.css tailwind.config.js
git commit -m "feat(ui): add css keyframes and utility classes for gemini live aura and ios spring physics"
```

---

### Task 4: Redesign `AiDraftModal.tsx` with iOS Language Switcher, 3 Instant Draft Options & Gemini Aura

**Files:**
- Modify: `src/components/crm/AiDraftModal.tsx`
- Modify: `tests/components/AiDraftModal.test.tsx`

**Interfaces:**
- Consumes: `Contact` from `src/types/crm.ts`, `generateSapaDrafts` from `src/services/aiDraftService.ts`, `DualWhatsAppButton` from `src/components/kinship/DualWhatsAppButton.tsx`.
- Produces: Upgraded `AiDraftModal` component with:
  - Phone prefix detection: `contact.phoneNumber.startsWith('+90')` sets language to `'tr'`, else `'id'`.
  - iOS Segmented language switcher: `[ 🇮🇩 Indonesia | 🇹🇷 Türkçe ]`.
  - 3 instant draft option cards (Opsi 1: Kabar & Doa, Opsi 2: Bahasan Topik, Opsi 3: Ajak Temu / Çay).
  - Selected card expands into editable textarea.
  - Unlimited "Generate Ulang" with spinning Gemini icon and memory accumulation.
  - Gemini Live thinking aura indicator on card border when `loading === true`.
  - Preserved `DualWhatsAppButton` (Kirim via WhatsApp / WhatsApp Business) and quick Mark Done.

- [ ] **Step 1: Write failing tests in `tests/components/AiDraftModal.test.tsx`**
1. Test auto-detection of Turkish language when contact phone starts with `+90`.
2. Test switching language segment between `🇮🇩 Indonesia` and `🇹🇷 Türkçe` triggers re-generation in chosen language.
3. Test rendering 3 distinct option cards (Kabar & Doa, Bahasan Topik, Ajak Temu).
4. Test clicking an option card selects it and updates the editable textarea.
5. Test "Generate Ulang" button calls generator with accumulated `previousDrafts`.
6. Test Gemini Live thinking indicator is displayed while generating.

- [ ] **Step 2: Run tests to verify failure (RED)**
Run: `npx vitest run tests/components/AiDraftModal.test.tsx`
Expected: FAIL on new UI elements.

- [ ] **Step 3: Implement `src/components/crm/AiDraftModal.tsx`**
Rewrite `AiDraftModal.tsx` with:
- Initial state: auto-detect Turkish from `+90` prefix or default to `'id'`.
- Segmented control `[ 🇮🇩 Indonesia | 🇹🇷 Türkçe ]` with `.ios-tap` and spring pill transition.
- Tone badge reflecting multi-label blend.
- Card container with `gemini-aura-glow` when `loading` is true.
- 3 cards grid/stack with badges: `[Kabar & Doa]`, `[Bahasan Topik]`, `[Ajak Temu / Çay]`.
- Active card selection and editable textarea for fine-tuning.
- Regenerate button with iteration counter and non-repetition support.
- DualWhatsAppButton integration.

- [ ] **Step 4: Run tests to verify all pass (GREEN)**
Run: `npx vitest run tests/components/AiDraftModal.test.tsx`
Expected: PASS (all tests green).

- [ ] **Step 5: Verify zero TypeScript errors**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/components/crm/AiDraftModal.tsx tests/components/AiDraftModal.test.tsx
git commit -m "feat(crm): redesign AiDraftModal with ios language switcher, 3 draft options and gemini live aura"
```

---

### Task 5: Complete Sapa Rebranding & Full Indonesian Localization

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/kinship/KinshipDashboardView.tsx`
- Modify: `src/components/kinship/KinshipNotificationsView.tsx`
- Modify: `src/components/kinship/KinshipContactDossierModal.tsx`
- Modify: `src/components/kinship/KinshipPhonebookSyncView.tsx`
- Modify: `src/components/kinship/KinshipPulseArc.tsx`
- Modify: `src/components/kinship/KinshipLogInteractionModal.tsx`
- Modify: `src/services/notificationService.ts`
- Modify: `tests/App.test.tsx`
- Modify: `tests/components/KinshipNotificationsView.test.tsx`
- Modify: `tests/components/KinshipDashboardView.test.tsx`
- Modify: `tests/components/KinshipContactDossierModal.test.tsx`
- Modify: `tests/components/KinshipPhonebookSyncView.test.tsx`
- Modify: `tests/components/KinshipComponents.test.tsx`

**Interfaces:**
- Consumes: All UI components and notification services.
- Produces: 100% Indonesian localized and Sapa-branded application.
  - Header logo: Sapa conversational SVG logo (replacing "KS" text monogram).
  - App title: "Sapa" (replacing "Kinship").
  - Term translations:
    - *Upcoming Catch-ups* ➔ `Jadwal Sapaan`
    - *Inbox* ➔ `Kotak Masuk`
    - *Cadence Rules* ➔ `Aturan Ritme`
    - *Today's Reminders* ➔ `Pengingat Hari Ini`
    - *Agenda Minggu Ini* ➔ `Agenda Pekan Ini`
    - *Dossier Relasi* ➔ `Profil Relasi`
    - *Queue & Dispatch Settings* ➔ `Pengaturan Notifikasi & Antrean`
    - *Daily Morning Digest* ➔ `Ringkasan Sapaan Pagi`
    - *Receive Push Notifications* ➔ `Terima Notifikasi Sistem`
    - *Auto-open WhatsApp* ➔ `Buka WhatsApp Otomatis`
    - *Live Sync* ➔ `Sinkron Otomatis`
    - *Sync Phonebook* ➔ `Sinkronisasi Kontak HP`
    - *Kinship Pulse* ➔ `Denyut Sapa`
    - *GrowSphere* in permissions ➔ `Sapa`

- [ ] **Step 1: Update branding and strings in `src/App.tsx`**
Replace KS monogram with SVG Sapa logo, update titles, subtitles, and about card to "Sapa CRM".

- [ ] **Step 2: Update strings in `src/components/kinship/` components and `src/services/notificationService.ts`**
Update all English strings to the localized Indonesian equivalents.

- [ ] **Step 3: Update unit tests to match new Sapa titles and localized strings**
Update tests in `tests/App.test.tsx`, `tests/components/KinshipNotificationsView.test.tsx`, `tests/components/KinshipDashboardView.test.tsx`, `tests/components/KinshipContactDossierModal.test.tsx`, `tests/components/KinshipPhonebookSyncView.test.tsx`, and `tests/components/KinshipComponents.test.tsx`.

- [ ] **Step 4: Run all unit test suites**
Run: `npx vitest run`
Expected: 100% pass across all 26 test suites (277+ tests).

- [ ] **Step 5: Verify zero TypeScript errors**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/ tests/
git commit -m "feat(branding): complete Sapa rebranding and 100% indonesian localization across all screens"
```

---

### Task 6: End-to-End Verification, Android Sync, APK Build & Live Emulator Run

**Files:**
- Verification only

**Interfaces:**
- Consumes: Entire codebase, Android project, emulator `emulator-5554`.
- Produces: Compiled debug APK, installed and running on Android emulator, with live screencaps captured to artifact directory.

- [ ] **Step 1: Run full Vitest suite**
Run: `npx vitest run`
Expected: 26/26 test suites passing.

- [ ] **Step 2: Run production web build and Capacitor sync**
Run: `npm run build && npx cap sync android`
Expected: Clean build in `dist/` and successful Capacitor sync.

- [ ] **Step 3: Compile Android debug APK**
Run: `cd android && ./gradlew assembleDebug && cd ..`
Expected: `BUILD SUCCESSFUL` with output APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 4: Install and launch on Android emulator**
Run:
```bash
adb -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 shell am start -n com.growsphere.crm/.MainActivity
```
Expected: App launches smoothly on Android emulator.

- [ ] **Step 5: Capture live screenshots of Sapa screens**
Capture:
- Sapa Radar View: `adb -s emulator-5554 exec-out screencap -p > /Users/sp/.gemini/antigravity/brain/f94ecbac-410b-43e0-8366-538c9eab2390/android-sapa-radar.png`
- Sapa Jadwal View: `adb -s emulator-5554 exec-out screencap -p > /Users/sp/.gemini/antigravity/brain/f94ecbac-410b-43e0-8366-538c9eab2390/android-sapa-jadwal.png`
- Sapa AI Draft Modal: `adb -s emulator-5554 exec-out screencap -p > /Users/sp/.gemini/antigravity/brain/f94ecbac-410b-43e0-8366-538c9eab2390/android-sapa-ai-modal.png`

- [ ] **Step 6: Self-review and final report**
Review screenshots and git status to confirm all objectives are fulfilled.
