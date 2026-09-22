import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "../api";

const DOC_TYPES = [
  { value: "lease", label: "Original Lease" },
  { value: "amendment", label: "Amendment" },
  { value: "title_report", label: "Title Report" },
  { value: "other", label: "Other" },
];

const DOC_TYPE_LABELS = {
  lease: "Original Lease",
  amendment: "Amendment",
  title_report: "Title Report",
  other: "Other",
};

const SIGNIFICANCE_COLORS = {
  high: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  medium: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  low: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
};

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }) {
  const map = {
    completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4" },
    processing: { label: "Processing", color: "#d97706", bg: "#fffbeb" },
    text_extracted: { label: "Extracted", color: "#2563eb", bg: "#eff6ff" },
    extraction_failed: { label: "Failed", color: "#dc2626", bg: "#fef2f2" },
    text_extraction_empty: { label: "Empty", color: "#6b7280", bg: "#f9fafb" },
    uploaded: { label: "Uploaded", color: "#6b7280", bg: "#f9fafb" },
  };
  const s = map[status] || { label: status, color: "#6b7280", bg: "#f9fafb" };
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: "3px",
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

function SignificanceBadge({ significance }) {
  const key = (significance || "").toLowerCase();
  const s = SIGNIFICANCE_COLORS[key] || SIGNIFICANCE_COLORS.low;
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: "3px",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {significance}
    </span>
  );
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadModal({ projectId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("lease");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [useOcr, setUseOcr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".docx"].includes(ext)) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", docType);
      if (effectiveDate) fd.append("effective_date", effectiveDate);
      fd.append("use_ocr", useOcr ? "true" : "false");

      const res = await fetch(`${API_BASE}/api/projects/${projectId}/documents`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Upload failed (${res.status})`);
      }
      const doc = await res.json();
      onSuccess(doc);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="project-detail-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="project-detail-modal">
        <div className="project-detail-modal-header">
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--fs-blue)" }}>
            Add Document
          </h3>
          <button className="project-detail-icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={{ padding: "var(--fs-space-2)", display: "flex", flexDirection: "column", gap: "var(--fs-space-2)" }}>
          {/* Drop zone */}
          <div
            className={`project-detail-dropzone${dragOver ? " drag-over" : ""}`}
            onClick={() => !uploading && inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!uploading) inputRef.current?.click(); } }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files[0]; if (f) handleFile(f); }}
              disabled={uploading}
            />
            {file ? (
              <div>
                <strong style={{ color: "var(--fs-blue)" }}>{file.name}</strong>
                <div style={{ fontSize: "12px", color: "var(--fs-text-muted)", marginTop: "4px" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: "24px", marginBottom: "8px", opacity: 0.4 }}>⬆</div>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--fs-blue)" }}>Drop file here or click to browse</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--fs-text-muted)" }}>PDF and DOCX supported</p>
              </>
            )}
          </div>

          {/* Document type */}
          <div>
            <label className="project-detail-label">Document Type</label>
            <select
              className="project-detail-select"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={uploading}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Effective date */}
          <div>
            <label className="project-detail-label">Effective Date</label>
            <input
              type="date"
              className="project-detail-input"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* OCR toggle */}
          <label className="project-detail-ocr-toggle">
            <input
              type="checkbox"
              checked={useOcr}
              onChange={(e) => setUseOcr(e.target.checked)}
              disabled={uploading}
            />
            <span>Use OCR processing (for scanned documents)</span>
          </label>
          {useOcr && (
            <div className="project-detail-ocr-warning">
              ⚠️ OCR processing takes 2 to 5 minutes longer but is required for scanned documents.
            </div>
          )}

          {error && (
            <div className="project-detail-error">{error}</div>
          )}

          <div style={{ display: "flex", gap: "var(--fs-space-1)", justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!file || uploading}
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Documents Tab ───────────────────────────────────────────────────────────

function DocumentsTab({ project, onProjectChange }) {
  const [showUpload, setShowUpload] = useState(false);
  const docs = project.documents || [];

  const handleUploadSuccess = (newDoc) => {
    setShowUpload(false);
    onProjectChange({
      ...project,
      documents: [...docs, newDoc],
    });
  };

  const handleDownload = (doc) => {
    window.open(`${API_BASE}/api/projects/${project.id}/documents/${doc.id}/pdf`, "_blank");
  };

  return (
    <div className="project-detail-tab-content">
      <div className="project-detail-section-header">
        <div>
          <div style={{ fontSize: "12px", color: "var(--fs-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "4px" }}>
            Documents
          </div>
          <div style={{ fontSize: "14px", color: "var(--fs-text-muted)" }}>
            {docs.length} document{docs.length !== 1 ? "s" : ""} in this project
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          + Add Document
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="project-detail-empty">
          <div style={{ fontSize: "32px", opacity: 0.2, marginBottom: "12px" }}>📄</div>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--fs-blue)" }}>No documents yet</p>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--fs-text-muted)" }}>
            Upload the original lease to get started.
          </p>
        </div>
      ) : (
        <div className="project-detail-doc-list">
          {docs.map((doc) => (
            <div key={doc.id} className="project-detail-doc-card">
              <div className="project-detail-doc-icon">
                {doc.file_type === "pdf" ? "📄" : "📝"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "var(--fs-blue)", fontSize: "14px" }}>
                    {doc.file_name}
                  </span>
                  <span className="project-detail-doc-type-badge">
                    {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                  </span>
                  <StatusBadge status={doc.status} />
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: "12px", color: "var(--fs-text-muted)" }}>
                  {doc.effective_date && (
                    <span>Effective: {formatDate(doc.effective_date)}</span>
                  )}
                  <span>Uploaded: {formatDate(doc.uploaded_at)}</span>
                  {doc.terms && (
                    <span>{doc.terms.length} term{doc.terms.length !== 1 ? "s" : ""} extracted</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                  onClick={() => handleDownload(doc)}
                  title="Download original file"
                >
                  ⬇ PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          projectId={project.id}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

// ─── Timeline Tab ────────────────────────────────────────────────────────────

function TimelineTab({ project }) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const fetchComparison = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${project.id}/comparison`, { credentials: "include" });
      if (res.status === 404) {
        setComparison(null);
      } else if (!res.ok) {
        throw new Error(`Failed to load comparison (${res.status})`);
      } else {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const runComparison = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${project.id}/compare`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Comparison failed (${res.status})`);
      }
      const data = await res.json();
      setComparison(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const timeline = comparison?.timeline || [];

  return (
    <div className="project-detail-tab-content">
      <div className="project-detail-section-header">
        <div>
          <div style={{ fontSize: "12px", color: "var(--fs-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "4px" }}>
            Timeline & Changes
          </div>
          <div style={{ fontSize: "14px", color: "var(--fs-text-muted)" }}>
            Chronological comparison of all document versions
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={runComparison}
          disabled={running || (project.documents || []).length === 0}
        >
          {running ? "Running…" : "Run Comparison"}
        </button>
      </div>

      {error && <div className="project-detail-error">{error}</div>}

      {loading ? (
        <div className="project-detail-loading">
          <div className="spinner" />
          <span>Loading comparison…</span>
        </div>
      ) : timeline.length === 0 ? (
        <div className="project-detail-empty">
          <div style={{ fontSize: "32px", opacity: 0.2, marginBottom: "12px" }}>🔀</div>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--fs-blue)" }}>No comparison yet</p>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--fs-text-muted)" }}>
            Click "Run Comparison" to generate a chronological change report.
          </p>
        </div>
      ) : (
        <div className="project-detail-timeline">
          {timeline.map((entry, idx) => (
            <div key={entry.doc_id} className="project-detail-timeline-entry">
              <div className="project-detail-timeline-marker">
                <div className="project-detail-timeline-dot" />
                {idx < timeline.length - 1 && <div className="project-detail-timeline-line" />}
              </div>
              <div className="project-detail-timeline-body">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 700, color: "var(--fs-blue)", fontSize: "15px" }}>
                    {entry.doc_name}
                  </span>
                  <span className="project-detail-doc-type-badge">
                    {DOC_TYPE_LABELS[entry.document_type] || entry.document_type}
                  </span>
                  {entry.effective_date && (
                    <span style={{ fontSize: "12px", color: "var(--fs-text-muted)" }}>
                      {formatDate(entry.effective_date)}
                    </span>
                  )}
                  {idx === 0 && (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--fs-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Baseline
                    </span>
                  )}
                </div>

                {entry.changes_from_previous && entry.changes_from_previous.length > 0 ? (
                  <div className="project-detail-changes">
                    {entry.changes_from_previous.map((change, ci) => (
                      <div key={ci} className="project-detail-change-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--fs-blue)" }}>
                            {change.field}
                          </span>
                          <SignificanceBadge significance={change.significance} />
                        </div>
                        <div className="project-detail-change-values">
                          <div className="project-detail-change-old">
                            <span className="project-detail-change-label">Before</span>
                            <span>{change.old_value ?? <em style={{ opacity: 0.5 }}>not present</em>}</span>
                          </div>
                          <div className="project-detail-change-arrow">→</div>
                          <div className="project-detail-change-new">
                            <span className="project-detail-change-label">After</span>
                            <span>{change.new_value ?? <em style={{ opacity: 0.5 }}>removed</em>}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : idx > 0 ? (
                  <div style={{ fontSize: "13px", color: "var(--fs-text-muted)", fontStyle: "italic" }}>
                    No material changes detected from previous document.
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Terms Tab ───────────────────────────────────────────────────────────────

function TermsTab({ project }) {
  const [feedbackState, setFeedbackState] = useState({});

  const docs = project.documents || [];

  const allTerms = [];
  for (const doc of docs) {
    if (doc.terms) {
      for (const term of doc.terms) {
        allTerms.push({ ...term, _doc: doc });
      }
    }
  }

  const grouped = {};
  for (const term of allTerms) {
    const key = term.field_name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(term);
  }

  const categories = Object.keys(grouped).sort();

  const submitFeedback = async (term, feedback) => {
    const key = `${term._doc.id}-${term.id}`;
    setFeedbackState((prev) => ({ ...prev, [key]: feedback }));
    try {
      await fetch(
        `${API_BASE}/api/projects/${project.id}/documents/${term._doc.id}/terms/${term.id}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ feedback }),
        }
      );
    } catch {
      // silently fail
    }
  };

  if (allTerms.length === 0) {
    return (
      <div className="project-detail-tab-content">
        <div className="project-detail-empty">
          <div style={{ fontSize: "32px", opacity: 0.2, marginBottom: "12px" }}>📋</div>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--fs-blue)" }}>No terms extracted yet</p>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--fs-text-muted)" }}>
            Upload a lease document to extract and review terms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-tab-content">
      <div className="project-detail-section-header">
        <div>
          <div style={{ fontSize: "12px", color: "var(--fs-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "4px" }}>
            Combined Terms
          </div>
          <div style={{ fontSize: "14px", color: "var(--fs-text-muted)" }}>
            {allTerms.length} terms across {docs.filter((d) => d.terms?.length).length} document{docs.filter((d) => d.terms?.length).length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="project-detail-terms-list">
        {categories.map((category) => (
          <div key={category} className="project-detail-term-group">
            <div className="project-detail-term-category">{category.replace(/_/g, " ")}</div>
            {grouped[category].map((term) => {
              const key = `${term._doc.id}-${term.id}`;
              const currentFeedback = feedbackState[key];
              return (
                <div key={key} className="project-detail-term-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "var(--fs-blue)", fontSize: "14px", marginBottom: "4px" }}>
                      {term.value || <em style={{ opacity: 0.5 }}>Not specified</em>}
                    </div>
                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--fs-text-muted)", flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: "var(--fs-gray)",
                          padding: "1px 6px",
                          borderRadius: "2px",
                          fontWeight: 600,
                          color: "var(--fs-blue)",
                          fontSize: "11px",
                        }}
                      >
                        {DOC_TYPE_LABELS[term._doc.document_type] || term._doc.document_type}
                      </span>
                      <span>{term._doc.file_name}</span>
                      {term.source_excerpt && (
                        <span style={{ fontStyle: "italic" }}>"{term.source_excerpt.slice(0, 80)}{term.source_excerpt.length > 80 ? "…" : ""}"</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0, alignItems: "center" }}>
                    <button
                      className="project-detail-feedback-btn"
                      style={{ opacity: currentFeedback === "thumbs_up" ? 1 : 0.4 }}
                      onClick={() => submitFeedback(term, "thumbs_up")}
                      title="Accurate"
                    >
                      👍
                    </button>
                    <button
                      className="project-detail-feedback-btn"
                      style={{ opacity: currentFeedback === "thumbs_down" ? 1 : 0.4 }}
                      onClick={() => submitFeedback(term, "thumbs_down")}
                      title="Inaccurate"
                    >
                      👎
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat Tab ────────────────────────────────────────────────────────────────

function ChatTab({ project }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    setError(null);

    const optimisticUser = { role: "user", content, id: Date.now(), created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const body = { content, session_id: sessionId || null, project_id: project.id };
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Chat error (${res.status})`);
      }
      const session = await res.json();
      setSessionId(session.id);
      setMessages(session.messages || []);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.filter((m) => m !== optimisticUser));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="project-detail-chat-wrap">
      <div className="project-detail-chat-context">
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--fs-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Context:
        </span>
        {(project.documents || []).filter((d) => d.status === "completed").map((doc) => (
          <span key={doc.id} className="project-detail-doc-type-badge" style={{ fontSize: "11px" }}>
            {doc.file_name}
          </span>
        ))}
        {(project.documents || []).filter((d) => d.status === "completed").length === 0 && (
          <span style={{ fontSize: "12px", color: "var(--fs-text-muted)", fontStyle: "italic" }}>
            No processed documents yet
          </span>
        )}
      </div>

      <div className="project-detail-chat-messages">
        {messages.length === 0 && (
          <div className="project-detail-chat-placeholder">
            <div style={{ fontSize: "28px", opacity: 0.2, marginBottom: "10px" }}>💬</div>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--fs-blue)" }}>Ask about this project</p>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--fs-text-muted)" }}>
              Questions about lease terms, changes, obligations, and more.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`project-detail-chat-msg project-detail-chat-msg-${msg.role}`}>
            <div className="project-detail-chat-msg-label">
              {msg.role === "user" ? "You" : "Assistant"}
            </div>
            <div className="project-detail-chat-msg-body">{msg.content}</div>
          </div>
        ))}
        {sending && (
          <div className="project-detail-chat-msg project-detail-chat-msg-assistant">
            <div className="project-detail-chat-msg-label">Assistant</div>
            <div className="project-detail-chat-msg-body" style={{ opacity: 0.5 }}>
              <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="project-detail-error" style={{ margin: "0 var(--fs-space-2)" }}>{error}</div>}

      <div className="project-detail-chat-input-row">
        <textarea
          className="project-detail-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about the lease, terms, changes… (Enter to send)"
          rows={2}
          disabled={sending}
        />
        <button
          className="btn btn-primary"
          style={{ alignSelf: "flex-end", flexShrink: 0 }}
          onClick={sendMessage}
          disabled={!input.trim() || sending}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const TABS = [
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "Timeline & Changes" },
  { id: "terms", label: "Terms" },
  { id: "chat", label: "Chat" },
];

export default function ProjectDetail({ project: initialProject, user, onBack }) {
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState("documents");
  const [loadError, setLoadError] = useState(null);

  // Always fetch the full project (with documents + terms) from the server on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/projects/${initialProject.id}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load project (${r.status})`);
        return r.json();
      })
      .then((data) => { if (!cancelled) setProject(data); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); });
    return () => { cancelled = true; };
  }, [initialProject.id]);

  return (
    <>
      <style>{`
        .project-detail-header {
          border-bottom: 1px solid var(--fs-border);
          background: var(--fs-white);
          padding: var(--fs-space-2) var(--fs-space-3);
        }
        .project-detail-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: var(--fs-text-muted);
          padding: 0;
          margin-bottom: var(--fs-space-1);
          font-family: inherit;
        }
        .project-detail-back:hover { color: var(--fs-blue); }
        .project-detail-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--fs-blue);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .project-detail-meta {
          font-size: 13px;
          color: var(--fs-text-muted);
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .project-detail-tabs {
          display: flex;
          border-bottom: 1px solid var(--fs-border);
          background: var(--fs-white);
          padding: 0 var(--fs-space-3);
          overflow-x: auto;
        }
        .project-detail-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--fs-text-muted);
          padding: 12px 16px;
          white-space: nowrap;
          font-family: inherit;
          letter-spacing: 0.02em;
          transition: color 0.15s, border-color 0.15s;
        }
        .project-detail-tab:hover { color: var(--fs-blue); }
        .project-detail-tab.active {
          color: var(--fs-blue);
          border-bottom-color: var(--fs-neon);
        }
        .project-detail-tab-content {
          padding: var(--fs-space-3);
          max-width: 900px;
        }
        .project-detail-section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--fs-space-2);
          margin-bottom: var(--fs-space-2);
          flex-wrap: wrap;
        }
        .project-detail-empty {
          text-align: center;
          padding: var(--fs-space-4);
          background: var(--fs-gray);
          border: 1px solid var(--fs-border);
        }
        .project-detail-loading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: var(--fs-space-3);
          color: var(--fs-text-muted);
          font-size: 14px;
        }
        .project-detail-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 10px var(--fs-space-1);
          font-size: 13px;
          border-radius: 2px;
          margin-bottom: var(--fs-space-1);
        }
        .project-detail-doc-list { display: flex; flex-direction: column; gap: var(--fs-space-1); }
        .project-detail-doc-card {
          display: flex;
          align-items: center;
          gap: var(--fs-space-1);
          padding: var(--fs-space-1) var(--fs-space-2);
          background: var(--fs-white);
          border: 1px solid var(--fs-border);
        }
        .project-detail-doc-card:hover { border-color: var(--fs-light-blue); }
        .project-detail-doc-icon { font-size: 22px; flex-shrink: 0; opacity: 0.7; }
        .project-detail-doc-type-badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 2px 6px;
          background: rgba(0, 36, 58, 0.07);
          color: var(--fs-blue);
          border-radius: 2px;
        }
        .project-detail-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--fs-space-2);
        }
        .project-detail-modal {
          background: var(--fs-white);
          width: 100%;
          max-width: 480px;
          border: 1px solid var(--fs-border);
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .project-detail-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--fs-space-1) var(--fs-space-2);
          border-bottom: 1px solid var(--fs-border);
        }
        .project-detail-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: var(--fs-text-muted);
          padding: 4px 8px;
          border-radius: 2px;
          font-family: inherit;
        }
        .project-detail-icon-btn:hover { background: var(--fs-gray); color: var(--fs-blue); }
        .project-detail-dropzone {
          border: 2px dashed var(--fs-border);
          padding: var(--fs-space-3);
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .project-detail-dropzone:hover, .project-detail-dropzone.drag-over {
          border-color: var(--fs-neon);
          background: #fafff0;
        }
        .project-detail-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--fs-text-muted);
          margin-bottom: 6px;
        }
        .project-detail-select, .project-detail-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid var(--fs-border);
          font-size: 13px;
          font-family: inherit;
          color: var(--fs-blue);
          background: var(--fs-white);
          box-sizing: border-box;
          border-radius: 0;
        }
        .project-detail-select:focus, .project-detail-input:focus {
          outline: 2px solid var(--fs-neon);
          outline-offset: -2px;
        }
        .project-detail-ocr-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--fs-blue);
        }
        .project-detail-ocr-warning {
          font-size: 12px;
          color: #d97706;
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 8px 10px;
          border-radius: 2px;
        }
        .project-detail-timeline { display: flex; flex-direction: column; gap: 0; }
        .project-detail-timeline-entry { display: flex; gap: var(--fs-space-2); }
        .project-detail-timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          width: 20px;
        }
        .project-detail-timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--fs-neon);
          border: 2px solid var(--fs-blue);
          flex-shrink: 0;
          margin-top: 4px;
        }
        .project-detail-timeline-line {
          width: 2px;
          flex: 1;
          background: var(--fs-border);
          min-height: 20px;
          margin: 4px 0;
        }
        .project-detail-timeline-body { flex: 1; padding-bottom: var(--fs-space-2); padding-top: 0; }
        .project-detail-changes { display: flex; flex-direction: column; gap: 10px; }
        .project-detail-change-row {
          background: var(--fs-gray);
          border: 1px solid var(--fs-border);
          padding: 10px var(--fs-space-1);
        }
        .project-detail-change-values {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          flex-wrap: wrap;
        }
        .project-detail-change-old, .project-detail-change-new {
          flex: 1;
          min-width: 120px;
          font-size: 13px;
          color: var(--fs-blue);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .project-detail-change-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fs-text-muted);
          margin-bottom: 2px;
        }
        .project-detail-change-old { opacity: 0.6; }
        .project-detail-change-arrow {
          font-size: 16px;
          color: var(--fs-text-muted);
          flex-shrink: 0;
          align-self: center;
          padding-top: 14px;
        }
        .project-detail-terms-list { display: flex; flex-direction: column; gap: var(--fs-space-2); }
        .project-detail-term-group { border: 1px solid var(--fs-border); }
        .project-detail-term-category {
          background: var(--fs-blue);
          color: var(--fs-white);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px var(--fs-space-1);
        }
        .project-detail-term-row {
          display: flex;
          align-items: center;
          gap: var(--fs-space-1);
          padding: 10px var(--fs-space-1);
          border-top: 1px solid var(--fs-border);
        }
        .project-detail-term-row:first-of-type { border-top: none; }
        .project-detail-feedback-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 6px;
          border-radius: 3px;
          transition: opacity 0.15s, background 0.15s;
        }
        .project-detail-feedback-btn:hover { background: var(--fs-gray); opacity: 1 !important; }
        .project-detail-chat-wrap {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 220px);
          min-height: 400px;
        }
        .project-detail-chat-context {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: var(--fs-space-1) var(--fs-space-2);
          border-bottom: 1px solid var(--fs-border);
          background: var(--fs-gray);
        }
        .project-detail-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--fs-space-2);
          display: flex;
          flex-direction: column;
          gap: var(--fs-space-1);
        }
        .project-detail-chat-placeholder { text-align: center; margin: auto; padding: var(--fs-space-3); }
        .project-detail-chat-msg { max-width: 75%; display: flex; flex-direction: column; gap: 4px; }
        .project-detail-chat-msg-user { align-self: flex-end; }
        .project-detail-chat-msg-assistant { align-self: flex-start; }
        .project-detail-chat-msg-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fs-text-muted);
        }
        .project-detail-chat-msg-user .project-detail-chat-msg-label { text-align: right; }
        .project-detail-chat-msg-body {
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .project-detail-chat-msg-user .project-detail-chat-msg-body { background: var(--fs-blue); color: var(--fs-white); }
        .project-detail-chat-msg-assistant .project-detail-chat-msg-body {
          background: var(--fs-gray);
          color: var(--fs-blue);
          border: 1px solid var(--fs-border);
        }
        .project-detail-chat-input-row {
          display: flex;
          gap: var(--fs-space-1);
          padding: var(--fs-space-1) var(--fs-space-2);
          border-top: 1px solid var(--fs-border);
          background: var(--fs-white);
        }
        .project-detail-chat-input {
          flex: 1;
          padding: 8px 10px;
          border: 1px solid var(--fs-border);
          font-size: 13px;
          font-family: inherit;
          color: var(--fs-blue);
          resize: none;
          border-radius: 0;
        }
        .project-detail-chat-input:focus { outline: 2px solid var(--fs-neon); outline-offset: -2px; }
      `}</style>

      <div className="project-detail-header">
        <button className="project-detail-back" onClick={onBack}>
          ← Back to projects
        </button>
        <h1 className="project-detail-title">{project.name}</h1>
        {loadError && (
          <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
            ⚠ Could not refresh project data: {loadError}
          </div>
        )}
        <div className="project-detail-meta">
          {project.property_address && <span>{project.property_address}</span>}
          {project.description && <span>{project.description}</span>}
          <span>Created {formatDate(project.created_at)}</span>
          <span>{(project.documents || []).length} document{(project.documents || []).length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="project-detail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`project-detail-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "documents" && <DocumentsTab project={project} onProjectChange={setProject} />}
        {activeTab === "timeline" && <TimelineTab project={project} />}
        {activeTab === "terms" && <TermsTab project={project} />}
        {activeTab === "chat" && <ChatTab project={project} />}
      </div>
    </>
  );
}
