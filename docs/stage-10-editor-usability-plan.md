# Oxford Stage 10.1: Editor usability audit and implementation plan

Date: 2026-11-05. Repository: `D:\Projects\Oxford-grammer-app`. Baseline: `main`, commit `e63ff5f`.

This is a source-based audit and implementation proposal. No application code, rules, dependencies, or AI integration were changed. Browser, mobile, assistive-technology, and performance observations below are risks inferred from code unless explicitly described as command results.

## 1. Current editor architecture

- `src/App.tsx` owns controlled title/content state and a session-only array of dismissed style IDs. It calls synchronous `analyzeWriting(content)` through `useMemo` on each content change. Title and dismiss updates reuse the memoized analysis. It separates grammar/spelling issues from optional style suggestions and renders both panels below the editor. Counts are separate, not a combined total.
- `src/features/writing/localEngines.ts` adapts the grammar and style checkers, attaches `sourceEngine`, and registers both local engines. `engine.ts` defines the suggestion union and engine contract and merges results by start/end offsets.
- `src/features/grammar/grammarChecker.ts` defines `WritingIssue`, a spelling dictionary, regex grammar/punctuation/capitalization checks, case preservation, and greedy overlap filtering (earlier positions, longer matches first at equal starts). These are bounded local checks, not comprehensive proofreading.
- `src/features/style/styleChecker.ts` defines `WritingStyleSuggestion`, optional concise-phrase and supported request rewrites, capitalization handling, source ranges, and its own overlap filtering. Neither checker globally resolves overlaps with the other engine.
- `src/features/grammar/HighlightedEditor.tsx` renders a native controlled textarea over an `aria-hidden` mirror. The textarea text is transparent with a visible caret; the mirror renders text and marked spans. Invalid source slices are omitted; overlapping ranges are skipped after sorting by start. Scroll positions are copied on scroll, select, and the animation frame after input. The mirror has no pointer interaction.
- `src/App.css` defines shared editor/mirror typography, grammar orange wavy underlines, spelling blue wavy underlines, style purple dotted underlines, card labels, focus styling, and a 600px responsive breakpoint. `src/index.css` supplies global typography, root alignment, color-scheme and dark-preference variables. `src/main.tsx` imports global styles and renders App under StrictMode.
- `src/features/writing/asyncEngine.ts` contains a separate optional async contract and coordinator. New analyses abort their predecessor and increment a revision. Updates/progress are suppressed when superseded or cancelled. Local results remain available on missing-engine/error paths. Async ranges require integer ordered bounds and matching original text. `isAnalysisCurrent` checks revision plus exact document; `canApplyAsyncSuggestion` adds range validation. Superseded promises can still resolve with a snapshot, so callers must retain currentness checks even though stale callbacks are suppressed. The current App does not instantiate this coordinator or expose its states.
- `src/lib/` and `src/types/` do not exist. Types live with their feature implementations. No AGENTS.md was found in the inspected repository/ancestor paths.

## 2. Existing functionality inventory to preserve

| Area | Existing behavior |
| --- | --- |
| Input | Native multiline editing, selection, clipboard and keyboard behavior; controlled title (120-character limit), content, placeholder, word/character counts; no persistence in App |
| Analysis | Immediate local grammar/spelling/style checks, source identity, messages, capitalization and exact source ranges |
| Application | Apply for grammar/spelling and Accept for style; functional state updater checks `current.slice(start,end) === original`, replaces only that span, then recomputes suggestions |
| Dismissal | Style-only Dismiss hides its card and underline without editing content; grammar/spelling cannot be dismissed |
| Highlights | Decorative mirror avoids duplicate screen-reader text; original-slice validation, overlap skipping, synchronized scrolling, vertically resizable textarea |
| Keyboard | Native Tab/Shift+Tab and button Enter/Space activation; no custom editor shortcuts, suggestion traversal, active issue or card-to-range selection |
| Accessibility | Named title and textarea, main/header/headings, native buttons, text category labels, polite live regions on both suggestion panels, several explicit focus indicators |
| Feedback | Empty-document guidance, limited-check wording when no grammar/spelling issues exist, separate no-style message and counts |
| Layout | Single column, constrained desktop width, smaller mobile spacing/type, footer wrapping |
| Async contract | Abort/revision protection, exact-document action guards, local fallback, progress/error state types, independently tested but not connected to UI |

## 3. Usability and accessibility findings

### Highest-value findings

1. **Visible label is disconnected.** App uses `htmlFor="writing-editor"`, but the textarea has no corresponding ID. Its aria-label provides an accessible name, so it is not unnamed; clicking the visible label does not target it. Associate the label and textarea, and add concise instructions through `aria-describedby`.
2. **Actions lack identifying context.** Repeated Apply/Accept/Dismiss names are ambiguous in a screen reader's button list. Add names including action, original/replacement, and category where useful, retaining the visible action word. Give panels accessible heading associations.
3. **Focus after card removal is unmanaged.** Applying or dismissing removes the focused button/card; there is no chosen successor. No selection is recorded or restored. Define action-specific focus behavior before implementing: ordinary card actions move to the next surviving card action, then previous, then editor; a future explicit return-to-writing action restores the saved editor selection.
4. **Live announcements are broad.** Both complete panels are live while results change during typing. This risks repeated verbose announcements; actual speech behavior needs testing. Prefer a persistent, concise status region for settled counts and explicit apply/dismiss/rejection outcomes. Keep the existing honest limited-check wording.
5. **Suggestion discovery requires scanning.** No active suggestion state, next/previous controls, position indicator, source reveal, or highlighted active range exists. Mirror marks cannot be clicked. Add explicit controls before considering inline popovers; retain native text-editing keys.

### Additional findings and validation needs

- Grammar and spelling have text labels in cards but share the wavy underline shape and differ mainly by color in the editor. Style already differs by dotted shape. Add a compact legend and an active-range outline; assess an additional non-color cue without reducing text legibility.
- Style IDs encode offset plus original text. Dismissals can reappear after edits shift offsets; identical text restored at the same offset can remain hidden unexpectedly. The dismissed array is never pruned/reset and grows with the session. Define dismissal lifetime explicitly before generalizing it to grammar/spelling.
- Synchronous apply has a useful slice guard but no whole-document revision check, bounds/integer validation, or user feedback when rejected. Do not confuse it with the stronger unused async action guard. Preserve the guard and centralize safe replacement only when implementing action behavior.
- Cross-engine overlaps remain in panels while the mirror displays only a greedy non-overlapping subset. Selecting an overlapping card must still reveal its exact range without silently deleting another engine's suggestion or changing rules.
- Mobile card rows remain horizontal; style action groups cannot shrink. Long tokens/replacements can overflow, and the 15px mobile textarea may prompt zoom on some mobile browsers. Stack/wrap actions, allow safe long-token wrapping, and test 320/375/600px widths and touch selection. Prefer 44px action targets as a usability goal.
- The mirror depends on matching line wrapping, padding, scrollbars and typography. Test trailing newlines, tabs, blank lines, resize, long unbroken words, selection, zoom and horizontal/vertical scrolling. Native spellCheck remains enabled and may add browser-specific competing marks.
- Transparent foreground text is a forced-colors/high-contrast risk. Global `color-scheme: light dark` and dark heading variables coexist with light App surfaces, potentially reducing heading contrast. Verify rendered contrast and forced colors before choosing a scoped fallback; a readable native textarea must remain possible.
- Per-keystroke full-document regex passes, merge/highlight sorting, full mirror/card rendering and word splitting may affect long documents. Grammar overlap filtering uses `filtered.some` per candidate (potential quadratic work). These are source-level risks, not measured bottlenecks. Profile representative 1k/10k/50k-word documents with sparse/dense issues before adding scheduling, workers or virtualization. Do not rewrite rules for this stage.
- Browser undo grouping for programmatic controlled replacements is not explicitly managed or tested. Preserve native typing/IME/clipboard behavior and verify undo before expanding correction workflows.

## 4. Prioritized improvement roadmap

Order is dependency order. Existing files are named below; suggested new files are explicitly marked proposed. Each later stage requires approval separately.

| Order / stage | Improvement and user benefit | Relevant files | Complexity | Regression risks | Required automated verification |
| --- | --- | --- | --- | --- | --- |
| 1 / 10.2 | Associate visible editor label; add described instructions, contextual action names and labelled panels; makes controls identifiable | `src/App.tsx`, `src/features/grammar/HighlightedEditor.tsx` | Low | Duplicate names, broken ID references, overlong speech | Rendered markup checks for unique IDs, valid label/description references, contextual names across all three categories; all 65 existing tests |
| 2 / 10.2 | Add explicit Dismiss focus styling and wrap/stack narrow-screen action rows with long-token wrapping; improves keyboard visibility and touch use | `src/App.css`, scoped `src/index.css` only if necessary | Low | Mirror wrapping drift if editor styles change, desktop layout shifts | Rendered markup checks retain native buttons; browser layout checks for overflow/focus at 320/375/600px and desktop when a runner is available |
| 3 / 10.3 | Centralize guarded replacement and selection mapping; preserve logical caret/selection and announce rejected stale actions | `src/App.tsx`, `src/features/grammar/HighlightedEditor.tsx`; proposed `src/features/writing/editorActions.ts` and `.test.mjs` | Medium | Offset corruption, focus stealing, lost scroll/undo, surrogate-pair mistakes | Node tests for shorter/longer/equal edits; selection before/inside/after/across range; UTF-16 offsets, multiline and repeated text; invalid/stale no-op; sequential mixed corrections; later browser selection/undo tests |
| 4 / 10.3 | Deterministic focus after apply/dismiss; replace broad live panels with one concise outcome/count region | `src/App.tsx`, `src/features/grammar/HighlightedEditor.tsx`, `src/App.css` | Medium | Focus drops to body, typing interrupted, excess announcements | Pure successor-policy tests; rendered status semantics; browser tests for first/middle/last removal, no remaining cards, rejected action and no focus changes during ordinary typing |
| 5 / 10.4 | Active suggestion, explicit Previous/Next, position indicator and source reveal; speeds review without intercepting typing keys | `src/App.tsx`, `src/features/grammar/HighlightedEditor.tsx`, `src/App.css`; proposed navigation helper/tests under `src/features/writing/` | Medium | Unstable offset IDs, lost selection, overlap mismatch, shortcut conflicts | Empty/single/multiple traversal and boundary tests; edits removing active issue; cross-engine overlaps; browser keyboard/tab/source-scroll tests |
| 6 / 10.4 | Define dismissal lifetime, offer grammar/spelling dismissal and restore dismissed suggestions; gives user control | `src/App.tsx`; proposed dismissal policy helper/tests under `src/features/writing/` | Medium | Hiding a new occurrence, suppressing errors indefinitely, state growth | Duplicate occurrences, edits before/within span, clear/retype, restore, apply after dismissal; ensure dismissal never edits content |
| 7 / 10.5 | Add legend/non-color active cue and scoped high-contrast/dark-preference readability fixes | `src/App.tsx`, `src/App.css`, `src/index.css`, `src/features/grammar/HighlightedEditor.tsx` | Medium | Invisible textarea/mirror text, duplicate visible text, changed wrapping | Category/active markup tests; browser checks for forced colors, dark preference, zoom, selection and mirror alignment; manual contrast and screen-reader review |
| 8 / evidence-gated later stage | Profile long documents, then consider memoized rendering or local scheduling; workers/virtualization only if measurements justify them | Existing `benchmarks/`, `src/App.tsx`, editor and writing-engine files as justified; benchmark additions proposed | High for architecture changes; Low for measurement | Stale ranges, typing lag, lost suggestions, composition interference | Reproducible latency/issue-count measurements; exact output parity; if scheduling introduced, cancellation/disposal/progress and stale completion/action tests |

Testing constraint: current dependencies contain React/ReactDOM and Node's test runner, but no DOM or browser test harness. For Stage 10.2, ReactDOM server-rendered markup can be checked using existing dependencies and a temporary compiled output location; this verifies semantics, not browser focus or layout. Establish the exact no-dependency command when implementing, and register meaningful tests in `package.json` if needed. Do not install packages silently. Later browser-interaction automation requires an available runner or separately approved test-tooling scope; use manual browser checks until then and report that limitation. Do not substitute source-string snapshots for behavioral tests.

## 5. Regression risks and safeguards

- Preserve exact JavaScript string (UTF-16) range semantics, case, punctuation, source identity and reanalysis after each accepted edit. Never apply a list of old offsets sequentially.
- Keep local checks and optional style separation. Do not change regex rules or suppress overlapping engine output as a UI shortcut.
- Save editor selection independently of card focus; map positions before an edit unchanged, after it by replacement-length delta, and inside it to a defined replacement boundary. Define boundary and crossing-selection behavior in tests. Restore only for an explicit editing transition, not every render.
- Keep a native textarea; verify IME composition, paste, undo/redo, selection direction and scroll. Ensure mirror layout changes remain shared with textarea layout.
- Maintain native Tab/Enter/Space behavior. Avoid trapping focus or introducing unannounced global shortcuts. No ARIA listbox model is needed for cards containing multiple buttons.
- Retain async coordinator and its tests untouched. If integrated in a later approved stage, require revision plus exact document and range validation at action time, and cancel on cleanup. Contract presence alone does not make the current UI async.
- Do not connect external services or the paused experimental local model. No commits, pushes, dependency installation or unrelated refactors are part of this plan.

## 6. Proposed Stage 10.2 implementation scope

**Recommended first task:** repair the visible label association and contextualize suggestion action names. This is low risk and improves keyboard/screen-reader discoverability without changing analysis or correction behavior.

Limit the first implementation to roadmap rows 1 and 2: editor ID/label/instructions, contextual names and panel heading associations, explicit Dismiss focus visibility, and narrow-card layout/long-token wrapping. Keep editor/mirror geometry unchanged. Preserve existing counts, empty states and current apply/dismiss behavior. Defer live-region restructuring until focus/outcome behavior is implemented together in Stage 10.3.

Acceptance criteria:

- Clicking START WRITING focuses the textarea; title and editor retain clear accessible names and instructions.
- Apply/Accept/Dismiss names identify their suggestion and retain their visible action word; all actions work by native keyboard activation.
- Dismiss and other actions have visible focus. At 320px width, long corrections and style actions fit without page-level horizontal scrolling; desktop cards remain usable.
- All existing tests and production build pass, with meaningful markup checks added using existing dependencies. Record manual keyboard, zoom and narrow-layout checks; use Windows Narrator to validate names. Do not claim screen-reader behavior from static markup alone.
- No rule, engine, async, model, persistence, navigation or caret-restoration changes. No new dependencies without separate approval.

Stage 10.2 is proposed only. Stop after this document and wait for approval.

## 7. Verification baseline

Commands were run in the Oxford repository on 2026-11-05.

| Check | Actual result |
| --- | --- |
| `git status` before verification | On branch `main`, up to date with `origin/main`; nothing to commit, working tree clean |
| `npm test` | PASS: 65 tests, 65 passed, 0 failed/cancelled/skipped/todo; Node runner duration approximately 213ms |
| `npm run build`, first attempt | Sandbox write restriction: TS5033 / EPERM writing `node_modules/.tmp/tsconfig.app.tsbuildinfo` and `tsconfig.node.tsbuildinfo` |
| `npm run build`, authorized rerun outside sandbox | PASS: `tsc -b && vite build`; Vite 8.3.4, 22 modules transformed; Vite phase 167ms |
| Output | `dist/index.html` 0.46kB; CSS 9.95kB (gzip 2.80kB); JS 238.58kB (gzip 74.66kB) |
| Runtime tools | Node v24.22.1; npm 11.19.1 |
| Status after build, before plan creation | Clean; generated outputs did not create tracked changes |

Existing tests: 36 grammar tests in `src/features/grammar/grammarChecker.test.mjs`; 19 style tests in `src/features/style/styleChecker.test.mjs`; 10 engine/async tests in `src/features/writing/writingEngine.test.mjs`. They cover checker output, capitalization, offsets, reanalysis, overlap fixtures, adapter identity/order, async progress, supersession, stale-action rejection, failure fallback and absent async engine. They do not mount the editor or exercise DOM focus, actual textarea selection, touch layout, mirror scroll alignment, screen readers or native undo. Standalone `cancel()` cleanup and malformed async range branches are not exhaustively covered by the current suite.

Only the requested planning document is intended as the final repository change. No application code was edited, and no commit or push was performed.
