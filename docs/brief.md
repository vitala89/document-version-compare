# Homework task: Document Version Compare

Thank you for taking the time to do this task. It is designed to take **2 to 3 hours**. Please do not spend more.

## Context

Teams keep structured documents that change over time: handbooks, specifications, policies, contracts. A document is a tree. Sections contain clauses, clauses contain fields and paragraphs, and sections can be nested. New versions of a document are published regularly, and readers need to understand what changed since the version they last read.

## Your task

Build a small **Vue 3** web app that lets a reader open a document, navigate it, and understand the differences between versions.

Mock data is provided in `data/` as three snapshots of the same document: `v1.json`, `v2.json`, `v3.json`. The schema is described in `data/README.md`. No backend is needed. Load the JSON files directly.

## Must have

- Navigate the document structure.
- Show what changed between two versions.
- Works on a laptop screen.

## Deliberately not specified

- How differences should be displayed.
- Which versions can be compared with which.
- How moved, reordered or renamed content should be treated.
- What counts as a change and what counts as noise.
- Who the reader is and what they do after reviewing.

We expect questions. Send them before you start, and we will answer within one business day. If you prefer to proceed on your own assumptions, write them down in the README. Both approaches are fine, but we do read the questions.

## Time box

Stop when you reach the time box. Add a section **"Not done and what I would do next"** to the README. A small, finished, working thing beats a large unfinished one.

## AI tools

We expect you to use AI coding tools. It is how we work. Please:

- Commit your `CLAUDE.md`, `.cursorrules`, or equivalent agent instructions.
- Keep real git history. Do not squash everything into one commit.

## Tech

- Vue 3 with Composition API. TypeScript preferred. Vite.
- Any library is allowed, but justify each dependency in one line in the README.

## Deliverable

A git repository we can clone, public or with an invite for us.

```bash
npm install
npm run dev    # starts the app
```

Include a README with: how to run, your assumptions or the questions you asked, dependencies with one-line justifications, and "Not done and what I would do next".

Good luck, and have fun with it.
