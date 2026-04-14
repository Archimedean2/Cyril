# Cyril — Data Model

## Purpose

This document defines the canonical data model for `.cyril` project files.

It is the source of truth for:
- project structure
- workspace structure
- draft structure
- metadata representation
- inventory persistence
- alternates representation
- chord representation
- display settings
- export settings
- schema versioning

This document defines **what data exists** and **how it is stored**.
It does **not** define UI behavior except where needed to explain data meaning.

If implementation details conflict with this document, update this document intentionally before changing schema behavior.

---

## Design Principles

1. `.cyril` is a structured project format, not plain text
2. A project may contain multiple named drafts
3. Workspaces are first-class project data
4. Structured metadata must not rely on formatting hacks
5. Inventory is stored with project data
6. Chords, alternates, and display settings must be representable without lossy export
7. Schema should be stable, explicit, and migration-friendly

---

## File Format

A `.cyril` file is a UTF-8 JSON document.

### Requirements
- Must be valid JSON
- Must include `schemaVersion`
- Must include a top-level `project` object
- Unknown fields should be preserved where practical during save/load
- Missing optional fields should be treated using documented defaults

---

## Top-Level Schema

```json
{
  "schemaVersion": "1.0.0",
  "project": { ... }
}
```

### Top-level fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `schemaVersion` | string | yes | Semantic version of the `.cyril` schema |
| `project` | object | yes | The full Cyril project |

---

## Project Schema

```json
{
  "id": "proj_001",
  "title": "Playtime's Over",
  "subtitle": "",
  "writers": [],
  "createdAt": "2026-04-12T12:00:00.000Z",
  "updatedAt": "2026-04-12T12:00:00.000Z",
  "workspaces": { ... },
  "drafts": [ ... ],
  "activeDraftId": "draft_001",
  "displaySettings": { ... },
  "exportSettings": { ... },
  "projectSettings": { ... }
}
```

### Project fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique project identifier |
| `title` | string | yes | Project title |
| `subtitle` | string | no | Optional subtitle |
| `writers` | array of Writer | no | Writer metadata |
| `createdAt` | ISO timestamp string | yes | Creation time |
| `updatedAt` | ISO timestamp string | yes | Last modified time |
| `workspaces` | Workspaces object | yes | Non-draft workspaces |
| `drafts` | array of Draft | yes | Named drafts for the song |
| `activeDraftId` | string or null | yes | Currently selected draft |
| `displaySettings` | DisplaySettings | yes | Project-level display defaults |
| `exportSettings` | ExportSettings | yes | Project-level export defaults |
| `projectSettings` | ProjectSettings | yes | Misc project behavior settings |

---

## Writer Schema

```json
{
  "id": "writer_001",
  "name": "Ariel Yahav",
  "role": "lyricist",
  "email": ""
}
```

### Writer fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique writer identifier |
| `name` | string | yes | Writer name |
| `role` | string | no | Optional role, e.g. lyricist, composer |
| `email` | string | no | Optional contact field |

---

## Workspaces Schema

The `workspaces` object stores project-level writing surfaces other than drafts.

```json
{
  "brief": WorkspaceDocument,
  "structure": WorkspaceDocument,
  "hookLab": WorkspaceDocument,
  "vocabularyWorld": WorkspaceDocument
}
```

### Workspace rules
- These are project-level, not draft-level
- Each workspace stores rich text content using the same base document model as non-lyric editing surfaces
- Inventory is **not** stored here; inventory belongs to a draft in schema v1

### WorkspaceDocument schema

```json
{
  "doc": RichTextDocument
}
```

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `doc` | RichTextDocument | yes | The workspace content |

---

## Draft Schema

A project must contain one or more drafts unless explicitly in an empty uninitialized state.

```json
{
  "id": "draft_001",
  "name": "Draft 1",
  "createdAt": "2026-04-12T12:00:00.000Z",
  "updatedAt": "2026-04-12T12:00:00.000Z",
  "mode": "lyrics",
  "doc": DraftDocument,
  "inventory": InventoryDocument,
  "draftSettings": DraftSettings
}
```

### Draft fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique draft identifier |
| `name` | string | yes | Human-readable draft name |
| `createdAt` | ISO timestamp string | yes | Creation time |
| `updatedAt` | ISO timestamp string | yes | Last modified time |
| `mode` | string enum | yes | `"lyrics"` or `"lyricsWithChords"` |
| `doc` | DraftDocument | yes | Structured lyric draft content |
| `inventory` | InventoryDocument | yes | Draft-specific inventory |
| `draftSettings` | DraftSettings | yes | Draft-level settings |

### Draft mode rules
Allowed values:
- `lyrics`
- `lyricsWithChords`

Interpretation:
- `lyrics` = no chord lane expected
- `lyricsWithChords` = chord lane allowed and may be shown throughout the draft

---

## Rich Text Document Model

For v1, all text-bearing documents must use a structured document object rather than raw HTML strings.

### Base structure

```json
{
  "type": "doc",
  "content": []
}
```

### Generic node shape

```json
{
  "type": "paragraph",
  "attrs": {},
  "content": [],
  "marks": []
}
```

This model is intentionally editor-framework-friendly and can map well to ProseMirror/Tiptap-like systems.

### Core node rules
- Every document node has a `type`
- `attrs`, `content`, and `marks` are optional unless required by a specific node type
- Empty content arrays are allowed
- Inline text nodes use `type: "text"` and a `text` field

### Text node example

```json
{
  "type": "text",
  "text": "Welcome to Andy's Room!"
}
```

### Mark example

```json
{
  "type": "text",
  "text": "First Verse",
  "marks": [
    { "type": "bold" }
  ]
}
```

---

## DraftDocument Schema

A draft document is a structured document with lyric-aware block types.

```json
{
  "type": "doc",
  "content": [
    SectionBlock
  ]
}
```

### Rule
At v1, the top-level content of a `DraftDocument` should be composed primarily of `sectionBlock` nodes.

A section block can contain:
- metadata nodes
- lyric line nodes
- non-lyric paragraph nodes if needed

This preserves structure while allowing flexible writing.

---

## SectionBlock Schema

```json
{
  "type": "sectionBlock",
  "attrs": {
    "id": "section_001",
    "sectionType": "verse",
    "label": "First Verse",
    "summary": "Buzz and Woody misunderstand each other",
    "color": "blue"
  },
  "content": [
    ...
  ]
}
```

### SectionBlock attrs

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique section identifier |
| `sectionType` | string enum | yes | e.g. verse, chorus, bridge, intro, outro, spoken, reprise, custom |
| `label` | string | no | Human-readable label |
| `summary` | string | no | Optional section goal/summary |
| `color` | string or null | no | Named or tokenized color identifier |

### Allowed `sectionType` values in v1
- `verse`
- `chorus`
- `bridge`
- `intro`
- `outro`
- `spoken`
- `reprise`
- `custom`

If `sectionType = "custom"`, `label` should normally be present.

---

## Block Types Inside Sections

The following block node types are allowed inside a `sectionBlock` in v1:

- `speakerLine`
- `stageDirection`
- `lyricLine`
- `paragraph`

The editor may choose to render these elegantly, but storage remains explicit.

---

## SpeakerLine Schema

Used when a line or subsequent lyric passage is assigned to a character/speaker.

```json
{
  "type": "speakerLine",
  "attrs": {
    "speaker": "WOODY"
  }
}
```

### SpeakerLine attrs

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `speaker` | string | yes | Character/speaker label |

### Notes
- This node is metadata, not lyric content
- Hiding speaker labels in the UI must not delete this node

---

## StageDirection Schema

```json
{
  "type": "stageDirection",
  "attrs": {
    "text": "Approaching, confident"
  }
}
```

### StageDirection attrs

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `text` | string | yes | Stage direction text |

### Notes
- This is metadata
- It may appear between speaker and lyric lines
- Hiding it in the UI must not delete it

---

## LyricLine Schema

This is the core lyric-bearing line model.

```json
{
  "type": "lyricLine",
  "attrs": {
    "id": "line_001",
    "delivery": "sung",
    "rhymeGroup": null
  },
  "content": [
    { "type": "text", "text": "Welcome to Andy's Room!" }
  ],
  "meta": {
    "alternates": [],
    "prosody": null,
    "chords": []
  }
}
```

### LyricLine attrs

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique line identifier |
| `delivery` | string enum | yes | `"sung"` or `"spoken"` |
| `rhymeGroup` | string or null | no | Optional manual rhyme color/group identifier |

### LyricLine content
- Contains the active text of the line
- Stored as rich text inline content
- May include formatting marks like bold/italic

### LyricLine meta
- Stores features layered onto the line rather than replacing text structure
- Optional in implementation, but canonical in schema

---

## LyricLine Meta Schema

```json
{
  "alternates": [],
  "prosody": null,
  "chords": []
}
```

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `alternates` | array of AlternateLine | yes | Alternate lyric options |
| `prosody` | ProsodyData or null | yes | Cached or computed prosody info |
| `chords` | array of ChordMarker | yes | Chord markers for this line |

---

## Paragraph Schema

For non-lyric rich text inside sections where needed.

```json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "Some note or connective text." }
  ]
}
```

---

## InventoryDocument Schema

Inventory is draft-specific in schema v1.

```json
{
  "type": "inventory",
  "doc": RichTextDocument
}
```

### Notes
- Inventory is intentionally simple in v1
- It stores arbitrary text snippets, lines, words, and notes
- It does not need structured tagging in v1

---

## DraftSettings Schema

```json
{
  "showChords": true,
  "showSectionLabels": true,
  "showSpeakerLabels": true,
  "showStageDirections": true,
  "showSummaries": true,
  "showSyllableCounts": false
}
```

### DraftSettings fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `showChords` | boolean | yes | Draft-level visibility preference |
| `showSectionLabels` | boolean | yes | Show/hide section labels |
| `showSpeakerLabels` | boolean | yes | Show/hide speaker labels |
| `showStageDirections` | boolean | yes | Show/hide stage directions |
| `showSummaries` | boolean | yes | Show/hide section summaries |
| `showSyllableCounts` | boolean | yes | Show/hide syllable count gutter |

### Notes
- These are draft-level view preferences
- Hiding content in the UI must never remove stored data

---

## DisplaySettings Schema

Project-level defaults for visual behavior.

```json
{
  "defaultShowChords": true,
  "defaultShowSectionLabels": true,
  "defaultShowSpeakerLabels": true,
  "defaultShowStageDirections": true,
  "defaultShowSummaries": true,
  "defaultShowSyllableCounts": false,
  "rhymeColorMode": "off"
}
```

### DisplaySettings fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `defaultShowChords` | boolean | yes | Default for new drafts |
| `defaultShowSectionLabels` | boolean | yes | Default for new drafts |
| `defaultShowSpeakerLabels` | boolean | yes | Default for new drafts |
| `defaultShowStageDirections` | boolean | yes | Default for new drafts |
| `defaultShowSummaries` | boolean | yes | Default for new drafts |
| `defaultShowSyllableCounts` | boolean | yes | Default for new drafts |
| `rhymeColorMode` | string enum | yes | `off`, `manual` |

### v1 allowed values for `rhymeColorMode`
- `off`
- `manual`

---

## AlternateLine Schema

Alternates are stored per lyric line in v1.

```json
{
  "id": "alt_001",
  "label": "Alt 1",
  "doc": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Welcome to this strange new room!" }
        ]
      }
    ]
  },
  "isActive": false
}
```

### AlternateLine fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique alternate identifier |
| `label` | string | no | Optional human-readable label |
| `doc` | RichTextDocument | yes | Alternate line content |
| `isActive` | boolean | yes | Whether this alternate is the active choice |

### Alternate rules
- A lyric line may have zero or more alternates
- Exactly zero or one alternate may be active
- If one alternate is active, the main `content` of the lyric line should match that active content after promotion/sync
- The canonical visible text of the line remains in `lyricLine.content`
- Alternates are stored as options, not as the primary source of visible text

### Important implementation note
For schema simplicity in v1:
- `lyricLine.content` stores the currently active text
- `alternates[]` stores non-active options, or optionally the active option as well
- If the active alternate is also stored in `alternates[]`, exactly one `isActive` must be true

---

## ProsodyData Schema

Prosody can be computed dynamically, but if cached it must follow this structure.

```json
{
  "syllableCount": 6,
  "stressPattern": ["S", "u", "S", "u", "u", "S"],
  "lastComputedAt": "2026-04-12T12:00:00.000Z"
}
```

### ProsodyData fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `syllableCount` | number | yes | Estimated syllable count |
| `stressPattern` | array of string | no | Optional stress pattern |
| `lastComputedAt` | ISO timestamp string | no | Optional cache timestamp |

### Notes
- Prosody data is advisory only
- It may be absent or stale
- UI should tolerate null or missing prosody data

---

## ChordMarker Schema

Chords are stored per lyric line.

```json
{
  "id": "chord_001",
  "symbol": "A",
  "position": {
    "anchorType": "char",
    "charOffset": 0,
    "bias": "before"
  }
}
```

### ChordMarker fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique chord marker identifier |
| `symbol` | string | yes | Chord symbol text, e.g. A, D, G, Em |
| `position` | ChordPosition | yes | Placement information relative to lyric line |

---

## ChordPosition Schema

```json
{
  "anchorType": "char",
  "charOffset": 12,
  "bias": "on"
}
```

### ChordPosition fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `anchorType` | string enum | yes | v1 value: `char` |
| `charOffset` | number | yes | Character offset in active lyric text |
| `bias` | string enum | yes | `before`, `on`, or `after` |

### Notes
- `charOffset` is relative to the plain text representation of the active lyric line
- `bias` helps distinguish placement semantics around a boundary
- This model supports positioning before, on, or after lyric text segments
- UI may render using snapping/grid logic, but storage remains character-offset based in v1

### v1 simplification
Only `anchorType = "char"` is allowed.

Future anchor types such as token/grid may be added in later schema versions.

---

## ProjectSettings Schema

```json
{
  "autosave": true,
  "preferredExportMode": "lyricsOnly"
}
```

### ProjectSettings fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `autosave` | boolean | yes | Whether local autosave is enabled |
| `preferredExportMode` | string enum | yes | Default export mode |

### Allowed `preferredExportMode` values
- `lyricsOnly`
- `lyricsWithChords`

---

## ExportSettings Schema

```json
{
  "includeSectionLabels": true,
  "includeSpeakerLabels": true,
  "includeStageDirections": true,
  "includeChords": false,
  "fontPreset": "default",
  "pageDensity": "normal"
}
```

### ExportSettings fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `includeSectionLabels` | boolean | yes | Include section labels in export |
| `includeSpeakerLabels` | boolean | yes | Include speaker labels in export |
| `includeStageDirections` | boolean | yes | Include stage directions in export |
| `includeChords` | boolean | yes | Include chords in export |
| `fontPreset` | string enum | yes | Export font preset |
| `pageDensity` | string enum | yes | Export density/layout mode |

### Allowed `fontPreset` values in v1
- `default`

### Allowed `pageDensity` values in v1
- `normal`
- `compact`

---

## Defaults

If fields are missing, use these defaults unless migration logic says otherwise.

### Default project values
```json
{
  "subtitle": "",
  "writers": [],
  "drafts": [],
  "activeDraftId": null
}
```

### Default display settings
```json
{
  "defaultShowChords": true,
  "defaultShowSectionLabels": true,
  "defaultShowSpeakerLabels": true,
  "defaultShowStageDirections": true,
  "defaultShowSummaries": true,
  "defaultShowSyllableCounts": false,
  "rhymeColorMode": "off"
}
```

### Default draft settings
```json
{
  "showChords": true,
  "showSectionLabels": true,
  "showSpeakerLabels": true,
  "showStageDirections": true,
  "showSummaries": true,
  "showSyllableCounts": false
}
```

### Default project settings
```json
{
  "autosave": true,
  "preferredExportMode": "lyricsOnly"
}
```

### Default export settings
```json
{
  "includeSectionLabels": true,
  "includeSpeakerLabels": true,
  "includeStageDirections": true,
  "includeChords": false,
  "fontPreset": "default",
  "pageDensity": "normal"
}
```

---

## Identity Rules

The following entities must have stable unique IDs:
- project
- writer
- draft
- sectionBlock
- lyricLine
- alternateLine
- chordMarker

### ID requirements
- Must be strings
- Must be unique within their entity type scope
- Must persist across save/load
- Must not be regenerated unnecessarily during edit operations

---

## Timestamp Rules

All timestamps:
- must be ISO 8601 strings
- should be UTC
- must be updated on user-visible data changes

### Minimum timestamp requirements
- project `updatedAt` changes whenever project content changes
- draft `updatedAt` changes whenever that draft changes

---

## Validation Rules

A valid `.cyril` file in schema v1 must satisfy:

1. `schemaVersion` exists
2. `project` exists
3. `project.title` exists
4. `project.workspaces` exists with required workspace keys
5. `project.drafts` exists
6. if `project.activeDraftId` is non-null, it matches a draft ID
7. each draft has `id`, `name`, `mode`, `doc`, `inventory`, `draftSettings`
8. each section block has `id` and `sectionType`
9. each lyric line has `id`, `delivery`, `content`
10. each chord marker has `id`, `symbol`, and valid `position`
11. each alternate has `id`, `doc`, `isActive`

---

## Migration Rules

### General rule
Schema migrations must be explicit.

If the app supports multiple schema versions:
- read old versions
- migrate in memory
- save using the current version only when appropriate

### v1 migration philosophy
- Missing optional fields should be filled with defaults
- Unknown fields should be preserved where practical
- No destructive migration should occur silently

---

## Example Minimal Project

```json
{
  "schemaVersion": "1.0.0",
  "project": {
    "id": "proj_001",
    "title": "Untitled Song",
    "subtitle": "",
    "writers": [],
    "createdAt": "2026-04-12T12:00:00.000Z",
    "updatedAt": "2026-04-12T12:00:00.000Z",
    "workspaces": {
      "brief": {
        "doc": { "type": "doc", "content": [] }
      },
      "structure": {
        "doc": { "type": "doc", "content": [] }
      },
      "hookLab": {
        "doc": { "type": "doc", "content": [] }
      },
      "vocabularyWorld": {
        "doc": { "type": "doc", "content": [] }
      }
    },
    "drafts": [
      {
        "id": "draft_001",
        "name": "Draft 1",
        "createdAt": "2026-04-12T12:00:00.000Z",
        "updatedAt": "2026-04-12T12:00:00.000Z",
        "mode": "lyrics",
        "doc": {
          "type": "doc",
          "content": []
        },
        "inventory": {
          "type": "inventory",
          "doc": { "type": "doc", "content": [] }
        },
        "draftSettings": {
          "showChords": true,
          "showSectionLabels": true,
          "showSpeakerLabels": true,
          "showStageDirections": true,
          "showSummaries": true,
          "showSyllableCounts": false
        }
      }
    ],
    "activeDraftId": "draft_001",
    "displaySettings": {
      "defaultShowChords": true,
      "defaultShowSectionLabels": true,
      "defaultShowSpeakerLabels": true,
      "defaultShowStageDirections": true,
      "defaultShowSummaries": true,
      "defaultShowSyllableCounts": false,
      "rhymeColorMode": "off"
    },
    "exportSettings": {
      "includeSectionLabels": true,
      "includeSpeakerLabels": true,
      "includeStageDirections": true,
      "includeChords": false,
      "fontPreset": "default",
      "pageDensity": "normal"
    },
    "projectSettings": {
      "autosave": true,
      "preferredExportMode": "lyricsOnly"
    }
  }
}
```

---

## Example Project with Structured Lyric Content

```json
{
  "schemaVersion": "1.0.0",
  "project": {
    "id": "proj_002",
    "title": "Playtime's Over",
    "subtitle": "",
    "writers": [
      {
        "id": "writer_001",
        "name": "Ariel Yahav",
        "role": "lyricist",
        "email": ""
      }
    ],
    "createdAt": "2026-04-12T12:00:00.000Z",
    "updatedAt": "2026-04-12T12:00:00.000Z",
    "workspaces": {
      "brief": {
        "doc": {
          "type": "doc",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Buzz Lightyear has just emerged from his cardboard spaceship."
                }
              ]
            }
          ]
        }
      },
      "structure": {
        "doc": {
          "type": "doc",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Verse 1: Woody treats Buzz as a confused newcomer."
                }
              ]
            }
          ]
        }
      },
      "hookLab": {
        "doc": { "type": "doc", "content": [] }
      },
      "vocabularyWorld": {
        "doc": { "type": "doc", "content": [] }
      }
    },
    "drafts": [
      {
        "id": "draft_001",
        "name": "Main Draft",
        "createdAt": "2026-04-12T12:00:00.000Z",
        "updatedAt": "2026-04-12T12:00:00.000Z",
        "mode": "lyricsWithChords",
        "doc": {
          "type": "doc",
          "content": [
            {
              "type": "sectionBlock",
              "attrs": {
                "id": "section_001",
                "sectionType": "verse",
                "label": "First Verse",
                "summary": "Woody welcomes Buzz; Buzz misunderstands everything",
                "color": "blue"
              },
              "content": [
                {
                  "type": "speakerLine",
                  "attrs": {
                    "speaker": "WOODY"
                  }
                },
                {
                  "type": "stageDirection",
                  "attrs": {
                    "text": "Approaching, confident"
                  }
                },
                {
                  "type": "lyricLine",
                  "attrs": {
                    "id": "line_001",
                    "delivery": "sung",
                    "rhymeGroup": "A"
                  },
                  "content": [
                    {
                      "type": "text",
                      "text": "Welcome to Andy's Room!"
                    }
                  ],
                  "meta": {
                    "alternates": [],
                    "prosody": {
                      "syllableCount": 6,
                      "stressPattern": ["S", "u", "S", "u", "S", "S"],
                      "lastComputedAt": "2026-04-12T12:00:00.000Z"
                    },
                    "chords": [
                      {
                        "id": "chord_001",
                        "symbol": "A",
                        "position": {
                          "anchorType": "char",
                          "charOffset": 0,
                          "bias": "before"
                        }
                      },
                      {
                        "id": "chord_002",
                        "symbol": "D",
                        "position": {
                          "anchorType": "char",
                          "charOffset": 11,
                          "bias": "on"
                        }
                      },
                      {
                        "id": "chord_003",
                        "symbol": "A",
                        "position": {
                          "anchorType": "char",
                          "charOffset": 18,
                          "bias": "after"
                        }
                      }
                    ]
                  }
                },
                {
                  "type": "speakerLine",
                  "attrs": {
                    "speaker": "BUZZ"
                  }
                },
                {
                  "type": "stageDirection",
                  "attrs": {
                    "text": "Scanning the area"
                  }
                },
                {
                  "type": "lyricLine",
                  "attrs": {
                    "id": "line_002",
                    "delivery": "sung",
                    "rhymeGroup": null
                  },
                  "content": [
                    {
                      "type": "text",
                      "text": "Is that the name you gave this planet?"
                    }
                  ],
                  "meta": {
                    "alternates": [
                      {
                        "id": "alt_001",
                        "label": "Alt 1",
                        "doc": {
                          "type": "doc",
                          "content": [
                            {
                              "type": "paragraph",
                              "content": [
                                {
                                  "type": "text",
                                  "text": "Is that what you call this planet?"
                                }
                              ]
                            }
                          ]
                        },
                        "isActive": false
                      }
                    ],
                    "prosody": {
                      "syllableCount": 9,
                      "lastComputedAt": "2026-04-12T12:00:00.000Z"
                    },
                    "chords": [
                      {
                        "id": "chord_004",
                        "symbol": "Em",
                        "position": {
                          "anchorType": "char",
                          "charOffset": 0,
                          "bias": "before"
                        }
                      },
                      {
                        "id": "chord_005",
                        "symbol": "A",
                        "position": {
                          "anchorType": "char",
                          "charOffset": 26,
                          "bias": "on"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        },
        "inventory": {
          "type": "inventory",
          "doc": {
            "type": "doc",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "planet / granite / panic it"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "spare line: Good. How's the air here? Wait, I'll scan it."
                  }
                ]
              }
            ]
          }
        },
        "draftSettings": {
          "showChords": true,
          "showSectionLabels": true,
          "showSpeakerLabels": true,
          "showStageDirections": true,
          "showSummaries": true,
          "showSyllableCounts": true
        }
      }
    ],
    "activeDraftId": "draft_001",
    "displaySettings": {
      "defaultShowChords": true,
      "defaultShowSectionLabels": true,
      "defaultShowSpeakerLabels": true,
      "defaultShowStageDirections": true,
      "defaultShowSummaries": true,
      "defaultShowSyllableCounts": false,
      "rhymeColorMode": "manual"
    },
    "exportSettings": {
      "includeSectionLabels": true,
      "includeSpeakerLabels": true,
      "includeStageDirections": true,
      "includeChords": true,
      "fontPreset": "default",
      "pageDensity": "normal"
    },
    "projectSettings": {
      "autosave": true,
      "preferredExportMode": "lyricsWithChords"
    }
  }
}
```

---

## Schema Evolution Notes

The following future additions are anticipated but not part of schema v1:
- phrase-level or word-level alternates
- comments
- account-based sharing metadata
- transposition settings
- richer inventory structure
- global vault linkage
- auto-rhyme analysis
- multiple export presets
- collaboration metadata

Do not add these fields until intentionally versioned.

---

## Implementation Guidance

### For coding agents
- Treat `DATA_MODEL.md` as canonical
- Do not replace structured nodes with raw HTML blobs for convenience
- Do not flatten lyric structure into plain paragraphs if a feature depends on semantic nodes
- Do not store visibility toggles by deleting hidden nodes
- Do not invent new top-level keys unless the schema is being updated intentionally

### For partial implementation stages
If a later-stage field is not yet supported in UI:
- it may still appear in schema with default values
- implementation may ignore it temporarily
- save/load logic should preserve it if present


---

## Local Tool Cache Model

Cyril may persist normalized lexical tool results locally so repeated lookups can be served without always calling an external provider.

### Entity: ToolQueryCacheEntry

Suggested fields:

- `id: string`
- `toolType: ToolType`
- `query: string`
- `provider: string`
- `normalizedResults: ToolResultPayload`
- `fetchedAt: string`
- `lastUsedAt: string`
- `version?: string`
- `projectIds?: string[]`
- `sourceMeta?: Record<string, unknown>`

### Notes
- `toolType` should distinguish lookup classes such as exact rhyme, near rhyme, dictionary, thesaurus, idioms, or related terms
- `normalizedResults` should use Cyril-owned internal result shapes, not raw provider payloads as the canonical app contract
- `projectIds` is optional metadata only; first implementation may use app-local cache rather than strict per-project partitioning
- `sourceMeta` may store minimal provider/source details if useful, but avoid overcommitting to provider-specific schemas

### Persistence rules
- cache entries should be stored locally
- repeated lookups should update `lastUsedAt`
- if a provider response is refreshed, `fetchedAt` should update
- if provider constraints make full payload storage undesirable, persist only the normalized subset needed for Cyril features and record the limitation in `PROGRESS.md`

### Modeling guidance
- treat cached lexical data as supporting reference data, not as part of the canonical song draft content
- do not let cache storage bypass the provider abstraction layer
- do not store UI-only formatting state as canonical cached data

```