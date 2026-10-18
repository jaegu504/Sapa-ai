# Apple iOS 18 Light & VisionOS Dark Glassmorphism with Floating Bubble Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

### Goal
Transform the **Sapa** application UI into an ultra-modern **Apple iOS 18 / VisionOS Glassmorphic** aesthetic, featuring:
1. **Full Dark Mode & Light Mode support** (iOS 18 Light Glass for day, VisionOS Dark Glass for night/dark, plus system preference detection).
2. **Floating Bubble / Floating Island Bottom Navigation** (`BottomNavBar`) hovering gracefully with high-blur frosted glass, rounded-full pill geometry, and safe scroll padding.
3. **Custom Premium SVG Vector Icons** for bottom tabs (Radar, Kontak, Jadwal, Atur) crafted with crisp Apple SF-Symbols style.
4. **Authentic Vector Logos** preserved for both WhatsApp and WhatsApp Business buttons with liquid glass styling.
5. **Apple Activity Ring** style for Kinship Pulse Arc, Bento Box cards, and continuous squircles.
6. **100% test pass rate** with zero regressions across all 26 test suites / 296+ tests.

---

### File Decomposition

| File Path | Responsibility |
| :--- | :--- |
| `tailwind.config.js` | Configures `darkMode: 'class'`, custom glassmorphic colors, backdrop blurs, and Apple continuous squircle radii |
| `src/services/themeService.ts` | Theme state manager (`light`, `dark`, `system`), localStorage persistence, and DOM class toggle |
| `tests/services/themeService.test.ts` | Unit tests for theme preference saving, loading, and system media query listener |
| `src/components/ui/NavIcons.tsx` | Pure SVG vector components for Radar, Kontak, Jadwal, and Atur (Settings) |
| `tests/components/NavIcons.test.tsx` | Tests ensuring all NavIcons render as valid SVG elements with proper viewBox and classNames |
| `src/components/ui/BottomNavBar.tsx` | Redesigned floating frosted capsule nav bar with glass blur, active indicator, and SVG icons |
| `src/components/kinship/DualWhatsAppButton.tsx` | Liquid glass styling polish with authentic WhatsApp & WhatsApp Business SVG vector logos |
| `src/components/kinship/KinshipPulseArc.tsx` | Apple Fitness activity ring glow styling, dark mode stroke, and frosted bento stat pills |
| `src/components/kinship/CadenceBadge.tsx` | Apple capsule status badge supporting dark/light translucent pastels while retaining test contract |
| `src/components/kinship/KinshipDashboardView.tsx` | Apple Glassmorphism makeover: ambient mesh glow, squircle cards, Apple Notes topic box, segmented controls |
| `src/App.tsx` | Integrates theme state, renders Theme Switcher in Settings tab, wires floating dock and safe bottom padding |
| `tests/App.test.tsx` | Full integration tests verifying theme switching, tab navigation, and modal flows |

---

### Tasks

#### Task 1: Theme State Management & Tailwind Dark Mode Configuration
- [ ] Add `darkMode: 'class'` and glassmorphic design tokens into `tailwind.config.js`.
- [ ] Write failing unit tests in `tests/services/themeService.test.ts` testing `getThemePreference()`, `setThemePreference()`, and `applyTheme()`.
- [ ] Implement `src/services/themeService.ts` handling `'light' | 'dark' | 'system'` and DOM class toggle (`dark` class on `document.documentElement`).
- [ ] Run `npx vitest run tests/services/themeService.test.ts` and ensure all pass (GREEN).
- [ ] Commit: `git add tailwind.config.js src/services/themeService.ts tests/services/themeService.test.ts && git commit -m "feat(theme): configure tailwind dark mode and implement themeService"`

#### Task 2: Premium SVG Vector Icons & Floating Glass Dock Navigation
- [ ] Create `src/components/ui/NavIcons.tsx` exporting pure SVG vector components: `RadarNavIcon`, `ContactsNavIcon`, `ScheduleNavIcon`, and `SettingsNavIcon`.
- [ ] Write tests in `tests/components/NavIcons.test.tsx` verifying all icons render as SVG with proper viewBox and props.
- [ ] Refactor `src/components/ui/BottomNavBar.tsx` into a **Floating Frosted Capsule**:
  - `fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 rounded-full px-4 py-2.5`
  - Translucent glassmorphic background: `bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl`
  - Specular rim border: `border border-white/90 dark:border-white/15`
  - Subtle shadow: `shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6)]`
  - Active tab indicator with smooth pill highlight and vibrant icon tint.
- [ ] Update `tests/components/UiComponents.test.tsx` to verify floating dock behavior.
- [ ] Run `npx vitest run tests/components/NavIcons.test.tsx tests/components/UiComponents.test.tsx`.
- [ ] Commit: `git add src/components/ui/NavIcons.tsx src/components/ui/BottomNavBar.tsx tests/components/NavIcons.test.tsx tests/components/UiComponents.test.tsx && git commit -m "feat(nav): implement floating frosted glass dock and crisp svg nav icons"`

#### Task 3: DualWhatsAppButton Liquid Glass Polish with Authentic Logos
- [ ] Verify `WhatsAppIcon` and `WhatsAppBusinessIcon` SVG vector paths in `src/components/kinship/DualWhatsAppButton.tsx`.
- [ ] Add dark mode support and liquid glass polish:
  - Regular WhatsApp: Apple vibrant green `#25D366` with specular highlight.
  - WhatsApp Business: Obsidian slate in light (`bg-slate-900`), frosted glass in dark (`dark:bg-white/15 dark:hover:bg-white/20 dark:border dark:border-white/20`).
- [ ] Run `npx vitest run tests/components/KinshipComponents.test.tsx` and verify test suite passes.
- [ ] Commit: `git add src/components/kinship/DualWhatsAppButton.tsx && git commit -m "feat(ui): polish DualWhatsAppButton with dark glass styling and authentic vector logos"`

#### Task 4: Apple Activity Ring & Status Badges Modernization
- [ ] Update `src/components/kinship/KinshipPulseArc.tsx`:
  - Apple Watch / Activity style dual gradient progress arc with rounded cap.
  - Drop-shadow glow (`drop-shadow-[0_2px_8px_rgba(52,199,89,0.4)]` in light, `drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]` in dark).
  - Bento stat pills with frosted glass material.
- [ ] Update `src/components/kinship/CadenceBadge.tsx`:
  - Retain `data-testid="cadence-dot"` and `data-color` for backwards test compatibility.
  - Add dark mode classes for soft jewel/translucent capsule look.
- [ ] Run `npx vitest run tests/components/KinshipComponents.test.tsx` and verify 100% pass.
- [ ] Commit: `git add src/components/kinship/KinshipPulseArc.tsx src/components/kinship/CadenceBadge.tsx && git commit -m "feat(ui): modernize KinshipPulseArc as apple activity ring and cadence badge with dark mode"`

#### Task 5: KinshipDashboardView (Radar) Apple Glassmorphic Makeover
- [ ] Update `src/components/kinship/KinshipDashboardView.tsx`:
  - Add ambient liquid blur mesh behind the screen (`bg-blue-400/20`, `bg-emerald-400/15`).
  - Large Title header with circular frosted glass icon buttons.
  - Contact cards with `rounded-[28px]`, squircle initials avatar with status ring, Apple Notes style topic box (`bg-white/70 dark:bg-white/5 border border-white/90 dark:border-white/10`).
  - Segmented control filter tabs with Apple liquid pill slider (`p-1 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl`).
- [ ] Run `npx vitest run tests/components/KinshipDashboardView.test.tsx` and verify 100% pass.
- [ ] Commit: `git add src/components/kinship/KinshipDashboardView.tsx && git commit -m "feat(ui): transform KinshipDashboardView into apple glassmorphism bento layout"`

#### Task 6: App Shell Integration, Theme Switcher & Full Verification
- [ ] In `src/App.tsx`:
  - Add `theme` state (`'light' | 'dark' | 'system'`) and initialize with `themeService.initTheme()`.
  - Add Theme Selector in Settings tab: 3 radio chips for `Terang (iOS 18 Light Glass)`, `Gelap (VisionOS Dark Glass)`, and `Otomatis (Sistem)`.
  - Replace navigation tab icons with the new `RadarNavIcon`, `ContactsNavIcon`, `ScheduleNavIcon`, and `SettingsNavIcon`.
  - Add safe bottom padding `pb-28` to ensure floating dock never overlaps content.
  - Apply dark mode background and text classes across `App.tsx` shell and modals.
- [ ] Verify `npx tsc --noEmit` has 0 errors.
- [ ] Run `npx vitest run` and confirm 100% pass rate across all 26+ test suites.
- [ ] Run `npm run build && npx cap sync android` to ensure web and Android bundles compile cleanly.
- [ ] Build Android debug APK (`cd android && ./gradlew assembleDebug && cd ..`), install to emulator, and capture live screenshots in both Light and Dark mode.
- [ ] Commit: `git add src/ tests/ && git commit -m "feat(app): complete apple glassmorphism and dark mode integration with live verification"`
