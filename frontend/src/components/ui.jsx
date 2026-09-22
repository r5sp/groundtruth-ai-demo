// Shared UI states: consistent empty / loading / error across every tool so a
// first-time (non-technical) user always sees what to do, never a blank screen.

export function Loading({ label = "Loading…" }) {
  return (
    <div className="ui-loading">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBar({ message, onRetry }) {
  return (
    <div className="status-bar error ui-errorbar">
      <span>{message || "Something went wrong."}</span>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, children }) {
  return (
    <div className="empty-state ui-empty">
      {title && <p className="ui-empty-title">{title}</p>}
      {hint && <p className="ui-empty-hint">{hint}</p>}
      {children}
    </div>
  );
}
