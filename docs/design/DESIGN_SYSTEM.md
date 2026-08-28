# Cyril — Design System

## Purpose

This document defines the visual and interaction design rules for Cyril.

It exists to make Cyril feel:
- sleek
- calm
- editor-like
- dense but readable
- intentional

This is not a branding document.
It is a practical system for producing a coherent desktop-editor aesthetic.

---

## Design Intent

Cyril should feel like:
- a refined writing tool
- a pane-based editor
- a light-mode IDE for lyricists

Primary visual references:
- VS Code (layout discipline)
- Obsidian light mode (restraint)
- script editor clarity
- literary tool elegance

It should not feel like:
- a dashboard SaaS
- a bubbly consumer app
- a heavily rounded “productivity startup” UI
- a maximalist design system

---

## Core Visual Principles

1. Density over spaciousness
2. Calm neutrals over loud contrast
3. Subtle dividers over heavy card borders
4. Typography-led hierarchy
5. Color used purposefully, not decoratively
6. Motion should be minimal and functional
7. Controls should look precise, not playful

---

## Color Philosophy

Use a restrained palette.

### Neutrals
Need:
- background
- panel background
- editor background
- muted text
- normal text
- strong text
- divider/border

### Accent colors
Need:
- one primary accent for selection/active state
- a few semantic colors for:
  - section color markers
  - rhyme group highlights
  - optional status states

### Rules
- avoid intense saturation
- avoid full-pane colored backgrounds
- use color mostly for:
  - active nav item
  - focus state
  - tags/markers
  - subtle line accents

---

## Recommended Color Roles

### Base roles
- `bg.app`
- `bg.sidebar`
- `bg.editor`
- `bg.subtle`
- `text.primary`
- `text.secondary`
- `text.muted`
- `border.subtle`
- `border.strong`
- `accent.primary`
- `accent.soft`

### Semantic roles
- `section.blue`
- `section.green`
- `section.gold`
- `section.rose`
- `rhyme.a`
- `rhyme.b`
- `rhyme.c`
- `status.saved`
- `status.unsaved`

### Guidance
Section and rhyme colors should be:
- muted
- elegant
- legible in light mode
- never neon

---

## Typography

Typography will make or break Cyril.

### Priorities
1. Excellent readability
2. Calm line rhythm
3. Clear distinction between metadata and lyric text
4. Compact but not cramped

### Type categories needed
- app UI font
- editor text font
- optional print font later

### Recommended approach
- Use one high-quality UI/editor font family if possible initially
- Prefer a clean, literary sans or transitional font for on-screen editing
- Avoid overly quirky fonts in the app UI

### Hierarchy
Need styles for:
- top bar title
- panel headers
- nav items
- body/editor text
- metadata text
- muted utility text
- code/editor-like small labels if needed

---

## Text Styling Roles

### Lyric text
- primary text color
- largest body importance
- should feel clean and readable

### Speaker labels
- stronger than stage directions
- likely uppercase or small caps styling
- visually distinct from lyric lines

### Stage directions
- lighter / italic / muted
- clearly secondary
- should not dominate page

### Section labels
- compact badge-like or heading-like
- subtle color accent allowed
- must be easy to scan

### Section summaries
- muted, compact
- subordinate to label

### Syllable counts
- very muted
- small
- must not compete with lyrics

### Chords
- visually crisp and readable
- slightly separated from lyric line
- not too bold or oversized

---

## Spacing System

Cyril should use a tight, consistent spacing scale.

### Recommended spacing steps
Use a compact scale, e.g.
- 4
- 8
- 12
- 16
- 20
- 24

### Rules
- prefer smaller spacing over large empty zones
- panel interiors should feel economical
- editor line spacing should be tuned for lyric readability, not document spaciousness
- avoid giant padding inside buttons and panes

---

## Border and Surface Rules

### Preferred
- thin dividers
- subtle panel boundaries
- restrained use of surface elevation
- flat or near-flat surfaces

### Avoid
- heavy shadows
- thick borders
- card stacks everywhere
- overuse of rounded corners

### Rounded corners
If used:
- keep small and subtle
- do not apply large-radius “app store” styling

---

## Panel Styling

### Left Sidebar
- slightly different background from editor
- compact nav lists
- subtle active highlight
- small section headers

### Right Sidebar
- same family as left sidebar
- split with clear but subtle divider
- top and bottom panes should feel like tools, not cards

### Main Editor Pane
- cleanest surface
- visually quiet
- central focus of the app

---

## Nav Styling

### Desired feel
- compact
- list-like
- editor-like
- not oversized

### Active item
- subtle accent background or left border
- clear but not loud

### Hover
- understated highlight

### Draft list
- should look like document entries, not giant buttons

---

## Top Bar Styling

### Desired feel
- extremely compact
- almost infrastructural
- not “hero” UI

### Good contents
- app name
- project title
- save state
- export action

### Avoid
- giant header bars
- search bars unless needed
- excessive icon clutter

---

## Button Styling

### Desired feel
- compact, precise, understated

### Prefer
- small button heights
- minimal fill usage
- ghost/subtle buttons where possible
- only a few prominent actions

### Avoid
- giant rounded CTA buttons
- overuse of primary buttons
- dashboard-style oversized controls

---

## Input Styling

### Search fields
- compact height
- clear focus ring
- minimal extra decoration

### Dialog inputs
- simple, clean
- aligned to compact layout

---

## Editor Layout Rules

1. The text column should not become too wide
2. Metadata should align clearly with lyric content
3. Syllable counts sit in a narrow gutter
4. Chords sit above lyrics without overpowering them
5. Alternate indicators should be subtle but discoverable

---

## Divider Rules

Dividers are important in Cyril because panes define the experience.

### Use dividers to separate
- left sidebar from editor
- editor from right sidebar
- tools pane from inventory pane
- panel header from panel body where needed

### Divider style
- thin
- low-contrast
- always present enough to organize space

---

## Iconography

### Style
- simple
- outline or restrained filled icons
- consistent stroke weight

### Rules
- use icons sparingly
- do not rely on icons without labels in early versions
- prioritize clarity over novelty

---

## Motion and Transitions

### Desired feel
- immediate
- subtle
- quiet

### Use
- very short hover/focus transitions
- minimal panel animation
- no bouncy motion
- no decorative transitions

### Principle
Cyril should feel stable, not playful.

---

## Selection and Focus States

These are extremely important in an editor-like app.

### Requirements
- active nav item clearly visible
- focused input visible
- editor selection readable
- selected tool mode obvious
- selected draft obvious
- active alternate obvious

### Avoid
- muddy focus states
- invisible keyboard focus
- overly bright focus rings

---

## Print / Export Styling Philosophy

For on-screen app design:
- compact
- pane-based
- editor-like

For print:
- cleaner
- more literary
- less app-like
- more whitespace control

Do not overfit the app UI to print aesthetics.

---

## Density Guidelines

### Desired
- medium-high information density
- enough breathing room to think
- no wasted space

### Wrong direction
- giant padded panels
- large card layouts
- huge controls
- sparse dashboard look

### Right direction
- calm but efficient
- compact without claustrophobia
- information-forward

---

## Visual Smell Tests

### Wrong
- looks like a startup dashboard
- lots of rounded cards
- giant spacing
- bright CTA buttons
- too much decorative color

### Right
- looks like a tool for serious work
- compact pane layout
- typography-led hierarchy
- quiet neutrals
- subtle accents
- visual confidence without flash

---

## Component Design Rules

When building any component, ask:

1. Is this more compact than a generic web component?
2. Is it visually quieter?
3. Does it look like it belongs in an editor?
4. Does it preserve precious vertical space?
5. Is the hierarchy clear without heavy decoration?

If not, simplify and tighten it.

---

## Initial Design Priorities for Implementation

Before polishing advanced features, get these right:
1. app shell proportions
2. sidebar styling
3. editor width and spacing
4. top bar compactness
5. lyric vs metadata typography
6. divider quality
7. nav active states
8. tool pane readability
9. inventory readability

These will determine whether Cyril feels sleek long before advanced features arrive.