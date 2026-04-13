Perfect. We’ll do both.

I’ll start with **`WIREFRAMES.md`**, then **`DESIGN_SYSTEM.md`**.

The goal is to make Windsurf build something that feels like:
- a serious writing tool
- an editor shell
- sleek, dense, and calm
- not like a generic productivity SaaS

---

# `WIREFRAMES.md`

```md
# Cyril — Wireframes and Screen Specification

## Purpose

This document defines the core screen layouts and interaction structures for Cyril.

It is intended to guide implementation of:
- overall app shell
- pane layout
- editor view composition
- sidebar behavior
- draft and workspace navigation
- key overlays and panels

This document focuses on layout and interaction structure, not color tokens or detailed visual styling.
See `DESIGN_SYSTEM.md` for visual rules.

---

## Design Intent

Cyril should feel like:
- a desktop editor
- a pane-based writing instrument
- calm, dense, and focused

It should not feel like:
- a marketing site
- a dashboard SaaS product
- a full-width web document page

Primary inspirations:
- VS Code
- Obsidian
- lightweight script editors
- document tools with IDE-like pane discipline

---

## Global Layout Principles

1. The app uses a **three-pane shell**
   - left navigation
   - center content/editor
   - right sidebar split into top and bottom

2. The app occupies the full viewport height

3. The app should avoid page-level scrolling
   - panes scroll internally

4. The center pane should preserve a comfortable writing width
   - lyric text should not stretch too wide

5. Sidebars should feel stable and useful, not decorative

6. Tooling and inventory should remain nearby while drafting

---

## App Shell

### Layout

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Top Bar                                                                                      │
├───────────────┬──────────────────────────────────────────────┬───────────────────────────────┤
│ Left Sidebar  │ Main Pane                                     │ Right Sidebar                 │
│               │                                               │ ┌───────────────────────────┐ │
│               │                                               │ │ Tools Pane                │ │
│               │                                               │ ├───────────────────────────┤ │
│               │                                               │ │ Inventory Pane            │ │
│               │                                               │ └───────────────────────────┘ │
└───────────────┴──────────────────────────────────────────────┴───────────────────────────────┘
```

### Regions
- **Top Bar**: project title, save state, current view actions
- **Left Sidebar**: workspace navigation, draft list, display toggles
- **Main Pane**: active workspace or draft editor
- **Right Sidebar Top**: tools
- **Right Sidebar Bottom**: inventory

---

## Recommended Default Widths

These are target ranges, not absolute rules.

### Left Sidebar
- default: 240px
- min: 200px
- max: 320px

### Right Sidebar
- default: 320px
- min: 260px
- max: 420px

### Main Pane
- fills remaining width
- internal editor content width should be constrained to readable measure
- target editor content max width: 700–820px depending on mode

### Right Sidebar Split
- top tools pane: ~55%
- bottom inventory pane: ~45%
- split should be resizable later if practical

---

## Screen 1: Empty State

### When shown
- app is open
- no project currently loaded

### Layout

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Cyril                                                                                       │
├───────────────┬──────────────────────────────────────────────┬───────────────────────────────┤
│ Left Sidebar  │                                              │ Tools Pane                    │
│               │              No project open                 │                               │
│ Recent        │                                              │ Inventory Pane                │
│ - (empty)     │        [ New Project ]  [ Open Project ]     │                               │
│               │                                              │                               │
└───────────────┴──────────────────────────────────────────────┴───────────────────────────────┘
```

### Requirements
- center pane should clearly offer:
  - New Project
  - Open Project
- left sidebar may show recent projects if available
- right sidebar can show placeholders or be visually subdued

---

## Screen 2: Project — Draft View (Primary Screen)

This is the most important screen in Cyril.

### Layout

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Cyril — Playtime's Over                                             Saved        Export      │
├───────────────┬──────────────────────────────────────────────┬───────────────────────────────┤
│ Left Sidebar  │ Main Draft Editor                              │ Right Sidebar                 │
│               │                                                │                               │
│ Project       │ Draft: Main Draft                              │ Tools                         │
│ Brief         │ ------------------------------------------     │ [Rhyme][Near][Dict][Thes]    │
│ Structure     │ [First Verse]                                  │ [Idioms][Related]            │
│ Hook Lab      │ WOODY                                          │                               │
│ Vocab World   │ (Approaching, confident)                       │ Search: [ room__________ ]   │
│               │ A         D        A                           │                               │
│ Drafts        │ Welcome to Andy's Room!                        │ Results                       │
│ Main Draft    │                                                │ - bloom                      │
│ Alt Draft     │ BUZZ                                           │ - loom                       │
│ Comic Pass    │ (Scanning the area)                            │ - tomb                       │
│ + New Draft   │ Em                A                            │                               │
│               │ Is that the name you gave this planet?         │ ---------------------------   │
│ View          │                                                │ Inventory                     │
│ [x] Chords    │ [6] Good. How's the air here?                  │ planet / granite / panic it  │
│ [x] Sections  │                                                │                               │
│ [x] Speakers  │                                                │ spare line:                  │
│ [x] Stage Dir │                                                │ "Wait, I'll scan it."        │
│ [ ] Syllables │                                                │                               │
└───────────────┴──────────────────────────────────────────────┴───────────────────────────────┘
```

### Main Pane Requirements
- main content area scrolls independently
- lyric lines remain left-aligned in a narrow writing column
- metadata and chords do not force full-width stretching
- line spacing should support both lyrics and metadata comfortably

### Left Sidebar Requirements
Must include:
- project workspaces
- draft list
- display toggles or draft view controls

### Right Sidebar Requirements
Top:
- active tool panel
Bottom:
- inventory scratchpad

---

## Screen 3: Project — Brief Workspace

### Purpose
Capture assignment, context, constraints, and goals.

### Layout
Same overall shell; main pane changes.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Cyril — Playtime's Over                                             Saved                    │
├───────────────┬──────────────────────────────────────────────┬───────────────────────────────┤
│ Left Sidebar  │ Brief Workspace                                 │ Right Sidebar                 │
│               │                                                │ Tools                         │
│ Project       │ Brief                                           │ Optional / subdued in v1      │
│ > Brief       │ ------------------------------------------     │                               │
│ Structure     │ Buzz Lightyear has just emerged from his       │ ---------------------------   │
│ Hook Lab      │ cardboard spaceship...                         │ Inventory                     │
│ Vocab World   │                                                │ optional visible              │
│               │ Need: comedic misunderstanding duet            │                               │
│ Drafts        │ Constraint: Woody sincere, Buzz literal        │                               │
│ Main Draft    │ Arc: escalating misunderstanding               │                               │
└───────────────┴──────────────────────────────────────────────┴───────────────────────────────┘
```

### Notes
- can use same base rich text editor as other non-draft workspaces
- right sidebar may still remain present for consistency

---

## Screen 4: Project — Structure Workspace

### Purpose
Support section planning and dramatic architecture.

### v1 Layout
Can still be rich text-based, but should visually support structure.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Cyril — Playtime's Over                                                                     │
├───────────────┬──────────────────────────────────────────────┬───────────────────────────────┤
│ Left Sidebar  │ Structure Workspace                              │ Right Sidebar                 │
│               │                                                │ Tools / Inventory             │
│ Project       │ Structure                                       │                               │
│ Brief         │ ------------------------------------------     │                               │
│ > Structure   │ Verse 1 — Woody welcomes Buzz                  │                               │
│ Hook Lab      │ Verse 2 — Buzz interprets room as planet       │                               │
│ Vocab World   │ Chorus — same phrase, opposite meanings        │                               │
│               │ Bridge — mutual confusion peaks                │                               │
│ Drafts        │                                                │                               │
│ Main Draft    │ Optional future section cards live here        │                               │
└───────────────┴──────────────────────────────────────────────┴───────────────────────────────┘
```

### Future-Friendly Note
Even if implemented as rich text in v1, leave room for later card/outline structures.

---

## Screen 5: Project — Hook Lab

### Purpose
Fast capture of title ideas, hook lines, chorus candidates.

### Notes
- same shell
- same editor base
- right sidebar useful for rhyme/word tools here

---

## Screen 6: Project — Vocabulary World

### Purpose
Character diction, idioms, lexical field, verbal habits.

### Notes
- should feel like a notes board / lexical notebook
- tools sidebar especially relevant here

---

## Left Sidebar Specification

### Structure

```text
[Project Title]
----------------
Project
- Brief
- Structure
- Hook Lab
- Vocabulary World

Drafts
- Main Draft
- Alt Draft
- Comic Pass
+ New Draft

View
[ ] or [x] display toggles
```

### Requirements
- clear distinction between project workspaces and drafts
- active item visibly highlighted
- compact, editor-like list styling
- new draft action easy to discover

### Interaction Notes
- clicking a workspace opens that workspace in main pane
- clicking a draft opens that draft in main pane
- draft context menu later:
  - rename
  - duplicate
  - delete

---

## Top Bar Specification

### Purpose
Provide light app-level context and actions without becoming bulky.

### Suggested contents
Left:
- app name or breadcrumb
Center:
- project title
Right:
- save state
- export button
- optional settings/menu later

### Requirements
- compact height
- never visually dominate the screen
- preserve maximum vertical space

### Example

```text
Cyril     Playtime's Over                                  Saved      Export
```

---

## Main Draft Editor Specification

### Core structure
The draft editor consists of:
- section blocks
- metadata lines
- lyric lines
- optional chord lane
- optional syllable gutter

### Visual hierarchy inside a section

```text
[First Verse]
WOODY
(Approaching, confident)
A         D        A
Welcome to Andy's Room!
```

### Requirements
- each of these must be visually distinct
- but all should feel part of one coherent writing surface
- metadata should not overpower lyric content
- lyric text should remain primary

---

## Lyric Line Layout

### Without chords
```text
[6] Welcome to Andy's Room!
```

### With metadata above
```text
WOODY
(Approaching, confident)
[6] Welcome to Andy's Room!
```

### With chords
```text
    A         D        A
[6] Welcome to Andy's Room!
```

### Notes
- syllable count sits in a narrow left gutter
- chord lane sits above lyric line, aligned to lyric measure
- lyric line text remains the anchor of the reading experience

---

## Section Block Layout

### Expanded display
```text
[First Verse]                       summary: Woody welcomes Buzz with confidence
```

### Compact display
```text
[First Verse]
```

### Requirements
- label and summary may be shown/hidden separately
- section color should be subtle, not garish
- color may appear as:
  - left border
  - label accent
  - small marker
- avoid large full-background color fills

---

## Metadata Visibility States

The draft editor should support display modes.

### Full drafting mode
Show:
- section labels
- speaker labels
- stage directions
- chords
- syllables if enabled

### Reading mode
Hide some metadata:
- maybe hide stage directions
- maybe hide section summaries

### Clean lyrics mode
Hide:
- most metadata
- maybe chords too, depending on use

### Requirement
Visibility changes must not reflow layout violently.

---

## Right Sidebar Specification

## Top: Tools Pane

### Purpose
Contextual word exploration

### Structure
```text
Tools
[Rhyme] [Near] [Dict] [Thes] [Idioms] [Related]
Search: [____________]

Results
- ...
- ...
- ...
```

### Requirements
- compact tab/mode row
- search field always accessible
- result list scrolls independently
- clicking result copies it
- panel remains usable while draft is visible

---

## Bottom: Inventory Pane

### Purpose
Draft-specific scratchpad

### Structure
```text
Inventory
----------------
planet / granite / panic it

spare line:
Good. How's the air here? Wait, I'll scan it.
```

### Requirements
- editable
- copy-friendly
- not overstructured in v1
- default visible during drafting

---

## Split Sidebar Behavior

### Default
- tools on top
- inventory below
- visible divider line between them

### Future-friendly
- adjustable split ratio
- collapse one pane if desired

---

## Alternate Lyrics UI

### Principle
Alternates should feel lightweight and local, not like a branching file system.

### Trigger
- keyboard shortcut
- inline button on lyric line
- context action

### Preferred v1 interaction
A line-level popover or side panel.

### Popover model

```text
Is that the name you gave this planet?   [⋯]

Click [⋯]

┌─────────────────────────────────────┐
│ Alternates                          │
├─────────────────────────────────────┤
│ ● Is that the name you gave this... │
│ ○ Is that what you call this planet │
│ ○ Is that the title of this planet  │
│                                     │
│ [Add alternate] [Edit] [Delete]     │
└─────────────────────────────────────┘
```

### Requirements
- active line remains in editor
- alternate UI should not obscure too much text
- switching active alternate should feel immediate

---

## Chord Editing UI

### Principle
Chord entry must be more robust than plain text alignment but remain simple.

### Editing state
When a lyric line is selected in a chord-enabled draft:
- show chord lane clearly
- allow chord markers to be selected or inserted
- optional snap guides may appear during movement

### Conceptual layout
```text
A         D        A
Welcome to Andy's Room!
```

### Editing affordances
- add chord button
- click existing chord to edit symbol
- drag horizontally to reposition
- subtle guides only while editing

### Requirements
- no fake spaces in text
- chord editing should not visually overwhelm lyric line

---

## Export / Print Panel Wireframe

### Invocation
Likely modal or right-side temporary panel

### Layout

```text
┌───────────────────────────────┐
│ Export                        │
├───────────────────────────────┤
│ Format                        │
│ ( ) Markdown                  │
│ (•) PDF / Print               │
│                               │
│ Include                       │
│ [x] Section labels            │
│ [x] Speaker labels            │
│ [x] Stage directions          │
│ [ ] Chords                    │
│                               │
│ Density                       │
│ (•) Normal                    │
│ ( ) Compact                   │
│                               │
│ [Export] [Preview]            │
└───────────────────────────────┘
```

### Requirements
- simple and compact
- no giant settings dialog
- export choices should map directly to schema export settings

---

## New Draft Dialog Wireframe

```text
┌─────────────────────────────────────┐
│ New Draft                           │
├─────────────────────────────────────┤
│ Name: [ Comic Pass______________ ]  │
│                                     │
│ Start from:                         │
│ (•) Blank                           │
│ ( ) Duplicate text only             │
│ ( ) Duplicate inventory only        │
│ ( ) Duplicate both                  │
│                                     │
│ Source draft: [ Main Draft v ]      │
│                                     │
│ [Cancel]              [Create]      │
└─────────────────────────────────────┘
```

### Requirements
- fast and low-friction
- source draft selector enabled only when relevant

---

## Recommended Interaction Density

The app should prefer:
- compact controls
- short labels
- stable sidebars
- small headers
- minimal decorative padding

It should avoid:
- oversized inputs
- giant modals
- card-heavy layouts
- excessive blank space

---

## Scroll Behavior Rules

1. App shell should not page-scroll
2. Left sidebar scrolls if content exceeds height
3. Main pane scrolls independently
4. Tools pane scrolls independently
5. Inventory pane scrolls independently

This is essential to the “desktop editor” feel.

---

## Responsiveness Rules

Cyril is desktop-first.

### Required
- works comfortably on standard desktop widths
- degrades acceptably on smaller laptop widths

### Not required in v1
- full mobile layout
- touch-first redesign

### If width becomes constrained
Priority order:
1. preserve main editor
2. compress sidebars
3. allow sidebar collapse
4. do not widen lyric measure unnecessarily

---

## UI Smell Tests

If a screen feels like:
- a Notion page
- a SaaS dashboard
- a card grid
- a generic settings-heavy web app

then it is drifting in the wrong direction.

If a screen feels like:
- a writing IDE
- a calm code editor
- a focused pane-based workstation

then it is likely on the right track.
```

---

Now the second doc.

---

# `DESIGN_SYSTEM.md`

```md
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
```

---

# What to do with these now

You can use these in three ways:

## 1. Put them in the repo
- `WIREFRAMES.md`
- `DESIGN_SYSTEM.md`

## 2. Update `README_AGENT.md`
Add them to the “read when relevant” inventory.

## 3. Prompt Windsurf to restyle/restructure the shell
Especially if Stage 2 UI is already drifting toward generic web app vibes.

---

# Suggested prompt for the agent now

```text
Please read:
- WIREFRAMES.md
- DESIGN_SYSTEM.md
- STAGES.md for the current stage
- TASKING.md

Update the current UI implementation so that Cyril’s shell follows the wireframes and design system.

Priorities:
- desktop-editor feel
- compact top bar
- left nav, center editor, right split sidebar
- internal pane scrolling
- restrained visual styling
- editor-like density
- narrow readable writing column
- typography that clearly distinguishes lyrics, metadata, and utility UI

Avoid:
- card-heavy layout
- oversized controls
- dashboard styling
- excessive whitespace
- playful or bubbly styling

Do not implement future features outside current stage scope.
Focus on shell/layout/styling quality and modularity.
```

---