# AGENTS.md — Sapa (Personal CRM)

Shared project notes for every AI coding agent working in this repo (Claude Code, Antigravity, others).
Read this first. Keep it up to date when something here changes.

## What this is

**Sapa** (formerly "GrowSphere") is a local-first personal relationship CRM for keeping in touch
(silaturahmi) with family, teachers (Hoca), friends (Ihvan) and colleagues. Android app built with
Capacitor; UI in **Indonesian and Turkish** (Pengaturan → Bahasa), AI drafts in both.

- Repo: `github.com/jaegu504/Sapa-ai` (**public** — never commit secrets).
- Android app id: `com.growsphere.crm`, display name "Sapa".
- Users: the owner shares the APK directly with ~100–200 friends (not on Play Store).
- Current version: see `CURRENT_APP_VERSION` in `src/services/updateService.ts` (v1.5.1 at time of writing).

## Stack

React 18 + TypeScript + Vite + Tailwind 3 (light + dark "glass" theme, `dark:` classes), Dexie 4
(IndexedDB) for all contact data, Capacitor 8 (Android), Vitest + Testing Library, `motion` (iOS-style
animations). Capacitor plugins: contacts, local-notifications, app (back button), haptics, filesystem + share (backup).
Node is installed at `~/.local/bin`. JDK 21: `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`.

## Commands

```bash
npm run dev          # http://localhost:5173 (also .claude/launch.json "sapa-dev"); add ?noanim when the preview tab is in the background (animations pause there)
npx vitest run       # full test suite (~315 tests) — must be green before any release
npx tsc --noEmit     # typecheck
npm run build && npx cap sync android
cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Code map

- `src/App.tsx` — app shell: tabs (`radar`, `contacts`, `notifications`=Jadwal, `settings`), sheet/modal state, save handlers,
  Android back button (`useAndroidBack`: closes the top sheet, then returns to Radar, then exits).
- `src/components/kinship/` — main UI: `KinshipDashboardView` (Radar Sapa), `ContactsView` (list, chips, swipe right = label),
  `KinshipNotificationsView` (Jadwal: Hari ini / Minggu ini / Nanti), `KinshipContactDossierModal` (profile sheet),
  `SapaActionSheet` (green Sapa button: AI / WhatsApp / Business), `LabelPickerSheet`, `ResyncDialog`, `VoiceNoteModal`,
  log interaction, phonebook import.
- `src/components/settings/` — `SettingsView` (iOS grouped list) and `LabelManagerSheet` (add/rename/remove labels inline).
- `src/components/crm/` — `AiDraftModal` (Draf AI sheet) and `EditContactModal`; the rest of the old UI was deleted in v1.4.0.
- `src/components/ui/` — `Sheet` (bottom sheet with spring + drag-to-close, `useSticky`), `EmptyState`, `SplashScreen`,
  `BottomNavBar` (equal grid columns so the mic is centered), `Toast`, `AppUpdateModal`, `NavIcons`.
- `src/components/onboarding/` + `src/components/tutorial/` — first-run intro, permission step, spotlight tour.
- `src/services/` — `aiDraftService` (Draf AI), `voiceNoteService`, `speechService`, `notificationService`,
  `nativeContactsAdapter`, `contactService` (import, `resyncPhoneContacts`, `deleteContacts`), `backupService`,
  `settingsService` (default rhythm), `haptics`, `permissionService`, `labelService`, `tutorialService`, `updateService`, `themeService`.
- `src/utils/` — phone normalization, status/cadence, `display` (initials, due labels, Indonesian dates), WhatsApp URLs, `contactFilters`.
- `android/app/src/main/java/com/growsphere/crm/WhatsAppLauncherPlugin.java` — custom native plugin:
  `openWhatsApp`, `openAppSettings`, `recognizeSpeech` (phone's speech recognizer via RecognizerIntent).
- `cloudflare-worker/worker.js` — AI proxy (see below).
- `docs/superpowers/specs|plans/` — design specs and implementation plans.

## Data model notes

- `Contact` (`src/types/crm.ts`): `lastUpdateNotes` = Pembaruan Kabar Terakhir, `possibleFollowUpTopic` = Bahan Obrolan
  Follow Up, `nextSpecificFollowUp` = `YYYY-MM-DDTHH:MM` (default time 09:00), `facts?: {text, date}[]` = Fakta Penting.
- When a voice note replaces the kabar, the old kabar is saved to the interaction timeline (`crmDb.interactions`).
- Labels (Asosiasi) come only from `labelService` (localStorage `sapa_labels`, defaults Ihvan/Hoca/Keluarga/Zahiri/Teman/Profesional).
  Rename/remove remaps every contact (`handleRemapLabel` in App). Do not hardcode label lists again.
- `source?: 'phone' | 'manual'` marks contacts from the phone list. Only `phone` contacts can be offered for removal by
  the phone re-sync, and only on native with the full list, always after a confirmation dialog. Imports never overwrite
  a contact's existing name, notes or schedule (labels are only added). Contacts from before v1.4.0 have no `source`
  until the next sync, so they are never removed.
- Backups: `backupService` (version 2 file with contacts, interactions, labels). On the phone, export goes through the
  share sheet (Filesystem cache + Share); restore merges by id. A backup/restore path must exist before any keystore change.
- No Dexie schema change is needed for new non-indexed fields.

## AI

- Proxy: `https://sapa-ai.jaegu108.workers.dev/` (Cloudflare Worker). Groq `openai/gpt-oss-120b` first, Gemini fallback.
- Keys live only as Cloudflare secrets `GROQ_API_KEY` / `GEMINI_API_KEY`. **Never hardcode keys** — an old Groq key leaked
  in git history and had to be rotated. The repo has no wrangler config: the owner deploys the worker by pasting
  `worker.js` in the Cloudflare dashboard.
- The worker's Groq system prompt asks for a **JSON array**, so every prompt must return a JSON array
  (voice notes return `[ { ... } ]`).
- Draf AI prompt includes today's date, a code-computed follow-up timing (`describeFollowUpTiming`) and an explicit
  sender/recipient roles rule. Keep these: they fix "AI thinks the event is still next week" and "AI mixes up aku/dia".
- Free AI quota is shared by all users: avoid extra AI calls; prefer code for anything deterministic (dates, name matching).
- Privacy: the contact list never goes to the AI. Voice-note name matching is local (`rankContactsByName`).

## Release routine (owner pre-authorized: no need to ask)

After a change is done and tests pass:
1. Bump version in `package.json`, `package-lock.json` (root + `packages[""]`), `src/services/updateService.ts`
   (`CURRENT_APP_VERSION`), `android/app/build.gradle` (`versionCode` +1, `versionName`).
2. `npx vitest run`, build web, `npx cap sync android`, `assembleRelease`.
3. Verify the APK: `aapt2 dump badging` shows the new version; `apksigner verify --print-certs` SHA-256 must be
   `22ffc94829f77abb8707e7bcc5360b7c643c674f25f8e01474e5feb5bc8e9648`.
4. Commit, tag `vX.Y.Z`, push `main` + tag.
5. Create the GitHub Release (Indonesian notes) and upload `sapa-ai-vX.Y.Z.apk`. No `gh` CLI here: use the GitHub API
   with the token from `git credential fill`.
6. Rewrite repo-root `latest.json` from the release (tag_name, name, body, html_url, published_at,
   assets[{name, browser_download_url}]) and push it. The app reads it from raw.githubusercontent.com first because the
   unauthenticated releases API (60 checks/hour per IP) runs out on shared WiFi/carrier IPs.

## Rules and gotchas

- **Signing**: releases are signed with the debug keystore (`~/.android/debug.keystore`). Changing the key makes users
  uninstall to upgrade, which **deletes their local data**. Never change it without a backup/migration plan agreed with the owner.
- Tutorial: anchors are `data-tour="..."` attributes on real elements; steps live in `TOUR_STEPS`
  (`tutorialService.ts`). Adding/removing a step changes the step-count test. New user-facing features should get a step.
- localStorage access is always wrapped in try/catch.
- **Translations**: every user-facing text goes through `t('Indonesian text', { vars })` from `src/i18n`.
  The Indonesian text is the key; add its Turkish version to `src/i18n/tr.ts`. `tests/i18n.test.ts` fails when a
  literal `t()` text has no Turkish entry. Data-driven texts (tutorial steps, option lists) are translated where they
  render (`t(step.title)`). Changing language remounts the app tree (key = language) behind a short greeting overlay.
  Dates use `utils/display` (Indonesian/Turkish day and month names). Contact labels are user data: not translated.
- New contacts can also be saved to the phone address book (`saveToPhoneContacts`, create only, no edit/delete sync);
  they are then marked `source: 'phone'`. Local numbers "05xx…" (11 digits) are treated as Turkish (+90).
- UI style: no emoji as icons (lucide SVG only; the ID/TR flag emoji in Draf AI are the agreed exception). No time zone
  labels ("WIB"): users are in Turkey and Indonesia, times follow the phone. Tailwind opacity steps are 5/10/15/20...
  (`/12` does not exist). Sheets use `Sheet`; centered modals use `animate-rise`. Tests set `MotionGlobalConfig.skipAnimations`.
- Do not edit the same files from two agents at the same time; commit before switching tools.

## Known open items

- Play Protect warns on install (unknown developer, debug signing). Options discussed: Android developer verification /
  Play Store (one-time ~$25), which requires a new release keystore.
- Not yet tested on a real phone: Turkish voice input; v1.4.0 back button, haptics, backup share sheet, swipe-to-label, re-sync.
- Not yet checked by a native Turkish speaker: the Turkish UI texts (`src/i18n/tr.ts`).
- `README.md` is outdated (old name, old AI engine).
