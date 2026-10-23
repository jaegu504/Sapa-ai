# Sapa — First-Run Guided Tutorial (Design)

Date: 2026-10-23 · Status: draft for approval · App version at time of writing: 1.0.3

## Intent and why

The owner is about to share the Sapa APK with 100–200 friends. Today a new user only sees a 3-slide feature intro (`src/components/onboarding/OnboardingModal.tsx`) and is then dropped into a fairly advanced CRM. The owner wants new users to understand how to use Sapa **without asking the owner**. Success = a friend installs Sapa, follows the tutorial once, and ends up having added a real contact, understood the contact fields (especially "possible follow up"), generated an AI draft, and opened WhatsApp with that draft.

The owner also hit a real problem on a Xiaomi phone: contact and notification permissions were not prompted, and had to be enabled manually in system settings. The tutorial must request both permissions up front and give a way out when the OS does not show the prompt.

## Goals

1. Show the tutorial **only on first install** (and when the user explicitly replays it).
2. Flow, in order:
   1. **Welcome** — what Sapa is for (one screen, "Lanjutkan").
   2. **Feature overview** — the existing 3 slides (Denyut Silaturahmi; Sapa via WhatsApp + Draf AI; Pengingat Pagi), lightly refreshed.
   3. **Permissions** — request Contacts and Notifications, each with its own "Izinkan" button that triggers the real Android prompt. If denied, or the prompt never appears, show **"Buka Pengaturan"** that opens Sapa's Android app-settings page. When the user returns to the app, re-check status and update the card.
   4. **Guided tour with spotlight on the real UI** (screen dimmed, one real element highlighted, a tooltip card with step counter "Langkah X dari N"):
      1. Home / **Radar** tab — what the radar shows.
      2. **Kontak** tab.
      3. **Tambah Kontak** and **Impor HP** buttons. Tooltip says this is for the tutorial: *add or import one real contact, then pick one contact to practice with.*
      4. User taps a contact → contact detail (dossier). Fields explained one by one, in order:
         - Pertama Ketemu & Konteks
         - Pembaruan Kabar Terakhir
         - **Bahan Obrolan Follow Up Berikutnya** (= "Possible Follow Up") — explained in the most detail: what to write there and that the AI draft uses it.
         - Jadwal Follow Up Khusus (alarm/notification) and Ritme Sapa (hari)
      5. **Jadwal** tab — a brief, single spotlight (morning digest + scheduled follow-ups). Kept short; owner said it is not very important.
      6. **✨ Draf AI** on the chosen contact → pick one of the 3 drafts.
      7. **Kirim via WhatsApp** / **Kirim via WhatsApp Business** highlighted. Opening either one = **tutorial complete** ("Tutorial selesai 🎉").
3. **"Lewati"** button at the top of every tutorial screen and tour step. Skipping ends the tutorial permanently (until replay).
4. **"Ulangi Tutorial"** entry in Pengaturan that restarts the tutorial from the welcome screen.
5. All copy in Indonesian, consistent with the app's existing tone.

## Non-goals

- Pengaturan tab is **not** part of the tour (owner: not important).
- No tutorial on iOS / web specifics (no iOS build planned).
- No analytics/telemetry on tutorial completion.
- No sample/fake contact. The tutorial uses the user's **real** contact.

## Anti-goals (failure even if it "works")

- The tutorial reappears for someone who finished or skipped it.
- Any message is sent automatically. Sapa only opens WhatsApp with the draft pre-filled; the user decides to send. The tooltip should say so.
- The tour gets the user stuck (e.g. spotlighting an element that is not on screen, or no way forward when a step cannot be completed). "Lewati" must always work.
- Existing data is touched or lost.

## Decisions made (owner's)

- Real contact, chosen by the user, labelled as "untuk tutorial".
- Order: Welcome → features → permissions → Radar → Kontak → add/import → contact fields (possible follow up emphasized) → Jadwal (brief) → Draf AI → WhatsApp → done.
- Lewati at the top, optional.
- Ulangi Tutorial in Pengaturan.
- Permissions are asked at the start.

## Decisions made by Claude (owner may override)

- **Advancing the tour:** on steps that ask for an action (add/import contact, open a contact, open Draf AI, pick a draft, open WhatsApp) the user advances by **tapping the real element**. Explanation-only steps (tab descriptions, contact fields) advance with a "Berikutnya" button on the tooltip.
- **Completion signal:** opening WhatsApp/WhatsApp Business from the tutorial step counts as done. Sapa cannot know whether the message was actually sent.
- **Existing users:** users who already completed the old 3-slide onboarding (`localStorage['sapa_onboarding_completed'] === 'true'`) do **not** get the new tutorial after updating. They can start it from "Ulangi Tutorial".
- **Interrupted tutorial:** if the app is closed mid-tour, it resumes at the last step on next launch. If the step's precondition no longer holds (e.g. the chosen contact was deleted), fall back to the nearest earlier step that makes sense (e.g. "pilih kontak").
- **Permission step never blocks:** user can continue even if a permission is denied (with a short note that reminders/import won't work until it is enabled).
- **Back to the contact after Jadwal:** after the brief Jadwal step, the tour reopens the chosen contact's detail screen automatically and spotlights ✨ Draf AI (no extra "tap the contact again" step).
- **"Bahan Obrolan Follow Up" step:** the tooltip invites the user to type one line (and says this edits their real contact). Optional: "Berikutnya" is always available. If the field is empty, the Draf AI step notes the draft will be more personal once it is filled. The field saves on blur, so the tour must make sure the value is saved before moving on.
- **Already has contacts** (e.g. on replay): step 3 says "pilih satu kontak untuk latihan" and the user can pick an existing contact without adding a new one.

## Constraints / context for the builder

- Stack: React 18 + TypeScript + Vite + Tailwind, Capacitor 8 Android. Single big shell in `src/App.tsx` (~1.400 lines) holding tab state (`activeTab`: `radar | contacts | notifications | settings`) and modal state (`selectedContact` → `KinshipContactDossierModal`, `draftContact` → `AiDraftModal`, `isSyncOpen` → `KinshipPhonebookSyncView`, `isEditModalOpen` → `EditContactModal`, `isOnboardingOpen` → `OnboardingModal`).
- Real targets already have stable labels: `aria-label="Tambah Kontak Baru"`, `"Impor Kontak Telepon"` (App.tsx ~760–770), WhatsApp buttons `"Kirim via WhatsApp"` / `"Kirim via WhatsApp Business"` (`DualWhatsAppButton.tsx`), dossier fields `htmlFor="dossier-met-context" | "dossier-last-notes" | "dossier-topic" | "dossier-next-followup" | "dossier-cycle-days"`, Draf AI button in the dossier action row, nav tabs from `App.tsx` ~344.
- Permissions: `requestNotificationPermission()` (`src/services/notificationService.ts`) and the contacts plugin's `checkPermissions/requestPermissions` used inside `getDeviceContactsWithStatus()` (`src/services/nativeContactsAdapter.ts`). Manifest already declares READ_CONTACTS and POST_NOTIFICATIONS.
- **Opening Android app settings is not available today.** It needs a small native method (e.g. add `openAppSettings` to the existing `WhatsAppLauncherPlugin.java` using `Settings.ACTION_APPLICATION_DETAILS_SETTINGS`) or an existing Capacitor plugin. No new heavy dependency.
- Existing onboarding storage key: `sapa_onboarding_completed`. Tests run with Vitest + Testing Library (currently 335 passing); new logic needs tests.
- Light and dark (glass) themes both exist; tutorial UI must look right in both.
- After implementation: bump version and publish a GitHub Release (pre-authorized by the owner).

## Left to the builder

- Spotlight implementation (own lightweight component vs. existing library — prefer no new dependency), positioning, scroll-into-view, animation.
- Exact tooltip copy (Indonesian, short, warm), as long as the "possible follow up" step is the most thorough and the WhatsApp step says nothing is sent automatically.
- Storage format for tutorial state (completed/skipped/current step).
- How the welcome/features/permissions screens are built (extend `OnboardingModal` or replace it).
