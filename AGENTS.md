# AGENTS.md

Single source of rules for every coding agent in this repository.

## Product

A reader opens a Team Handbook and sees what changed between two versions. They catch up about once a quarter, are not the author, and take no action in the app. No approve, no comments.

- Brief: `docs/brief.md`
- Questions and the reviewer's answers: `docs/questions-and-answers.md`
- Architecture and diagram: `docs/architecture.md`
- Plan and expected counts: `docs/plan.md`

## Stack

Vue 3, Composition API, `<script setup lang="ts">`, Vite, Vitest. No router, no Pinia, no backend. State lives in `App.vue`: base version, target version, view mode.

## Layers

Imports point down only (ESLint `no-restricted-imports` enforces it).

- `src/domain/` is the comparison only: plain TypeScript, no Vue, no display text, no per-screen data. Each entry has a `kind` (for counts) and a typed `reason` (`'added' | 'removed' | 'changed' | 'renamed' | 'moved' | 'field-removed'`).
- `src/view-models/` holds plain functions that turn a `DiffResult` into what each screen needs, in four modules by area: `format.ts` (labels, `changeCount`, `sectionCounts`), `contents.ts` (contents tree and scroll-spy maths), `changes.ts` (Changes only groups and word split), `fullDocument.ts` (marks and removed notes). No Vue.
- `src/security/` holds the sanitizer, used only by `SafeHtml.vue`.
- `src/composables/` are Vue. `useComparison` is the UI's only way into the domain (it also exposes the version list). `useScrollSpy` is the DOM side of scroll tracking.
- `src/components/` are Vue. Components render view-model output, import only types from `src/domain`, and never compute diffs or branch on display text.

A new screen gets a new view-model with a test; the domain stays unchanged. Follow `docs/architecture.md`.

## Fixtures

`data/v*.json` are read-only input snapshots. Never edit them.

## Security

Paragraph text may contain inline markup and is untrusted.

- `v-html` is forbidden (`vue/no-v-html` is an ESLint error) except in `src/components/SafeHtml.vue`, which renders only the output of `sanitizeHtml()` from `src/security/sanitize.ts`.
- Allowlist: `b`, `strong`, `i`, `em`, `code`, `a`. Links only with `http:` or `https:`, always `rel="noopener noreferrer"` and `target="_blank"`, so a link never replaces the comparison the reader is on.
- Diffing always works on plain text.

## Diff rules (summary)

- Match nodes by id. Same id, other parent: moved. Same id, new title or label: renamed (kind changed). New id: added. Missing id: removed.
- Counting unit is the clause. A section rename is one entry. A whole new section is one entry. A clause that only lost fields has reason `field-removed`.
- Noise, not counted: whitespace, markup-only changes, thousand separators.
- Reordering children inside one parent is not counted and never shown as removed plus added.
- `version` and `updatedAt` are context for the version picker, not changes.
- The base is always the older version.

## Skills

Use the installed `vue-best-practices` skill for components and composables and `vue-testing-best-practices` for component tests.

## Model choice

The model for each step is set in the plan (strong for plan, domain, scroll maths and review; fast for setup, UI and docs). Do not stop to ask for a switch and do not switch models yourself. If a task is clearly beyond the current model, say so in one line and carry on.

## Fixtures guard

A Claude Code hook (`.claude/hooks/guard-fixtures.mjs`) blocks edits to `data/v*.json`.

## Work log

When I tell you I checked or rejected something, append a complete row to `docs/ai-log.md` (Step, Model, What the agent did, What I checked, changed, rejected or verified, Result). If there is a related code change, commit the row with that change. If it is only a log row, leave it uncommitted until I ask you to commit the log.

## Commands

- `npm run dev` starts the app.
- `npm run check` runs type check, unit tests, lint and a Prettier format check (no auto-fix) and must pass before every commit.

## Working rules

- Work only on the task you were given; list anything else under Follow-ups instead of doing it.
- Domain changes: write a failing test first, then code. Found a bug: write a failing regression test first, then fix it.
- Do not add a dependency without asking.
- Accessibility is part of done: heading order, visible focus, labels that do not rely on colour, keyboard access for every control.
- Log each phase in `docs/ai-log.md` (what the agent did and what I checked, changed, rejected or verified).

## Commits

- One logical change per commit, with its tests in the same commit.
- Message: `type(scope): what changed`. Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `style`.
- Non-trivial commits get a short body (1-3 lines) on why the change is made; trivial setup and log commits need only the subject.
- Never commit when `npm run check` is failing. Commit with plain `git commit`: a Husky pre-commit hook runs `npm run check` and blocks a red commit; never use `--no-verify`.
- When I ask you, including with a ready prompt, you may create branches from an up-to-date main (`git checkout main && git pull && git checkout -b ...`), commit, push, and open a pull request into main with title and body What, Why, How to test. Never merge. Do not push or open a pull request unless asked.
