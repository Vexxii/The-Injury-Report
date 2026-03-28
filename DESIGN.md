# Design System — The Injury Report

## Product Context
- **What this is:** A fantasy football injury comparables engine. Search any NFL player + injury and get ranked historical comparables with a data-driven hold/sell verdict.
- **Who it's for:** Competitive fantasy football managers in money leagues ($50-500+ buy-in) who research injuries but lack a reliable tool.
- **Space/industry:** Fantasy football tools. Peers: FantasyPros, Draft Sharks, Sports Injury Central (SIC Score). None do post-injury comparables.
- **Project type:** Single-page web app (Next.js)

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian
- **Decoration level:** Minimal — typography and color do the work. No gradients, no decorative elements, no illustrations. The data IS the decoration.
- **Mood:** A data-confident tool that gives you the answer, not a playground to explore. Think "analyst's workstation" not "sports entertainment app." Authoritative, precise, unsentimental.
- **Reference sites:** Sleeper (only well-designed fantasy tool), Bloomberg Terminal (energy/authority), editorial longform (typography hierarchy)

## Typography
- **Display/Hero:** Instrument Serif — editorial authority, unusual for the category, immediately signals "this is different." Used for product name, player names in cards, section titles.
- **Body:** DM Sans — clean geometric sans with tabular-nums support, reads well at small sizes in data-dense layouts. Used for verdict text, descriptions, UI labels, button text.
- **UI/Labels:** DM Sans (same as body)
- **Data/Tables:** JetBrains Mono — computed-feeling numbers, monospace match percentages and stats. Used for match percentages, stat values, data labels, injury pills, metadata.
- **Code:** JetBrains Mono
- **Loading:** Instrument Serif via `next/font/local` (local TTF files in `src/fonts/`), DM Sans and JetBrains Mono via `next/font/google`
- **Scale:**
  - `xs`: 11px / 0.6875rem — metadata, fine print
  - `sm`: 13px / 0.8125rem — labels, captions
  - `base`: 15px / 0.9375rem — body text, descriptions
  - `lg`: 18px / 1.125rem — stat values, emphasized body
  - `xl`: 22px / 1.375rem — player names (Instrument Serif)
  - `2xl`: 28px / 1.75rem — verdict word (JetBrains Mono, bold)
  - `3xl`: 36px / 2.25rem — page title (Instrument Serif)
  - `4xl`: 42px / 2.625rem — hero title (Instrument Serif)

## Color

### Approach
Restrained. Dark-primary with light mode support. One accent color (burnt orange) used sparingly: logo mark and search button only. Verdict colors (green/amber/red) are the primary semantic palette.

### Dark Mode (default)
- **Background:** `#111113` — warm near-black
- **Surface:** `#1A1A1E` — cards, panels
- **Surface elevated:** `#222228` — hover states, stat boxes
- **Border:** `#2A2A30` — subtle, almost subliminal
- **Primary text:** `#ECECEA` — warm off-white, less eye strain than pure white
- **Muted text:** `#737373` — recedes hard, for metadata
- **Accent:** `#E8572A` — burnt orange, used max 2-3 times per page (logo, search button)
- **Accent hover:** `#D14E24`

### Light Mode
- **Background:** `#FAFAF9`
- **Surface:** `#FFFFFF`
- **Surface elevated:** `#F5F5F4`
- **Border:** `#E5E5E3`
- **Primary text:** `#171717`
- **Muted text:** `#737373`
- **Accent:** `#E8572A` (same)

### Semantic Colors
- **Verdict green:** `#22C55E` — HOLD
- **Verdict amber:** `#EAB308` — MONITOR
- **Verdict red:** `#EF4444` — CONSIDER SELLING
- **Info:** `#60A5FA`
- **Verdict backgrounds:** 8% opacity tint of the verdict color (dark mode), 6% (light mode)
- **Verdict borders:** 25% opacity of the verdict color (dark mode), 20% (light mode)

### Dark Mode Strategy
Dark is the default. Light mode via `data-theme="light"` on `<html>`. All colors defined as CSS custom properties. Reduce saturation 10-20% is not needed here since the palette is already restrained.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — not cramped like a spreadsheet, not airy like a marketing site
- **Scale:**
  - `2xs`: 2px
  - `xs`: 4px
  - `sm`: 8px
  - `md`: 16px
  - `lg`: 24px
  - `xl`: 32px
  - `2xl`: 48px
  - `3xl`: 64px

## Layout
- **Approach:** Single column, centered
- **Grid:** Single column at all breakpoints. No sidebar, no nav, no tabs.
- **Max content width:** 640px
- **Border radius:**
  - `sm`: 4px — bar chart bars, small UI elements
  - `md`: 8px — buttons, inputs, stat boxes, comparable cards
  - `lg`: 12px — player card, verdict box, main containers
  - `full`: 9999px — pills, badges, injury tags
- **Component order (results page):** Search bar, injury pills, verdict box, player card, comparable cards. Verdict above player card (answer first, evidence second).

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:**
  - Enter: `ease-out`
  - Exit: `ease-in`
  - Move: `ease-in-out`
- **Duration:**
  - Micro: 50-100ms (hover color changes)
  - Short: 150ms (button transitions, card hover lift)
  - Medium: 200-300ms (verdict box entrance fade+slide)
  - Long: not used in MVP
- **Specific animations:**
  - Verdict box: fade in + slide up 8px, 300ms ease-out
  - Comparable card hover: translateY(-1px), border-color change, 150ms
  - No scroll-driven animations
  - No page transitions

## Verdict Box Treatment
The verdict box is the core value prop. It gets special visual treatment:
- Full-width block with 4px left border in verdict color
- Tinted background (8% opacity of verdict color)
- Subtle border (25% opacity) on top/right/bottom
- Verdict word rendered in JetBrains Mono, 28px, bold
- "Verdict" label above in JetBrains Mono, 10px, uppercase, tracking
- Recovery percentage below verdict word
- Body text in DM Sans, 14px
- Meta line ("Based on N comparable cases") in JetBrains Mono, 11px, muted

## Anti-Patterns (never use)
- Purple/violet gradients
- 3-column feature grids with icons in circles
- Centered-everything with uniform spacing
- Generic stock-photo hero sections
- Blue/green "sports app" color schemes
- Gradient buttons
- Decorative blobs or abstract shapes
- Emojis in the verdict box (use color + typography for emphasis)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Initial design system created | Created by /design-consultation based on competitive research (FantasyPros, Draft Sharks, SIC Score, Sleeper) and product context (verdict box is core value prop per user research) |
| 2026-03-28 | Dark mode as default | Differentiator: no fantasy tool except Sleeper does this. Signals "serious tool" over "sports fun app" |
| 2026-03-28 | Instrument Serif for display | Every competitor uses sans-serif everything. Serif headlines create editorial authority |
| 2026-03-28 | Burnt orange accent (#E8572A) | Competitors converge on blue/green. Orange stands out, evokes hazard signage (fitting for injuries), avoids generic sports aesthetic |
| 2026-03-28 | Verdict box with heavy left border | The verdict is a ruling, not a suggestion. Visual weight matches its importance as the #1 user value prop |
