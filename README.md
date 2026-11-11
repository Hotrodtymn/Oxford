# Oxford

**Oxford** is an in-development writing assistant built with React and TypeScript. Its browser-based editor analyzes text locally and offers actionable spelling, grammar, and style suggestions.

> **Status:** Active development. This is a rule-based local writing assistant, not a full Grammarly replacement or a cloud AI service.

## Current features

- Write or paste text into a highlighted editor.
- Detect supported spelling and grammar issues using local rules.
- Review suggestions and apply individual corrections; changes are checked against the original text before replacement.
- Review and dismiss style suggestions.
- View live word and character counts.
- Edit the document title during the current session.
- Accessible editor labels and supporting usability tests.

Oxford currently performs its initial analysis in the browser. Broader language coverage and more advanced clarity analysis remain future work.

## Technology

- React 19, TypeScript, Vite 8
- Local grammar, spelling, and style checking modules
- Oxlint for linting
- Node.js test runner for writing-engine and editor tests

## Getting started

Install Node.js and npm, then run:

```bash
npm ci
npm run dev
```

Open the local address printed by Vite.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |
| `npm test` | Run grammar, style, writing-engine, and editor accessibility tests |
| `npm run benchmark` | Run the writing-quality benchmark script |

## How suggestions work

The app calls its local writing-analysis pipeline as editor content changes. Suggestions identify text ranges and proposed replacements. Before applying a suggestion, the editor verifies that the source text at that range still matches, preventing an outdated suggestion from overwriting newer edits.

Rule-based checking has limited language coverage and can produce false positives. Review suggestions before accepting them.

## Roadmap

- Expand grammar and spelling coverage.
- Improve style and clarity feedback.
- Continue accessibility, accuracy, and usability testing.

## Project structure

- `src/App.tsx` — writing workspace and suggestion interactions
- `src/features/grammar/` — grammar and spelling logic and suggestion UI
- `src/features/style/` — style checks
- `src/features/writing/` — writing-analysis pipeline

This repository is named `Oxford-grammer-app` on GitHub; the application itself is called **Oxford**.
