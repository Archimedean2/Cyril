# Cyril — UI Tokens and Layout Metrics

## Purpose

This document defines concrete UI tokens and layout metrics for Cyril.

It turns the design intent from `DESIGN_SYSTEM.md` into implementation-friendly values.

These values are intended for:
- CSS variables
- Tailwind theme extension
- design token files
- component sizing decisions

This document prioritizes:
- desktop-editor feel
- compactness
- clarity
- calm light-mode aesthetics

---

## Design Goals

Cyril should feel:
- sleek
- compact
- editor-like
- calm
- precise

It should not feel:
- oversized
- bubbly
- dashboard-like
- excessively rounded
- spacious for the sake of spaciousness

---

## Token Naming Philosophy

Use semantic names, not hardcoded contextless names.

Prefer:
- `--bg-app`
- `--text-muted`
- `--panel-left-width`

Avoid:
- `--gray-100`
- `--blue-3`
- unless part of a deeper palette layer

---

## 1. Layout Dimensions

### App shell
```text
Top bar height:          40px
Left sidebar width:      240px
Left sidebar min:        200px
Left sidebar max:        320px

Right sidebar width:     320px
Right sidebar min:       260px
Right sidebar max:       420px

Right pane top ratio:    55%
Right pane bottom ratio: 45%
```

### Main editor content
```text
Editor content max width: 760px
Editor content min width: 560px
Editor horizontal padding: 32px
Editor top padding:        24px
Editor bottom padding:     64px
```

### Reasoning
- top bar stays compact
- sidebars are useful but not huge
- center text measure stays comfortable for lyric editing

---

## 2. Spacing Scale

Use a tight spacing scale.

```text
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-7: 32px
--space-8: 40px
```

### Usage guidance
- micro gaps: 4–8px
- control padding: 8–12px
- panel padding: 12–16px
- editor interior spacing: 16–24px
- avoid >40px except in rare empty-state contexts

---

## 3. Border Radius

Keep radii subtle.

```text
--radius-xs: 4px
--radius-sm: 6px
--radius-md: 8px
```

### Rule
- use `4px` or `6px` most of the time
- do not use large pill/button radii by default
- app should feel precise, not soft and toy-like

---

## 4. Border Widths

```text
--border-thin: 1px
--border-strong: 1px
```

### Rule
Use thin borders almost everywhere.
The distinction should come from color, not thickness.

---

## 5. Light Mode Color Tokens

These are suggested starting values, not sacred truths.

## Backgrounds
```text
--bg-app:            #f5f6f8
--bg-sidebar:        #eef1f4
--bg-sidebar-alt:    #f1f3f6
--bg-editor:         #fcfcfd
--bg-panel:          #f8f9fb
--bg-subtle:         #f0f2f5
--bg-hover:          #e8edf3
--bg-active:         #dde6f2
--bg-selected-soft:  #d7e4f7
```

## Text
```text
--text-primary:      #1f2430
--text-secondary:    #4a5565
--text-muted:        #738093
--text-faint:        #94a0b0
--text-inverse:      #ffffff
```

## Borders
```text
--border-subtle:     #d8dde6
--border-default:    #c8d0db
--border-strong:     #b7c1cf
```

## Accent
```text
--accent-primary:    #4f7db8
--accent-primary-2:  #5f8fcb
--accent-soft:       #d7e6f7
--accent-strong:     #3d6da8
```

## Status
```text
--status-saved:      #5f8f6b
--status-unsaved:    #b36b4d
--status-warning:    #b2873d
```

### Notes
- these colors are calm and editor-friendly
- they avoid trendy oversaturation
- they support subtle active states and pane distinctions

---

## 6. Section Accent Colors

Use these sparingly.

```text
--section-blue:      #7c9dc7
--section-green:     #7aa58c
--section-gold:      #c0a56c
--section-rose:      #b88a95
--section-violet:    #958db8
```

### Rule
Do not fill whole sections with these colors.
Use them for:
- left accents
- labels
- tiny markers
- subtle underline/badge treatments

---

## 7. Rhyme Highlight Colors

These should be visible but elegant.

```text
--rhyme-a-bg:        #e3eefc
--rhyme-a-text:      #4c72a8

--rhyme-b-bg:        #e8f3e6
--rhyme-b-text:      #517b56

--rhyme-c-bg:        #f8ecda
--rhyme-c-text:      #9a7040

--rhyme-d-bg:        #f3e5ea
--rhyme-d-text:      #946271
```

### Rule
Prefer soft background highlights with medium-contrast text.
Avoid neon marker effects.

---

## 8. Typography Tokens

## Font families

### App UI font
```text
--font-ui: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

### Editor font
```text
--font-editor: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

### Optional print font later
Can be chosen separately in export layer; not required now.

### Note
Starting with one font family for both UI and editor is fine.
You can specialize later.

---

## 9. Font Sizes

Keep sizes compact.

```text
--text-xs:   11px
--text-sm:   12px
--text-md:   14px
--text-lg:   16px
--text-xl:   18px
--text-2xl:  22px
```

### Suggested usage
- utility labels / syllables / save state: `11–12px`
- nav items / panel content / metadata: `12–14px`
- lyric text: `16px`
- top bar title / draft title: `16–18px`
- project title in dialogs or export: `22px`

---

## 10. Line Heights

```text
--lh-tight:    1.2
--lh-normal:   1.4
--lh-loose:    1.6
```

### Usage
- nav labels / compact metadata: `1.2`
- general UI text: `1.4`
- lyric text: `1.5–1.6`
- stage directions may sit slightly tighter than lyric lines if needed

---

## 11. Font Weights

```text
--weight-regular: 400
--weight-medium:  500
--weight-semibold: 600
--weight-bold:    700
```

### Guidance
- use regular and medium most of the time
- reserve semibold for active titles / headers
- avoid using bold everywhere

---

## 12. Component Heights

### Top-level shell
```text
--topbar-height: 40px
```

### Buttons
```text
--button-sm-height: 28px
--button-md-height: 32px
```

### Inputs
```text
--input-height: 32px
```

### Tabs / segmented controls
```text
--tab-height: 28px
```

### Rule
Avoid tall controls.
Cyril is a dense editor, not a touch-first mobile app.

---

## 13. Pane Padding

### Left sidebar
```text
padding: 12px
section gap: 16px
```

### Right sidebar
```text
padding: 12px
internal pane header padding: 10px 12px
internal pane body padding: 12px
```

### Main editor shell
```text
outer padding: 0
inner content padding: 24px 32px 64px 32px
```

---

## 14. Divider Rules

### Pane dividers
```text
color: var(--border-default)
width: 1px
```

### Internal pane divider
```text
color: var(--border-subtle)
width: 1px
```

### Rule
Use dividers to structure the app.
Do not replace them with heavy shadows.

---

## 15. Shadows

Use sparingly, nearly not at all.

```text
--shadow-none: none
--shadow-soft: 0 1px 2px rgba(31, 36, 48, 0.06)
```

### Rule
Avoid card-shadow UI.
At most, use a tiny shadow on:
- menus
- popovers
- dialogs

Not on main panes.

---

## 16. Scrollbar Guidance

If styled:
- keep subtle
- thin
- low-contrast
- not flashy

### Rule
Scrollbars should not dominate the UI, but internal pane scrolling should feel obvious enough.

---

## 17. Nav Item Tokens

```text
nav item height:      28px
nav item padding-x:   10px
nav item gap:         8px
nav item radius:      6px
```

### Active nav item
- subtle background
- optional left accent line
- slightly stronger text

### Hover
- low-contrast background shift

---

## 18. Panel Header Tokens

```text
panel header height:      32px
panel header font size:   12px
panel header weight:      600
panel header text color:  var(--text-secondary)
panel header padding-x:   12px
```

### Rule
Headers should be compact and infrastructural.

---

## 19. Draft List Tokens

```text
draft row height: 28px
draft row padding-x: 10px
draft row radius: 6px
```

### Rule
Drafts should look like document entries, not chunky buttons.

---

## 20. Editor Typography Tokens

### Lyric line
```text
font: var(--font-editor)
size: 16px
weight: 400
line-height: 1.55
color: var(--text-primary)
```

### Speaker label
```text
size: 12px
weight: 600
line-height: 1.3
color: var(--text-secondary)
letter-spacing: 0.04em
text-transform: uppercase
```

### Stage direction
```text
size: 13px
weight: 400
style: italic
line-height: 1.35
color: var(--text-muted)
```

### Section label
```text
size: 12px
weight: 600
line-height: 1.3
color: var(--accent-strong)
```

### Section summary
```text
size: 12px
weight: 400
line-height: 1.3
color: var(--text-muted)
```

### Syllable count
```text
size: 11px
weight: 400
line-height: 1
color: var(--text-faint)
```

### Chord text
```text
size: 12px
weight: 500
line-height: 1.2
color: var(--text-secondary)
```

---

## 21. Editor Layout Metrics

### Lyric line block spacing
```text
gap between speaker and direction: 4px
gap between direction and chord lane: 4px
gap between chord lane and lyric line: 2px
gap between lyric lines: 8px
gap between sections: 20px
```

### Syllable gutter
```text
width: 28px
right padding: 8px
alignment: right
```

### Chord lane
```text
min height: 18px
bottom spacing to lyric: 2px
```

---

## 22. Toolbar Tokens

If a compact formatting toolbar exists:

```text
toolbar height: 32px
toolbar gap: 6px
button height: 28px
button min width: 28px
button padding-x: 8px
```

### Rule
Toolbar should feel like editor controls, not ribbon UI.

---

## 23. Search Field Tokens

### Tools search
```text
height: 32px
padding-x: 10px
font-size: 13px
radius: 6px
```

### Rule
Search should be compact and always available.

---

## 24. Results List Tokens

```text
result row min height: 28px
result row padding: 6px 8px
result gap: 2px
result radius: 4px
```

### Rule
Results should feel copyable and fast to scan.

---

## 25. Inventory Text Tokens

Inventory is not the main draft, so it can be slightly smaller.

```text
font: var(--font-editor)
size: 14px
line-height: 1.45
color: var(--text-primary)
```

---

## 26. Dialog Tokens

### Dialog container
```text
width: 420px
padding: 16px
radius: 8px
shadow: var(--shadow-soft)
background: var(--bg-editor)
border: 1px solid var(--border-default)
```

### Dialog title
```text
size: 16px
weight: 600
```

### Rule
Dialogs should be compact and calm.

---

## 27. Empty State Tokens

### Purpose
The empty state can breathe slightly more than the rest of the app.

```text
title size: 22px
body size: 14px
action gap: 12px
```

### Rule
Still avoid giant marketing-page aesthetics.

---

## 28. CSS Variable Starter Example

```css
:root {
  --bg-app: #f5f6f8;
  --bg-sidebar: #eef1f4;
  --bg-editor: #fcfcfd;
  --bg-panel: #f8f9fb;
  --bg-hover: #e8edf3;
  --bg-active: #dde6f2;

  --text-primary: #1f2430;
  --text-secondary: #4a5565;
  --text-muted: #738093;
  --text-faint: #94a0b0;

  --border-subtle: #d8dde6;
  --border-default: #c8d0db;
  --border-strong: #b7c1cf;

  --accent-primary: #4f7db8;
  --accent-soft: #d7e6f7;
  --accent-strong: #3d6da8;

  --font-ui: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-editor: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;

  --topbar-height: 40px;
  --left-sidebar-width: 240px;
  --right-sidebar-width: 320px;
}
```

---

## 29. Implementation Priority Order

If there is limited time, lock these first:

1. top bar height
2. left/right/sidebar widths
3. editor max width
4. text sizes
5. border colors
6. panel backgrounds
7. nav active state
8. lyric/metadata type distinction
9. compact button/input heights

These will determine 80% of whether the app feels sleek.

---

## 30. Final Smell Test

If the implementation looks:
- airy
- rounded
- card-heavy
- heavily shadowed
- CTA-driven
- like a startup dashboard

it is wrong.

If it looks:
- compact
- pane-based
- precise
- type-led
- subdued
- editor-like

it is right.
```

---