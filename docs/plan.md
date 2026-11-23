# Implementation plan

Status: waiting for approval before any code. Sources: `docs/brief.md`, `docs/questions-and-answers.md`, `data/`, `AGENTS.md`, `docs/architecture.md`.

## 1. Data audit and edge cases

Derived by reading all three snapshots before any code.

| Case | Pair | Node ids | Treatment |
| --- | --- | --- | --- |
| Clause moves to another section | v1→v2 | `cl-hours-holidays`: `sec-hours` → `sec-leave` | `moved`, shown in Leave as "Moved from Working Hours", never as removed plus added |
| Children reordered inside a parent | v1→v2 | children of `sec-comms` (`cl-comms-channels` and `cl-comms-meetings` swap) | not counted, not shown as removed plus added |
| Whitespace only | v1→v2 | `p-leave-sick-1` (double space, trailing space) | noise |
| Number format only | v1→v2 | `f-exp-equipment-limit`: `1,000 EUR` → `1000 EUR` | noise |
| Field label renamed | v1→v2 | `f-hours-overtime-max`: "Max weekly overtime" → "Maximum weekly overtime (hours)" | `changed`, reason `renamed` |
| Date value in content | v1→v2 | `f-intro-reviewed`: `2026-01-15` → `02.04.2026` | `changed`: the value differs, shown as in the data |
| New id with near-identical text | v1→v2 | `cl-sec-passwords` removed, `cl-sec-credentials` added | removed plus added: ids are identities. A "possibly renamed" hint is Not done |
| Whole section added | v1→v2 | `sec-remote` with 3 clauses | one `added` entry, its clauses are not counted separately |
| Section renamed | v2→v3 | `sec-hours`: Working Hours → Working Time | `changed`, reason `renamed` |
| Clause loses its only field | v2→v3 | `f-sec-access-cadence` in `cl-sec-access` | `removed`, reason `field-removed`; the clause stays in the document and is not listed as a removed clause |
| New clause with draft status | v2→v3 | `cl-remote-coworking`, `status: draft` | `added` plus a Draft tag |
| Unsafe markup and a new link | v2→v3 | `p-exp-reimbursement-1`: adds `<a href>` and `<img onerror>` | `changed` on plain text; Full document renders sanitized HTML |

`version` and `updatedAt` (v1 `2026-01-15`, v2 `2026-04-02`, v3 `2026-09-18`) are shown in the version picker labels, never diffed.

Synthetic cases the fixtures do not have, covered by tests on hand-made documents (never by editing `data/`): markup-only change (noise), nested section moved to another parent (reported under the new parent), top-level section removed (one entry under root), whitespace-only change in a section or clause title (noise), reordered top-level sections (not counted), identical versions (no entries).

## 2. Diff rules

1. Flatten each version into `Map<id, { node, parentId, topSectionId, subsectionId }>`, any depth.
2. Match by `id`. The base is always the older version.
3. Change kinds: same id with another parent: `moved`. Same id with a new title or label: `changed`, reason `renamed`. New id: `added`. Missing id: `removed`.
4. Counting unit is the clause:
   - Section: title change → one `changed` entry, reason `renamed`. New section → one `added` entry, its clauses are not counted separately. Removed section → one `removed` entry. A section that moved and was renamed is one `moved` entry with a title detail.
   - Clause: one entry per clause, all field and paragraph differences go into its `details`. A moved clause that also changed is one `moved` entry with details. A clause title change together with an added field and an added paragraph is one entry with three details.
   - A clause whose only real details are removed fields gets kind `removed` and reason `field-removed`.
5. Noise: paragraph text compares `normalize(plainText(x))`; titles, labels and field values hold no markup, so they compare `normalize(x)` as plain strings and a literal `<` stays text. `normalize` collapses whitespace, trims, and removes thousand separators between digits. Equal after normalize but different raw → a noise item (`whitespace`, `markup` or `number-format`), not an entry.
6. Reorder: same parent, same surviving ids, different order → `reorderedParents`, not an entry. Detected in one linear pass.
7. Section attribution: an entry belongs to the target's top-level section (for removed nodes: the base's). A nested section (`sec-travel`) gets its own count, and the parent count includes it. A moved entry counts in its new section.

## 3. Expected counts

| Pair | Total | Added | Removed | Changed | Moved | Noise | Reordered parents |
| --- | --- | --- | --- | --- | --- | --- | --- |
| v1→v2 | 11 | 3 | 2 | 5 | 1 | 2 | 1 (`sec-comms`) |
| v2→v3 | 10 | 1 | 1 | 8 | 0 | 0 | 0 |
| v1→v3 | 20 | 3 | 3 | 13 | 1 | 2 | 1 (`sec-comms`) |

Working, v1→v2 (11):

- added: `cl-sec-credentials`, `cl-tool-cursor`, `sec-remote` (3 clauses inside, one entry)
- removed: `cl-sec-passwords`, `cl-tool-trello`
- changed: `cl-intro-control` (reviewed date), `cl-hours-overtime` (field label, `renamed`), `cl-leave-annual` (25 → 27 days), `cl-travel-hotels` (150 → 170 EUR), `cl-tool-chatgpt` (Restricted → Approved)
- moved: `cl-hours-holidays`
- noise: `cl-leave-sick` (whitespace), `cl-exp-equipment` (number format)

Working, v2→v3 (10):

- added: `cl-remote-coworking` (draft)
- removed: `cl-sec-access` (`field-removed`)
- changed: `sec-hours` (`renamed`), `cl-travel-flights` (six → eight hours), `cl-exp-reimbursement` (portal link; unsafe image dropped by the sanitizer), `cl-tool-grammarly` (Restricted → Retired), `cl-tool-claude` (Anthropic → Anthropic PBC), `cl-tool-zapier` (Restricted → Approved), `cl-tool-dropbox` (Restricted → Retired), `cl-comms-response` (4 → 2 working hours)

Working, v1→v3 (20): the union of both lists without double counting. `sec-remote` is one `added` entry (it contains `cl-remote-coworking`), `cl-sec-access` is `removed` with `field-removed`, `sec-hours` is `renamed`, and the 13 changed clauses are the five from v1→v2 plus the eight from v2→v3. Noise and reorder are the same as v1→v2.

Per section:

| Pair | Counts |
| --- | --- |
| v1→v2 | Introduction 1, Working Hours 1, Leave 2, Expenses 1 (Travel 1), Security 2, Approved Tools 3, Remote Work 1 |
| v2→v3 | Working Time 1, Expenses 2 (Travel 1), Security 1, Approved Tools 4, Communication 1, Remote Work 1 |
| v1→v3 | Introduction 1, Working Time 2, Leave 2, Expenses 3 (Travel 2), Security 3, Approved Tools 7, Communication 1, Remote Work 1 |

## 4. Types

`src/domain/types.ts`:

```ts
FieldNode       { id; type: 'field'; label; value }
ParagraphNode   { id; type: 'paragraph'; text }
ClauseNode      { id; type: 'clause'; title; status?; children: (FieldNode | ParagraphNode)[] }
SectionNode     { id; type: 'section'; title; children: (SectionNode | ClauseNode)[] }
DocNode         = SectionNode | ClauseNode | FieldNode | ParagraphNode
DocumentVersion { id; version; title; updatedAt; children: SectionNode[] }

ChangeKind   = 'added' | 'removed' | 'changed' | 'moved'
ChangeReason = 'added' | 'removed' | 'changed' | 'renamed' | 'moved' | 'field-removed'
Detail =
  | { type: 'title'; before; after }
  | { type: 'status'; before?; after? }
  | { type: 'field-value'; label; before; after }
  | { type: 'field-label'; before; after }
  | { type: 'field-added' | 'field-removed'; label; value }
  | { type: 'text'; before; after }                 // plain text
  | { type: 'text-added' | 'text-removed'; text }
DiffEntry  { id; kind: ChangeKind; reason: ChangeReason; scope: 'section' | 'clause'; title;
             parentId: string | null; sectionId; subsectionId?; movedFrom?;
             details: Detail[]; node?: ClauseNode | SectionNode }
DiffResult { base; target; entries: DiffEntry[];
             counts: Record<ChangeKind, number> & { total };
             noise: { id; reason: 'whitespace' | 'markup' | 'number-format' }[];
             reorderedParents: string[] }
```

`DiffResult` carries no labels, section counts, marks or removed notes: those are built by the view-models and never stored in it.

`src/view-models`, plain functions over `DiffResult`:

| Module | Functions | Input |
| --- | --- | --- |
| `format.ts` | `reasonLabel`, `reasonTone`, `changeCount(n)`, `sectionCounts(entries)` (parents include nested) | a reason, a number, `DiffResult.entries` |
| `contents.ts` | `contentsTree(result, mode)`; later `pickActive`, `readingLine` | `DiffResult`, `'changes' \| 'full'` |
| `changes.ts` | `changeGroups(result)` (nested sections as their own group), paragraph text; later `wordSegments(before, after)` | `DiffResult` |
| `fullDocument.ts` | `documentMarks(result)` (reason per surviving node), `removedNotes(result)` (removed nodes by parent) | `DiffResult` |

## 5. Task graph

| Task | Files | Acceptance | Tests | Commit | Depends | Cut? |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | `types.ts`, `versions.ts` | `createCatalog(list)` sorts by `version`, looks versions up, works with gaps; fed by `import.meta.glob` | versions.spec (10, 1, 4, 25, 7; "Unknown version") | `feat(domain): load document versions` | | no |
| T2 | `flatten.ts`, `text.ts` | index with parent, section and subsection at any depth; `plainText` via `DOMParser`; `normalize` | text.spec (literal `<`, entities) | `feat(domain): index nodes and normalize text` | T1 | no |
| T3 | `diff.ts` | rules of section 2; counts of section 3 | diff.spec on the fixtures, diff.edge.spec on synthetic documents | `feat(diff): compare two versions by id` | T2 | no |
| T4 | `src/security/sanitize.ts`, `SafeHtml.vue` | private DOMPurify instance, allowlist from AGENTS.md, http/https only, `rel="noopener noreferrer"` and `target="_blank"` | sanitize.spec (real `onerror` payload, `javascript:`, `data:`, https link) | `feat(security): sanitize paragraph markup` | T1 | no |
| T5 | `src/view-models/format.ts` | labels and a tone for every reason, `changeCount`, section counts with nested rolled up | format.spec | `feat(view-models): labels, change counts and section counts` | T3 | no |
| T6 | `src/view-models/contents.ts` | contents tree, one nested level | contents.spec | `feat(view-models): contents tree` | T5 | no |
| T7 | `src/view-models/changes.ts` | Changes only groups, Travel inside Expenses | changes.spec | `feat(view-models): changes only groups` | T5 | no |
| T8 | `src/view-models/fullDocument.ts` | marks and removed notes; `cl-sec-access` is not a removed clause | fullDocument.spec | `feat(view-models): full document marks and removed notes` | T5 | no |
| T9 | `src/styles/*`, `main.ts`, font | colour tokens, Inter, base layout | manual | `style: add color tokens, Inter font and base layout` | | font |
| T10 | `App.vue`, `useComparison.ts`, `VersionPicker.vue` | default pair v2→v3; invalid options disabled in both lists; neither list changes the other | VersionPicker.spec | `feat(ui): add shell and version picker` | T3, T9 | no |
| T11 | `ChangeSummary.vue` | one compact card: total, pair chip, four kind chips, mix bar | App.spec (10, then 20) | `feat(ui): add change summary` | T5, T10 | no |
| T12 | `ContentsNav.vue` | counts per section, accessible name "Travel, 1 change", click scrolls and focuses the heading | ContentsNav.spec | `feat(ui): add contents navigation` | T6, T10 | no |
| T13 | `ChangesView.vue` | Before/After for text, "was → now" for values, values as in data, empty state | App.spec | `feat(ui): add changes view` | T7, T10 | no |
| T14 | `FullDocumentView.vue` | target document with marks, Draft tag and removed notes; paragraphs via SafeHtml | App.spec (no `<img>`, safe link, XSS fails without the sanitizer) | `feat(ui): add full document view` | T4, T8, T10 | no |
| T15 | `changes.ts`, `TextDiff.vue`, `ChangeSummary.vue` | changed words highlighted (`diffWordsWithSpace`); "N formatting-only changes hidden" | changes.spec (round trip of both sides) | `feat(ui): highlight changed words`, `feat(ui): show hidden formatting noise count` | T13 | yes |
| T16 | `contents.ts`, `useScrollSpy.ts`, `ContentsNav.vue`, `ContentsList.vue` | highlight follows scrolling; pinned Contents bar under 860px | contents.spec (`pickActive`, `readingLine`), ContentsNav.spec | `feat(ui): follow the current section while scrolling`, `feat(ui): pin contents to the top on narrow screens` | T12 | yes |

Cut order if time runs out: word highlight (T15), pinned bar (T16, second half), hidden noise line (T15, second half). Full document and scroll tracking stay. README and acceptance checks follow the task graph.

## 6. Open questions

None blocking. Resolved: values are shown exactly as in the data; Full document renders sanitized HTML, Changes only shows plain text; a muted line reports hidden noise.
