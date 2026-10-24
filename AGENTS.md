# AGENTS.md — Sapa (Personal CRM)

Shared project notes for every AI coding agent working in this repo (Claude Code, Antigravity, others).
Read this first. Keep it up to date when something here changes.

## What this is

**Sapa** (formerly "GrowSphere") is a local-first personal relationship CRM for keeping in touch
(silaturahmi) with family, teachers (Hoca), friends (Ihvan) and colleagues. Android app built with
Capacitor; UI copy is **Indonesian** (AI drafts also support Turkish).

- Repo: `github.com/jaegu504/Sapa-ai` (**public** — never commit secrets).
- Android app id: `com.growsphere.crm`, display name "Sapa".
- Users: the owner shares the APK directly with ~100–200 friends (not on Play Store).
- Current version: see `CURRENT_APP_VERSION` in `src/services/updateService.ts` (v1.3.0 at time of writing).

## Stack

React 18 + TypeScript + Vite + Tailwind 3 (light + dark "glass" theme, `dark:` classes), Dexie 4
(IndexedDB) for all contact data, Capacitor 8 (Android), Vitest + Testing Library.
Node is installed at `~/.local/bin`. JDK 21: `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`.

## Commands

```bash
npm run dev          # http://localhost:5173 (also .claude/launch.json "sapa-dev")
npx vitest run       # full test suite (~380 tests) — must be green before any release
npx tsc --noEmit     # typecheck
npm run build && npx cap sync android
cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Code map

- `src/App.tsx` — app shell: tabs (`radar`, `contacts`, `notifications`=Jadwal, `settings`), modal state, save handlers.
- `src/components/kinship/` — current UI: Radar dashboard, contact dossier (profile), log interaction, phonebook import, `VoiceNoteModal`.
- `src/components/crm/` — older UI; `AiDraftModal`, `EditContactModal`, `NavigationDrawer` (☰ menu) are still used, others are legacy.
- `src/components/onboarding/` + `src/components/tutorial/` — first-run intro, permission step, spotlight tour.
- `src/services/` — `aiDraftService` (Draf AI), `voiceNoteService` (voice note → fields), `speechService`,
  `notificationService`, `nativeContactsAdapter`, `permissionService`, `labelService`, `tutorialService`, `updateService`, `themeService`.
- `src/utils/` — phone normalization, status/cadence, WhatsApp URLs + native plugin type, `contactFilters`.
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
- Do not edit the same files from two agents at the same time; commit before switching tools.

## Known open items

- Play Protect warns on install (unknown developer, debug signing). Options discussed: Android developer verification /
  Play Store (one-time ~$25), which requires a new release keystore.
- Not yet tested on a real phone: Turkish voice input, label rename dialog (`window.prompt`) in the Android WebView.
- `README.md` is outdated (old name, old AI engine).
