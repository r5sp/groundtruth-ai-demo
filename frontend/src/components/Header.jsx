export default function Header({ user, onLogout, onBack, tag, toolName }) {
  return (
    <header className="fs-header">
      <div className="fs-header-inner">
        <div className="fs-header-left">
          {onBack && (
            <button className="fs-back-btn" onClick={onBack}>
              ← All Tools
            </button>
          )}
          <span className="fs-logo gt-wordmark" aria-label="GroundTruth">
            <span className="gt-mark" aria-hidden="true">◇</span>
            GroundTruth
          </span>
        </div>
        <div className="fs-header-right">
          <span className="fs-header-tag">
            {tag || toolName || (onBack ? "Applied AI" : "Applied AI Platform")}
          </span>
          {user && (
            <div className="fs-header-user">
              <span className="fs-header-email">{user.email}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
