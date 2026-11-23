# Document Version Compare

A small Vue 3 app for a reader who comes back to the Team Handbook after a few
months and wants to see what changed since the version they remember.

**In short**

- Pick any two versions (the older one is always the base); default v2 → v3.
- A summary, then every change grouped by section, or the full newer document
  with a label on each changed item.
- Nodes are matched by `id`; one change per clause; whitespace, markup-only
  and thousand-separator edits are noise and are not counted.
- Three layers: `domain` (the comparison), `view-models` (data for each
  screen), Vue `components`. ESLint keeps the imports pointing one way.
- Untrusted paragraph markup is compared as plain text and rendered only
  through DOMPurify. 98 unit and screen tests; Lighthouse accessibility 100.
- Where to start reading: `src/domain/diff.ts`, then `src/view-models/`, then
  `src/components/ChangesView.vue`.

## Run

```bash
npm install
npm run dev     # starts the app
npm run check   # type check, tests, oxlint, eslint, Prettier format check
```

Node 22.18+ or 24.12+. A Husky pre-commit hook runs `npm run check` on every
commit. If `npm install` fails with `reading 'edgesOut'`, update npm to 11.

## What it does

- **Version picker.** Each list disables versions that would make a wrong
  pair, and neither list changes the other one.
- **Summary.** Total, the pair, a chip per kind (zeros stay visible, muted)
  and how many formatting-only changes were hidden.
- **Changes only** (default). Grouped by section, Travel inside Expenses.
  Before and After with changed words highlighted, "was → now" for values. Old
  values are struck through and every added or removed line says so in words,
  so colour is never the only signal. Values are shown exactly as in the data.
- **Full document.** The newer version with a label on each changed item, a
  Draft tag and notes for removed items. Links open in a new tab, so the
  comparison stays where the reader left it.
- **Contents.** Section tree with counts; a jump moves focus to the heading;
  the highlight follows the section in view. Under 860px it is a bar pinned to
  the top that names the current section; Esc closes its list.
- **States.** A pair with no differences says "No changes between vX and vY."
  No loader, skeleton or error screen on purpose: the versions are JSON files
  bundled into the build, so they are in the browser instantly, nothing is
  fetched, and a broken file stops `npm run build`.

## Questions I asked and assumptions

Asked before starting; answers in
[`docs/questions-and-answers.md`](docs/questions-and-answers.md).

| Question | Answer | What the app does |
| --- | --- | --- |
| Who reads, and what next? | Someone catching up once a quarter; no action in the app | A reading screen, summary first, no approve or comment |
| Which versions? | Any two; older is the base; dozens later | One diff function for any pair |
| Moves and reorder? | A move should be visible; reorder inside a parent is minor | "Moved from Working Hours"; reorder not counted or shown |
| What is noise? | Whitespace and markup-only: my call; `updatedAt` and `version` are context | Hidden from counts, one muted line; version and date in the picker |

Further assumptions: ids are identities (a new id with near-identical text is
removed plus added); sections nest one level as in the data (the comparison
handles any depth); a clause that lost only fields is `field-removed` and stays
in the document as empty; only paragraphs hold markup, so a literal `<` in a
title or value is text, while in a paragraph it must be written as `&lt;`.

## Data audit and edge cases

Found by reading v1, v2 and v3 before any code (details in
[`docs/plan.md`](docs/plan.md), section 1):

| Node | In the data | Handled as |
| --- | --- | --- |
| `cl-hours-holidays` | Moves from Working Hours to Leave | One Moved entry in Leave |
| `sec-comms` | Children reordered | Not counted, not shown |
| `p-leave-sick-1` | Double and trailing spaces | Whitespace noise |
| `f-exp-equipment-limit` | `1,000 EUR` → `1000 EUR` | Number-format noise |
| `cl-sec-access` | Loses its only field | `field-removed`, clause kept as empty |
| `cl-remote-coworking` | New clause, `status: draft` | Added, with a Draft tag |
| `p-exp-reimbursement-1` | New link and `<img onerror>` | Changed on plain text; image removed by the sanitizer |
| `cl-sec-passwords` / `cl-sec-credentials` | Near-identical text, new id | Removed plus added |

## How changes are detected

- Same `id` under another parent is a move; a new title or label is a rename;
  a new or missing `id` is an addition or removal.
- The clause is the counting unit; a section rename or a new section is one
  change.
- Text is compared after removing markup (paragraphs only), collapsing
  whitespace and dropping thousand separators; if only those differ, it is noise.

Counts pinned by tests: v1 → v2 is 11, v2 → v3 is 10, v1 → v3 is 20.

## Architecture

```text
data/*.json → domain (diffDocuments → DiffResult) → view-models → components
                 ↑ useComparison (composables)        security → SafeHtml ↗
```

- `src/domain` answers what changed: entries have a `kind` and a typed
  `reason`, never display text.
- `src/view-models` turn a `DiffResult` into each screen's data (`format`,
  `contents`, `changes`, `fullDocument`); labels live in `format.ts`. A new
  screen adds a view-model; the diff stays the same.
- `src/composables`: `useComparison` is the UI's only way into the domain;
  `useScrollSpy` is the DOM side of scroll tracking.
- `src/components` render view-model output and import only domain types.
  State is three refs in `App.vue`; no router or store.
- ESLint enforces it: no Vue below the components; only `SafeHtml.vue` may use
  the sanitizer, by alias or relative path.

Diagram, trust boundary and decisions: [`docs/architecture.md`](docs/architecture.md).

## Trade-offs

| Choice | Gained | Gave up |
| --- | --- | --- |
| Match by `id` only | Predictable, as the reviewer answered | Passwords → Credentials shows as removed plus added |
| One change per clause | Counts match how a reader thinks about rules | Several edits in one clause count once |
| Two views, not side-by-side | Readable on a laptop; one result feeds both | No column view |
| Hide reorder and formatting noise | Only content changes in the list | Reorders are not shown; noise is only counted |
| Plain text in Changes only, sanitized HTML in Full document | A simple, safe word diff | No bold or links inside Before and After |
| Links open in a new tab | The reader keeps the pair and scroll position | A screen reader does not announce the new tab |
| Versions bundled at build time | Instant, no loading states, no backend | Every version ships in the bundle; fine for dozens |
| Browser APIs for parsing and sanitizing | No extra parser; parsing is inert | A server-side diff needs jsdom or a server sanitizer |
| JSON trusted to match the schema | No validation code in the time box | A duplicate id is silently overwritten; fewer than two versions throws |

## Scaling to more versions

`src/domain/versions.ts` loads `data/v*.json` with `import.meta.glob`, sorted by
the `version` field with no `version - 1` lookups: a new file needs no code
change and gaps are fine (tested with versions 10, 1, 4, 25, 7 and a ten-version
picker). A `computed` around the pure `diffDocuments(base, target)` is enough
for dozens of versions, so there is no result cache; one keyed by `base:target`
is a one-line wrapper when profiling asks for it. For hundreds of versions or
very long documents: load versions lazily (`import.meta.glob` without `eager`,
or `fetch` from an API), load Full document as an async component
(`defineAsyncComponent`), virtualise long sections (for example
`@tanstack/vue-virtual`), and make the picker searchable.

## Security

- **Threat.** Paragraph text is untrusted; v3 already contains
  `<img src="x" onerror="console.log('unsafe render')">`.
- **Controls.** The comparison and Changes only use plain text from an inert
  `DOMParser`. Full document renders only through `sanitizeHtml()`
  (`src/security/sanitize.ts`), a private DOMPurify instance: tags `b`,
  `strong`, `i`, `em`, `code`, `a`; only `href` with `http:` or `https:`;
  `data-*` and `aria-*` dropped; every link gets `rel="noopener noreferrer"`
  and `target="_blank"`. `vue/no-v-html` is an ESLint error except in
  `SafeHtml.vue`.
- **Verified by** unit tests on the real v3 payload, `javascript:`, `data:`,
  foreign `rel`, `target` and `aria-*`, and a screen test that fails when
  SafeHtml skips the sanitizer.
- **Production would add** server-side sanitizing, a Content Security Policy,
  Trusted Types and `npm audit` in CI. `npm audit --omit=dev`: 0 vulnerabilities.

## Dependencies

| Package | Why |
| --- | --- |
| `vue` | The framework the brief asks for |
| `dompurify` | Proven HTML sanitizer for untrusted paragraph markup |
| `diff` | Word-level comparison for the Before and After highlight |
| `@fontsource-variable/inter` | The typeface served locally, no font CDN |
| `vite`, `@vitejs/plugin-vue` | Dev server and build |
| `typescript`, `vue-tsc`, `@vue/tsconfig`, `@tsconfig/node24`, `@types/node` | Type checking |
| `vitest`, `@vue/test-utils`, `jsdom`, `@types/jsdom` | Unit and screen tests |
| `eslint`, `eslint-plugin-vue`, `@vue/eslint-config-typescript`, `vue-eslint-parser`, `@vitest/eslint-plugin`, `jiti` | Linting, including `vue/no-v-html` and the layer rules |
| `oxlint`, `eslint-plugin-oxlint` | Fast correctness lint from the create-vue template |
| `prettier`, `eslint-config-prettier` | Formatting without lint conflicts |
| `npm-run-all2` | Runs the template's build and lint scripts |
| `husky` | Pre-commit hook running `npm run check` |

## Tests

- **Domain:** counts, noise, reorder and per-section counts for every pair;
  move, rename, emptied clause, draft; synthetic cases the data lacks (moved
  nested section, removed top-level section, markup-only edits, a literal `<`,
  identical versions); version gaps.
- **View-models:** labels, section counts, contents tree, scroll-spy maths at
  700 to 1400px windows and a short page, groups in document order, word split.
- **Screens:** the app on the real snapshots (10, 20 and 11 changes, the
  injected image never rendered, Moved and Removed in Full document), the empty
  state, Contents names, jump focus, Esc, the pinned bar, the version picker.
- **Manual:** every screen in Chrome on a laptop and at phone size. Lighthouse
  on desktop and mobile: accessibility 100; best practices 92 only because a
  browser extension logged a console error.

## How I worked with AI tools

- **Automated:** a Claude Code hook blocks edits to `data/v*.json`; Husky runs
  `npm run check` on every commit; ESLint guards `v-html` and the layers; the
  tests pin the counts and the security cases.
- **Manual:** the data audit and the diagram, approving the plan, Chrome checks
  on a laptop and a phone size, Lighthouse, and reviewing and merging every pull
  request on GitHub. The agent made branches, commits and pull requests when
  asked and never merged.
- `AGENTS.md` holds the rules, `CLAUDE.md` imports it, with two Vue skills and a
  read-only `reviewer` subagent (`.claude/agents/reviewer.md`). Architecture and
  the data audit were approved before code. The model was chosen per step:
  strong for the plan, domain, scroll maths and review; fast for setup, UI and
  docs. Every domain task and every bug started with a failing test.
- **Where the AI was wrong and who caught it.** The review in a fresh context
  found a clause that lost only a paragraph counted as removed, a lost rename on
  a moved section, `aria-*` passing the sanitizer, and a literal `<` hiding a
  real change. Chrome checks on a phone found what jsdom cannot see: Esc did not
  close the Contents list, and opening it shifted the page and renamed the
  current section. Each fix has a regression test or a measured check; all are
  in [`docs/ai-log.md`](docs/ai-log.md).

## Not done and what I would do next

I stopped at the time box and kept the app small and finished. In order of
value for the reader:

1. **Deeper nesting on screen.** Recursive sections in Full document, groups by
   section path, counts rolled up to every parent. The diff already handles any
   depth.
2. **Clearer changes.** A "possibly renamed" hint for near-identical removed
   and added clauses (ids stay the truth), and an inline diff that keeps safe
   formatting in Before and After.
3. **Share a comparison as a link:** `base`, `target` and the view in the URL.
4. **Versions from an API.** A skeleton while loading, an error state with
   Retry, `AbortController` so a slow old response cannot replace a newer pair,
   a cache per pair, lazy loading and virtualisation for large documents. Not
   needed while versions are bundled and load instantly.
5. **Validate data on load:** a schema check and duplicate ids with a clear
   message instead of trusting the files.
6. **Browser tests and CI.** A Playwright test of scroll tracking and the
   pinned bar at phone size, where the phone bugs were found by hand, and CI
   running `npm run check`, the e2e test and `npm audit` on every pull request.
