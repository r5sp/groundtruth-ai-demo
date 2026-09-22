import SectionHeading from "./SectionHeading";

function ConfidenceBadge({ level }) {
  const variant =
    level === "High" ? "high" : level === "Medium" ? "medium" : "low";
  return <span className={`badge badge-${variant}`}>{level}</span>;
}

export default function TermDetail({ term, onClose }) {
  if (!term) return null;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>

        <SectionHeading label="Term detail" />
        <h2>{term.field_name}</h2>

        <div className="detail-section">
          <label>Extracted value</label>
          <div className="content">
            {term.value || <span className="value-null">Not found in document</span>}
          </div>
        </div>

        <div className="detail-section">
          <label>Confidence</label>
          <div className="content">
            <ConfidenceBadge level={term.confidence} />
          </div>
        </div>

        {term.source_excerpt && (
          <div className="detail-section">
            <label>Source excerpt</label>
            <div className="excerpt-box">{term.source_excerpt}</div>
          </div>
        )}

        <div className="detail-section">
          <label>Legal review required</label>
          <div className="content">
            {term.needs_legal_review ? (
              <span className="badge badge-review-yes">Yes, review required</span>
            ) : (
              <span className="badge badge-review-no">No</span>
            )}
          </div>
        </div>

        {term.review_reason && (
          <div className="detail-section">
            <label>Review reason</label>
            <div className="review-reason">{term.review_reason}</div>
          </div>
        )}
      </div>
    </div>
  );
}
