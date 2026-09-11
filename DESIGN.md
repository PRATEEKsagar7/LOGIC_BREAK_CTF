---
name: Cyber Tactical Arena
colors:
  surface: '#0e1511'
  surface-dim: '#0e1511'
  surface-bright: '#343b37'
  surface-container-lowest: '#09100c'
  surface-container-low: '#161d19'
  surface-container: '#1a211d'
  surface-container-high: '#252b28'
  surface-container-highest: '#303632'
  on-surface: '#dde4de'
  on-surface-variant: '#bccac1'
  inverse-surface: '#dde4de'
  inverse-on-surface: '#2b322e'
  outline: '#86948c'
  outline-variant: '#3d4a43'
  surface-tint: '#5bdcae'
  primary: '#5bdcae'
  on-primary: '#003827'
  primary-container: '#03a77c'
  on-primary-container: '#003324'
  inverse-primary: '#006c4f'
  secondary: '#a1d1bb'
  on-secondary: '#053828'
  secondary-container: '#224f3e'
  on-secondary-container: '#90bfaa'
  tertiary: '#dfc573'
  on-tertiary: '#3c2f00'
  tertiary-container: '#c2a95b'
  on-tertiary-container: '#4d3e00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7af9c9'
  primary-fixed-dim: '#5bdcae'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#bdedd6'
  secondary-fixed-dim: '#a1d1bb'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#224f3e'
  tertiary-fixed: '#fce18c'
  tertiary-fixed-dim: '#dfc573'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#564500'
  background: '#0e1511'
  on-background: '#dde4de'
  surface-variant: '#303632'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-desktop: 1.5rem
  gutter-tablet: 1rem
  gutter-mobile: 0.75rem
  margin-desktop: 2rem
  margin-tablet: 1.5rem
  margin-mobile: 1rem
---

## Brand & Style

This design system delivers a high-precision, tactical command center experience tailored for cybersecurity competitions, threat monitoring, and live security operations. It targets ethical hackers, security analysts, and enterprise SOC teams who require low eye-strain environments under extended operations alongside instantaneous visual prioritization.

The design movement combines **Tactical Modernism** with crisp telemetry influences:
- **Atmosphere:** Controlled, deep-space operational darkness. Surfaces are layered slate and muted charcoal, preserving depth and optical hierarchy.
- **Signal Ratio:** Restrained, purposeful illumination. Color is never decorative; sophisticated emeralds and warm amber accents exist strictly as signal indicators, active telemetry, high-value alerts, and kinetic interactive triggers.
- **Precision:** Elegant typographic scale with serif editorial headlines paired with monospace data overlays, structured borders, and refined alignment that evokes high-end security instrument panels.

## Colors

The palette establishes an authoritative, high-contrast dark environment designed around luminescence tiers.

### Surface System
- **App Canvas (Base):** `#727974` (Primary viewport ground)
- **Sub-Surface / Deep Canvas:** `#53806D` (Inset regions, terminal backgrounds, collapsed toolbars)
- **Card Surface Tier 1:** `#03A77C` (Standard container panels, operational dashboards, data feeds)
- **Card Surface Tier 2 (Elevated / Interactive Hover):** `#FFE38E` (Modal overlays, flyouts, active card focus)
- **Structural Stroke / Dividers:** `#53806D` (Precision outlines, container boundaries, grid lines)

### Typography & Content
- **Primary Text:** `#FFFFFF` (Headings, primary values, active states)
- **Secondary Text:** `#FFE38E` (Descriptions, labels, contextual captions, passive telemetry)
- **Muted Text / Placeholder:** `#53806D` (Disabled nodes, empty states, structural markers)

### Accent & Telemetry Spectrum
- **Primary Accent:** `#03A77C` (High-priority action items, live flag capture indicators, kinetic highlight flashes)
- **Secondary Accent:** `#53806D` (Standard CTAs, secured states, verified status markers)
- **Tertiary Accent:** `#FFE38E` (Real-time telemetry, terminal stream logs, numeric scores)
- **Warning Alert:** `#F59E0B` (Vulnerability warnings, expiring timers)
- **Critical Breach:** `#EF4444` (Compromised nodes, failed submissions, system alerts)

## Typography

The typographic hierarchy enforces a division between macro structure, human discourse, and machine telemetry:

- **Headlines (Bodoni Moda):** Delivers an editorial, high-contrast, sharp-edged industrial demeanor. Used for system titles, leaderboard headers, arena modules, and major score tallies.
- **Body & Interface (Geist):** Clean, modern, hyper-legible sans-serif dedicated to high-density content, briefing manuals, instructions, and multi-paragraph technical logs.
- **Telemetry & Metatags (JetBrains Mono):** Monospaced type for all numerical statistics, timestamps, IP addresses, hashes, status pill text, terminal commands, and telemetry readings.

Uppercase transformation paired with wide letter-spacing (`0.04em` to `0.06em`) is mandatory for `label-md` and `label-sm` indicators to reinforce military-grade operational instrumentation.

## Layout & Spacing

The layout model implements a structured 12-column dynamic fluid grid architecture designed for mission control monitoring:

- **Desktop (> 1024px):** 12-column grid, `margin-desktop` (2rem / 32px), `gutter-desktop` (1.5rem / 24px). Layout emphasizes persistent operational context.
- **Tablet (768px – 1023px):** 8-column grid, `margin-tablet` (1.5rem / 24px), `gutter-tablet` (1rem / 16px).
- **Mobile (< 768px):** 4-column grid, `margin-mobile` (1rem / 16px), `gutter-mobile` (0.75rem / 12px).

Spacing rhythm follows a strict modular base. Components prioritize density over generous empty space.

## Elevation & Depth

Visual hierarchy uses physical-plane layering and luminous back-glow rather than traditional diffuse drop shadows. Differentiation is driven by tonal stratification and perimeter refraction:

- **Base Floor (`#727974`):** Non-elevated viewport ground.
- **Layer 1 Surface (`#03A77C`):** Resting cards and containers. Defined by a crisp perimeter border.
- **Layer 2 Surface (`#FFE38E`):** Popovers, dropdown menus, focused card states, and active modal dialogs.

## Shapes

The design system employs a balanced, moderately rounded geometry (`roundedness: 2`).

- **Base Radii (`0.5rem` / 8px):** Applied to badges, inputs, buttons, chips, tabs, checkboxes, and inline status metrics.
- **Container Radii (`1rem` / 16px):** Standard for cards, modal panels, table wrappers, and terminal stream frames.
- **Max Surface Radii (`1.5rem` / 24px):** Reserved solely for primary full-screen dialogue viewports.

## Components

### Buttons
- **Primary CTA:** Background `#03A77C`, text `#FFFFFF`, font JetBrains Mono 12px weight 600, uppercase.
- **Secondary CTA:** Background `#53806D`, text `#FFFFFF`, border `1px solid #53806D`.
- **Ghost / Destructive:** Background transparent, text `#FFE38E`.

### Chips & Badges
- **Status Indicator:** Height 24px, padding 2px 8px, border-radius 8px, font JetBrains Mono 11px uppercase.

### Input Fields & Terminal Consoles
- **Standard Input:** Background `#53806D`, border `1px solid #53806D`, text `#FFFFFF`, font Geist 14px. Radius 8px.
- **Terminal Prompt Line:** Monospace input prefix rendered in `#03A77C`, font JetBrains Mono 13px.

### Cards & Panels
- Resting surface `#03A77C` bounded by structural borders, radius 16px. Internal padding 20px.

### Selection Controls
- **Checkbox:** 16x16px square, radius 4px. Resting: `#53806D`. Checked: `#03A77C` background.
- **Radio:** 16x16px circle. Selected: `#03A77C` border with centered core dot.