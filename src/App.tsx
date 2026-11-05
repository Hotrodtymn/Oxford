import { useId, useMemo, useState } from "react";
import { analyzeWriting } from "./features/writing/localEngines";
import type { WritingEngineSuggestion } from "./features/writing/engine";
import "./App.css";
import SuggestionPanels from "./features/grammar/SuggestionPanels";
import HighlightedEditor from "./features/grammar/HighlightedEditor";

function App() {
  const editorId = useId();
  const editorInstructionsId = useId();
  const [title, setTitle] = useState("Untitled document");
  const [content, setContent] = useState("");
  const [dismissedStyleIds, setDismissedStyleIds] = useState<string[]>([]);

  const suggestions = useMemo(() => analyzeWriting(content), [content]);
  const issues = suggestions.filter((suggestion) => suggestion.type !== "style");
  const visibleStyleSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.type === "style" &&
      !dismissedStyleIds.includes(suggestion.id),
  );
  const highlights = [...issues, ...visibleStyleSuggestions];

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  const characters = content.length;

  const applySuggestion = (issue: WritingEngineSuggestion) => {
    setContent((current) => {
      const actualText = current.slice(issue.start, issue.end);

      // Don't modify text if it changed since the suggestion was generated.
      if (actualText !== issue.original) return current;

      return (
        current.slice(0, issue.start) +
        issue.suggestion +
        current.slice(issue.end)
      );
    });
  };

  return (
    <main className="oxford-app">
      <header className="oxford-header">
        <a className="oxford-brand" href="/" aria-label="Oxford home">
          <span className="brand-mark">O</span>
          <span>oxford</span>
        </a>

        <div className="header-status">
          <span className="status-dot" />
          Editor ready
        </div>
      </header>

      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Your writing space</h1>
            <p className="workspace-description">
              Write clearly. Communicate confidently.
            </p>
          </div>

          <span className="document-badge">DOCUMENT</span>
        </div>

        <section className="editor-card">
          <div className="document-toolbar">
            <input
              className="document-title"
              aria-label="Document title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Document title"
              maxLength={120}
            />

            <span className="document-type">Draft</span>
          </div>

          <div className="editor-divider" />

          <label className="writing-label" htmlFor={editorId}>
            START WRITING
          </label>

          <p id={editorInstructionsId} className="visually-hidden">
            Write or paste your text. Review suggestions below the editor.
          </p>

          <HighlightedEditor
            id={editorId}
            describedBy={editorInstructionsId}
            value={content}
            onChange={setContent}
            issues={highlights}
            placeholder={
              "Start writing here...\n\nPut your thoughts into words. Oxford will help you refine your writing."
            }
          />

          <footer className="editor-footer">
            <div className="editor-hint">
              <span className="hint-icon">✦</span>
              <span>Your ideas, your voice.</span>
            </div>

            <div className="document-stats">
              <span>{words} words</span>
              <span className="stats-divider" />
              <span>{characters} characters</span>
            </div>
          </footer>
        </section>

        <SuggestionPanels
          hasContent={content.trim().length > 0}
          issues={issues}
          visibleStyleSuggestions={visibleStyleSuggestions}
          onApply={applySuggestion}
          onDismiss={(id) => setDismissedStyleIds((ids) => [...ids, id])}
        />

        <section className="next-feature">
          <div className="feature-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" />
              <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" />
            </svg>
          </div>

          <div className="feature-copy">
            <h2>Oxford is learning to refine your writing</h2>
            <p>
              These initial checks run locally. More advanced grammar, spelling,
              and clarity analysis will come in later steps.
            </p>
          </div>

          <span className="coming-soon">IN PROGRESS</span>
        </section>
      </section>
    </main>
  );
}

export default App;
