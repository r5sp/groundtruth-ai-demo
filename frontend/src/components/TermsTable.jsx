import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../api";

function ConfidenceBadge({ level }) {
  const variant =
    level === "High" ? "high" : level === "Medium" ? "medium" : "low";
  return <span className={`badge badge-${variant}`}>{level}</span>;
}

function ReviewBadge({ needsReview }) {
  return needsReview ? (
    <span className="badge badge-review-yes">Yes</span>
  ) : (
    <span className="badge badge-review-no">No</span>
  );
}

function VerificationBadge({ status, confidence }) {
  if (!status || status === "not_asserted") {
    return <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>-</span>;
  }
  const map = {
    verified: { bg: "#dcfce7", fg: "#166534", bd: "#86efac", icon: "✓", label: "Verified" },
    review: { bg: "#fef9c3", fg: "#854d0e", bd: "#fde047", icon: "⚠", label: "Check" },
    rejected: { bg: "#fee2e2", fg: "#991b1b", bd: "#fca5a5", icon: "✕", label: "Rejected" },
  };
  const s = map[status] || map.review;
  return (
    <span
      title={`Double-LLM verification: ${s.label}${confidence != null ? ` (${confidence}% confidence)` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "0.72rem",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: "3px",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.bd}`,
        whiteSpace: "nowrap",
      }}
    >
      {s.icon} {s.label}
      {confidence != null && (
        <span style={{ fontWeight: 500, opacity: 0.8 }}>{confidence}%</span>
      )}
    </span>
  );
}

function PageBadge({ pageNumber }) {
  if (!pageNumber) return null;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "0.7rem",
        padding: "1px 5px",
        marginLeft: "6px",
        borderRadius: "3px",
        background: "#e8eaf0",
        color: "#555",
        verticalAlign: "middle",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      p.{pageNumber}
    </span>
  );
}

function DocNameTag({ docName }) {
  if (!docName) return null;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "0.7rem",
        padding: "1px 6px",
        marginLeft: "6px",
        borderRadius: "3px",
        background: "#dbeafe",
        color: "#1d4ed8",
        verticalAlign: "middle",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {docName}
    </span>
  );
}

function ExcerptPopover({ excerpt, pageNumber, projectId, docId, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const pdfUrl =
    projectId && docId && pageNumber
      ? `${API_BASE}/api/projects/${projectId}/documents/${docId}/pdf#page=${pageNumber}`
      : null;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        zIndex: 100,
        background: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
        padding: "12px 14px",
        minWidth: "240px",
        maxWidth: "340px",
        top: "100%",
        left: 0,
        marginTop: "4px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          fontSize: "0.82rem",
          color: "#374151",
          marginBottom: pdfUrl ? "10px" : 0,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {excerpt}
      </div>
      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            window.open(pdfUrl);
            e.preventDefault();
          }}
          style={{
            fontSize: "0.78rem",
            color: "#2563eb",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Open in PDF{pageNumber ? ` (p.${pageNumber})` : ""}
        </a>
      )}
    </div>
  );
}

function FeedbackButtons({ projectId, docId, termId }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!projectId || !termId) return null;

  async function handleFeedback(e, value) {
    e.stopPropagation();
    if (loading || selected === value) return;
    setLoading(true);
    try {
      const url = docId
        ? `${API_BASE}/api/projects/${projectId}/documents/${docId}/terms/${termId}/feedback`
        : `${API_BASE}/api/projects/${projectId}/terms/${termId}/feedback`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: value }),
      });
      setSelected(value);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", gap: "4px", marginLeft: "6px" }}>
      <button
        title="Thumbs up"
        onClick={(e) => handleFeedback(e, "thumbs_up")}
        disabled={loading}
        style={{
          background: "none",
          border: "none",
          cursor: loading ? "default" : "pointer",
          fontSize: "1rem",
          padding: "1px 3px",
          borderRadius: "3px",
          opacity: selected && selected !== "thumbs_up" ? 0.3 : 1,
          filter:
            selected === "thumbs_up"
              ? "drop-shadow(0 0 2px #22c55e)"
              : "none",
          transition: "opacity 0.15s, filter 0.15s",
        }}
      >
        👍
      </button>
      <button
        title="Thumbs down"
        onClick={(e) => handleFeedback(e, "thumbs_down")}
        disabled={loading}
        style={{
          background: "none",
          border: "none",
          cursor: loading ? "default" : "pointer",
          fontSize: "1rem",
          padding: "1px 3px",
          borderRadius: "3px",
          opacity: selected && selected !== "thumbs_down" ? 0.3 : 1,
          filter:
            selected === "thumbs_down"
              ? "drop-shadow(0 0 2px #ef4444)"
              : "none",
          transition: "opacity 0.15s, filter 0.15s",
        }}
      >
        👎
      </button>
    </span>
  );
}

function SourceExcerptCell({ term, projectId, docId }) {
  const [open, setOpen] = useState(false);

  const hasPage = !!term.page_number;
  const hasPdf = !!(projectId && docId && hasPage);
  const pdfUrl = hasPdf
    ? `${API_BASE}/api/projects/${projectId}/documents/${docId}/pdf#page=${term.page_number}`
    : null;

  if (!term.source_excerpt && !hasPage) return null;

  return (
    <span style={{ position: "relative", display: "inline-flex", flexDirection: "column", gap: "4px" }}>
      {/* Page number: always on top, prominent */}
      {hasPage && (
        hasPdf ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "3px",
              background: "#dbeafe",
              color: "#1d4ed8",
              border: "1px solid #93c5fd",
              textDecoration: "none",
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
            }}
            title={`Open PDF at page ${term.page_number}`}
          >
            📄 Page {term.page_number} ↗
          </a>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "3px",
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
            }}
            title={`Found on page ${term.page_number} of the document`}
          >
            📄 Page {term.page_number}
          </span>
        )
      )}

      {/* Source excerpt: click to expand */}
      {term.source_excerpt && (
        <span
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          style={{
            cursor: "pointer",
            color: "#6b7280",
            fontSize: "0.78rem",
            fontStyle: "italic",
            textDecoration: "underline dotted",
            textUnderlineOffset: "2px",
            maxWidth: "200px",
            display: "inline-block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title="Click to expand excerpt"
        >
          "{term.source_excerpt}"
        </span>
      )}

      {open && (
        <ExcerptPopover
          excerpt={term.source_excerpt}
          pageNumber={term.page_number}
          projectId={projectId}
          docId={docId}
          onClose={() => setOpen(false)}
        />
      )}
    </span>
  );
}

export default function TermsTable({ terms, onSelectTerm, projectId, docId }) {
  if (!terms.length) {
    return (
      <div className="empty-state">
        <p>No terms match this filter.</p>
      </div>
    );
  }

  const hasSource = terms.some((t) => t.source_excerpt);
  const hasVerification = terms.some(
    (t) => t.verification_status && t.verification_status !== "not_asserted"
  );

  return (
    <>
      <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#9ca3af", lineHeight: 1.5 }}>
        <strong style={{ color: "#6b7280" }}>Legal review</strong>: flagged where the clause is non-standard, ambiguous, or carries financial/legal risk. Click any row to see the full excerpt and reasoning.
        {hasSource && <> Source excerpts are quoted directly from the document. Click to expand and jump to the page.</>}
      </p>
    <table className="terms-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th>Confidence</th>
          {hasVerification && <th>Verification</th>}
          <th>Legal review</th>
          {hasSource && <th>Source</th>}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {terms.map((term) => (
          <tr
            key={term.id}
            className={`clickable ${term.needs_legal_review ? "flagged" : ""}`}
            onClick={() => onSelectTerm(term)}
          >
            <td className="field-name">
              {term.field_name}
              {term.doc_name && <DocNameTag docName={term.doc_name} />}
            </td>
            <td className="value-cell">
              {term.value ? (
                term.value
              ) : (
                <span className="value-null">Not found</span>
              )}
            </td>
            <td>
              <ConfidenceBadge level={term.confidence} />
            </td>
            {hasVerification && (
              <td>
                <VerificationBadge
                  status={term.verification_status}
                  confidence={term.verification_confidence}
                />
              </td>
            )}
            <td>
              <ReviewBadge needsReview={term.needs_legal_review} />
            </td>
            {hasSource && (
              <td style={{ maxWidth: "220px" }}>
                <SourceExcerptCell
                  term={term}
                  projectId={projectId}
                  docId={docId}
                />
              </td>
            )}
            <td style={{ whiteSpace: "nowrap" }}>
              <FeedbackButtons
                projectId={projectId}
                docId={docId}
                termId={term.id}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}
