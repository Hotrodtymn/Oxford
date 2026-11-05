import { useId } from "react";
import type { WritingEngineSuggestion } from "../writing/engine";

type SuggestionPanelsProps = {
  hasContent: boolean;
  issues: WritingEngineSuggestion[];
  visibleStyleSuggestions: WritingEngineSuggestion[];
  onApply: (suggestion: WritingEngineSuggestion) => void;
  onDismiss: (id: string) => void;
};

export default function SuggestionPanels({
  hasContent,
  issues,
  visibleStyleSuggestions,
  onApply,
  onDismiss,
}: SuggestionPanelsProps) {
  const issuesHeadingId = useId();
  const styleHeadingId = useId();

  return (
    <>
      <section className="suggestions-panel" aria-live="polite" aria-labelledby={issuesHeadingId}>
        <div className="suggestions-heading">
          <div>
            <p className="eyebrow">WRITING ASSISTANT</p>
            <h2 id={issuesHeadingId}>Writing suggestions</h2>
          </div>

          <span className="issue-count">
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </span>
        </div>

        {!hasContent ? (
          <p className="suggestions-empty">
            Start writing to check for common spelling and grammar issues.
          </p>
        ) : issues.length === 0 ? (
          <p className="suggestions-empty">
            No grammar or spelling issues found by Oxford's current checks.
          </p>
        ) : (
          <div className="suggestions-list">
            {issues.map((issue) => (
              <article className="suggestion-item" key={issue.id}>
                <div className="suggestion-main">
                  <span className={`issue-type ${issue.type}`}>
                    {issue.type === "grammar" ? "Grammar" : "Spelling"}
                  </span>

                  <p className="suggestion-message">{issue.message}</p>

                  <div className="suggestion-correction">
                    <span className="original-text">{issue.original}</span>
                    <span aria-hidden="true">→</span>
                    <strong>{issue.suggestion}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="apply-suggestion"
                  aria-label={`Apply ${issue.type} suggestion: \u201c${issue.original}\u201d to \u201c${issue.suggestion}\u201d`}
                  onClick={() => onApply(issue)}
                >
                  Apply
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {hasContent && (
        <section className="suggestions-panel style-suggestions-panel" aria-live="polite" aria-labelledby={styleHeadingId}>
          <div className="suggestions-heading">
            <div>
              <p className="eyebrow">OPTIONAL</p>
              <h2 id={styleHeadingId}>Writing improvements</h2>
            </div>

            <span className="issue-count">
              {visibleStyleSuggestions.length}{" "}
              {visibleStyleSuggestions.length === 1 ? "suggestion" : "suggestions"}
            </span>
          </div>

          {visibleStyleSuggestions.length === 0 ? (
            <p className="suggestions-empty">
              No optional style suggestions right now.
            </p>
          ) : (
            <div className="suggestions-list">
              {visibleStyleSuggestions.map((suggestion) => (
                <article className="suggestion-item style-suggestion-item" key={suggestion.id}>
                  <div className="suggestion-main">
                    <span className="issue-type style">Optional style</span>
                    <p className="suggestion-message">{suggestion.message}</p>
                    <div className="suggestion-correction">
                      <span className="original-text">{suggestion.original}</span>
                      <span aria-hidden="true">→</span>
                      <strong>{suggestion.suggestion}</strong>
                    </div>
                  </div>

                  <div className="style-suggestion-actions">
                    <button
                      type="button"
                      className="apply-suggestion"
                      aria-label={`Accept style suggestion: \u201c${suggestion.original}\u201d to \u201c${suggestion.suggestion}\u201d`}
                      onClick={() => onApply(suggestion)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="dismiss-suggestion"
                      aria-label={`Dismiss style suggestion for \u201c${suggestion.original}\u201d`}
                      onClick={() => onDismiss(suggestion.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

    </>
  );
}
