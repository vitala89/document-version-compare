# Work log

| Step | Model | What the agent did | What I checked, changed or rejected | Result |
| --- | --- | --- | --- | --- |
| Setup | - | Scaffolded with create-vue, copied fixtures, brief and Q&A | Checked: `git log` shows my name, `data/` has three snapshots | OK |
| Rules and guardrails | fast | AGENTS.md, CLAUDE.md, lint and layer rules, check script, Husky, fixtures hook | Checked: a temporary Vue import in src/domain and a type error: lint and commit blocked. Read AGENTS.md. The fixtures hook script returns exit 2 for data/v1.json | OK |
| Plan and architecture | strong | Data audit, diagram, decision table, plan with expected counts | Checked the data audit; counts 11/10/20 and the per-section counts for v2 to v3 match; diagram has one box per layer; changed: index fields in the plan now match the code | Approved |
| Domain and security | strong | diffDocuments, version catalog, sanitizer, SafeHtml, tests | Read the test names; counts 11/10/20 and the onerror test pass | OK |
| v-html guardrail | strong | Added a raw v-html to a temporary component | Deliberate check: npm run check failed on vue/no-v-html; the file was removed and not committed | OK |
| Review before PR 2 | strong, reviewer subagent | Fresh-context review of feat/diff-engine: 9 findings, no blockers | Compared the two should findings with AGENTS.md and docs/plan.md section 2: the code did not match. Fixed now with failing regression tests first: field-removed only for lost fields, rename kept on a moved section; added explicit v1 to v3 checks. Moved to Not done: other edge tests, movedFrom from top level, root sentinel, href-only noise, relative-import lint. Rejected: README link in a comment (README comes later) | Fixed |
