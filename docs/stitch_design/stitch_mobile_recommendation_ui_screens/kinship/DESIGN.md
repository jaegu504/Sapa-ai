---
name: Kinship
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#40000d'
  on-tertiary-container: '#f23d5c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a refined, human-centric approach to personal connection. It blends the intentionality of a productivity tool with the warmth and intimacy of a personal journal. Rather than treating friends and family like transactional enterprise leads, the design evokes thoughtfulness, emotional grounding, and effortless care.

### Design Style & Tone
- **Warm Editorial Modernism:** Grounded in high-legibility typography, deliberate negative space, and tactility.
- **Tone & Mood:** Attentive, calm, deeply personal, and quietly encouraging—never anxious or notification-heavy.
- **Physicality:** Interactive cards feature micro-elevation, subtle paper-like borders, and rounded contours that make personal histories, notes, and reminders feel tangible.

## Colors

The palette establishes an ambient, glare-free foundation with high-contrast text and functional semantic accents.

- **Primary (`#0F172A` - Deep Slate):** Anchors headlines, primary actions, active navigation icons, and key visual weight.
- **Secondary (`#10B981` - Emerald Green):** Denotes active relationship health, successful interactions, confirmed check-ins, and positive cadence states.
- **Tertiary (`#F43F5E` - Coral Rose):** Marks overdue check-ins, neglected relationships, and critical personal alerts, balanced with warm amber (`#F59E0B`) for soft reminders.
- **Neutral (`#64748B` - Slate Grey):** Manages secondary labels, metadata, inactive icons, and structural divider lines.
- **Surface Foundations:** Background canvas utilizes `#F8FAFC` (ambient cream-slate) layered over `#FFFFFF` for primary cards, with subtle fills of `#F1F5F9` for nested modules and input surfaces.
- **Platform Action Accent (`#25D366` - WhatsApp Green):** Reserved exclusively for one-tap messaging actions, communication trigger pills, and chat shortcuts.

## Typography

The type system pairs the friendly geometry of Plus Jakarta Sans for structural headings and interactive labels with the readability of Inter for body text, notes, and logs.

- **Scale & Contrast:** Display headings use tight letter tracking (`-0.02em`) to maintain editorial elegance without feeling cold.
- **Labels & Microcopy:** `label-sm` is uppercase-tracked for relationship tags (e.g., "FAMILY", "INNER CIRCLE", "COLLEAGUE") and relationship cadence intervals ("WEEKLY", "MONTHLY").
- **Notes & Logs:** Body copy maintains a generous 1.5x line-height ratio to make personal anecdotes and interaction histories easily readable on hand-held devices.

## Layout & Spacing

A mobile-first layout logic engineered around natural thumb reach, horizontal swipe affordances, and vertical stack continuity.

- **Column System:** 4-column fluid layout on mobile devices (<640px) expanding to 8 columns on tablet viewports (640px–1024px).
- **Edge Insets:** Fixed 16px (`1rem`) lateral canvas margins ensure interface elements breathe away from hardware screen bezels.
- **Vertical Flow:** Standard element separation uses `space-md` (16px), while grouped narrative sections (e.g., Timeline vs. Notes vs. Contact Details) use `space-xl` (32px).
- **Thumb Zones:** Primary outreach triggers (call, text, WhatsApp actions) reside in bottom-pinned sheet anchors or the lower third of mobile screens.

## Elevation & Depth

Visual hierarchy uses warm, diffuse ambient drop-shadows combined with hairline structural borders to preserve card contrast against pale backgrounds.

- **Canvas (Level 0):** Pure `#F8FAFC`, non-elevated.
- **Card Surface (Level 1):** `#FFFFFF` with a hybrid treatment: a 1px border of `rgba(15, 23, 42, 0.06)` combined with a soft ambient shadow (`box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03)`).
- **Floating Modals & Quick Action Sheets (Level 2):** Elevated via `box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)`.
- **Relationship Health Status Rings:** Soft, glowing radial underlays using 10% opacity tints of `#10B981` (Emerald) or `#F43F5E` (Coral) to surface status without visual clutter.

## Shapes

The interface embraces organic, comfortable corner geometry with unified curvature tokens.

- **Base Radius (0.5rem / 8px):** Applied to form fields, nested micro-cards, and inline status badges.
- **Card Radius (`rounded-lg` / 1rem / 16px):** Standard for timeline feeds, profile overview cards, and modal dialog containers.
- **Pill Radius (`rounded-full` / 9999px):** Strictly applied to interaction chips, status indicators, cadence markers, and floating action buttons.
- **Avatar Profiles:** Squircle geometry with subtle 28% curvature smoothing for a warm, human presentation that departs from generic circular cutouts.

## Components

### Buttons & Quick Triggers
- **Primary Action:** Solid Deep Slate (`#0F172A`) fill with crisp white text (`Plus Jakarta Sans`, 600 weight), pill-rounded (`rounded-full`), min-height 48px for effortless thumb tapping.
- **Secondary Action:** Tinted Slate (`#F1F5F9`) background, `#0F172A` text, 0 border, subtle scale-down on active press.
- **WhatsApp Direct Action:** Dedicated circular or pill button with `#25D366` surface, white icon/text, and soft green glow on active state for direct messaging access.

### Chips & Badges
- **Cadence Badges:** Small pill capsules with a muted neutral background (`#F1F5F9`), uppercase label (`label-sm`), and a 6px status dot (e.g., Emerald for "WEEKLY · ON TRACK", Amber for "BI-WEEKLY · REACH OUT SOON").
- **Filter Tags:** Toggleable pills with transparent borders in unselected states (`rgba(15, 23, 42, 0.12)`) and solid `#0F172A` fill with white text when selected.

### Cards & Feed Tiles
- **Contact Overview Card:** White base, subtle slate stroke, left-side relationship status indicator bar (3px emerald or coral line), user squircle avatar, name, cadence chip, and right-aligned quick-action icons (WhatsApp, Call, Log Note).
- **Note & Memory Card:** Light amber-slate tinted surface (`#FDFEFE`) with an inset left quote line, rendering past interaction notes and key personal details (e.g., partner names, birthdays, gift ideas).

### Input Fields & Controls
- **Search & Filter Inputs:** Fully rounded or `rounded-lg` inputs with an inset magnifying icon, `#F1F5F9` background, `#0F172A` text, and zero default border; focus state introduces a 1.5px `#0F172A` stroke with a soft ring glow.
- **Checkboxes & Segment Controls:** Tactile radio-pill toggles for adjusting cadence frequencies (e.g., "Weekly", "Bi-weekly", "Monthly", "Quarterly").

### Relationship Health Gauge
- A compact UI widget showing last interaction delta (e.g., "3 days ago") paired with a lightweight SVG progress arc colored according to relationship cadence status (Emerald = strong; Amber = approaching check-in; Coral = overdue).