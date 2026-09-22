import { useState, useRef, useCallback } from "react";
import Header from "./Header";
import SectionHeading from "./SectionHeading";
import { scanRentRoll } from "../api";

const ACCEPTED_EXTENSIONS = [".csv", ".tsv", ".xlsx", ".xls"];

const SEVERITY_META = {
  critical: { label: "Critical", rank: 0, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  high: { label: "High", rank: 1, color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  medium: { label: "Medium", rank: 2, color: "#a16207", bg: "#fefce8", border: "#fde68a" },
  low: { label: "Low", rank: 3, color: "#3f6212", bg: "#f7fee7", border: "#d9f99d" },
  info: { label: "Info", rank: 4, color: "#374151", bg: "#f3f4f6", border: "#e5e7eb" },
};

function sevMeta(s) {
  return SEVERITY_META[s] || SEVERITY_META.info;
}

function fmtMoney(n) {
  if (n == null) return "-";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function getFileExt(name) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

function RentRollUpload({ onFileSelected, selectedFile, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      const ext = getFileExt(file.name);
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError("Only CSV, TSV, XLSX, and XLS rent rolls are supported.");
        return;
      }
      setError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div className="card">
      <div
        className={`upload-zone ${dragOver ? "drag-over" : ""}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleFile(file);
          }}
          disabled={disabled}
        />
        <p className="upload-label">Drop your rent roll here</p>
        <p>or click to browse (CSV, XLSX, XLS, and TSV supported)</p>
        <p className="file-types">One file at a time</p>
      </div>

      {error && (
        <div className="status-bar error" style={{ marginTop: "var(--fs-space-2)" }}>
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="file-info">
          <div>
            <strong>{selectedFile.name}</strong>
            <div className="meta">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RentRollTool({ user, onLogout, onBack }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [asOf, setAsOf] = useState("");
  const [status, setStatus] = useState(null); // null | processing | success | error
  const [statusMessage, setStatusMessage] = useState("");
  const [report, setReport] = useState(null);

  const handleScan = async () => {
    if (!selectedFile) return;
    setStatus("processing");
    setStatusMessage("Scanning rent roll for anomalies…");
    setReport(null);
    try {
      const result = await scanRentRoll(selectedFile, { asOf: asOf || undefined });
      setReport(result);
      setStatus("success");
      const counts = result.severity_counts || {};
      setStatusMessage(
        `Scan complete: ${result.anomalies.length} item(s) flagged across ` +
          `${result.record_count} units.`
      );
      void counts;
    } catch (err) {
      setStatus("error");
      setStatusMessage(err.message || "An unexpected error occurred.");
    }
  };

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rent-roll-report-${report.as_of || "scan"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedAnomalies = report
    ? [...report.anomalies].sort((a, b) => {
        const r = sevMeta(a.severity).rank - sevMeta(b.severity).rank;
        if (r !== 0) return r;
        return (b.annual_impact || 0) - (a.annual_impact || 0);
      })
    : [];

  const counts = report?.severity_counts || {};

  return (
    <>
      <Header user={user} onLogout={onLogout} onBack={onBack} tag="Rent Roll Anomaly Detector" demo="/demos/rentroll.mp4" demoTitle="Rent Roll Anomaly Detector" />

      <main className="fs-main">
        <section className="fs-section fs-hero">
          <SectionHeading label="About this tool" number={1} />
          <h1>Catch rent roll discrepancies before they compound.</h1>
          <p className="fs-hero-lead">
            Upload a rent roll and get an exception report in seconds: missed escalations,
            expired free-rent periods, CAM recovery gaps, holdovers, and data-quality issues,
            each with the estimated annual dollars at stake.
          </p>
        </section>

        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            <SectionHeading label="Upload rent roll" number={2} />
            <RentRollUpload
              onFileSelected={setSelectedFile}
              selectedFile={selectedFile}
              disabled={status === "processing"}
            />

            <div style={{ marginTop: "var(--fs-space-3)" }}>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                Review date <span style={{ fontWeight: 400, color: "var(--fs-text-muted)" }}>(optional, defaults to today)</span>
              </label>
              <input
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                disabled={status === "processing"}
                style={{
                  padding: "0.6rem 0.75rem",
                  border: "1px solid var(--fs-border)",
                  background: "var(--fs-white)",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div className="btn-group">
              <button
                className="btn btn-primary"
                onClick={handleScan}
                disabled={!selectedFile || status === "processing"}
              >
                {status === "processing" ? "Scanning…" : "Scan for anomalies"}
              </button>
            </div>

            {status && (
              <div
                className={`status-bar ${status}`}
                style={{ marginTop: "var(--fs-space-3)" }}
              >
                {status === "processing" && <div className="spinner" />}
                {statusMessage}
              </div>
            )}
          </div>
        </section>

        {report && (
          <section className="fs-section">
            <div className="fs-section-inner">
              <SectionHeading label="Exception report" number={3} />

              <div className="results-header">
                <div>
                  <h2 className="results-title">{fmtMoney(report.total_annual_impact)} / yr at risk</h2>
                  <p className="results-file">
                    {report.source_file} · {report.record_count} units reviewed · as of{" "}
                    {report.as_of}
                  </p>
                </div>
                <div className="btn-group" style={{ marginTop: 0 }}>
                  <button className="btn btn-secondary" onClick={downloadJson}>
                    Download JSON
                  </button>
                </div>
              </div>

              {/* Severity summary chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  margin: "var(--fs-space-2) 0 var(--fs-space-3)",
                }}
              >
                {["critical", "high", "medium", "low"].map((s) => {
                  const m = sevMeta(s);
                  const n = counts[s] || 0;
                  return (
                    <div
                      key={s}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "0.5rem",
                        padding: "0.5rem 0.9rem",
                        background: m.bg,
                        border: `1px solid ${m.border}`,
                        color: m.color,
                        fontSize: "0.875rem",
                        opacity: n === 0 ? 0.45 : 1,
                      }}
                    >
                      <strong style={{ fontSize: "1.1rem" }}>{n}</strong>
                      {m.label}
                    </div>
                  );
                })}
              </div>

              {report.narrative && (
                <p
                  style={{
                    background: "var(--fs-white)",
                    border: "1px solid var(--fs-border)",
                    padding: "var(--fs-space-2)",
                    lineHeight: 1.6,
                    marginBottom: "var(--fs-space-3)",
                  }}
                >
                  {report.narrative}
                </p>
              )}

              {report.load_warnings && report.load_warnings.length > 0 && (
                <div className="status-bar error" style={{ marginBottom: "var(--fs-space-3)" }}>
                  {report.load_warnings.length} load warning(s):{" "}
                  {report.load_warnings.join("; ")}
                </div>
              )}

              {sortedAnomalies.length === 0 ? (
                <p style={{ color: "var(--fs-text-muted)" }}>
                  No anomalies found. This rent roll looks clean.
                </p>
              ) : (
                <div className="terms-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "2px solid var(--fs-blue)" }}>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Severity</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Property / Unit</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Tenant</th>
                        <th style={{ padding: "0.6rem 0.5rem" }}>Finding</th>
                        <th style={{ padding: "0.6rem 0.5rem", textAlign: "right" }}>Annual $</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAnomalies.map((a, i) => {
                        const m = sevMeta(a.severity);
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid var(--fs-border)" }}>
                            <td style={{ padding: "0.6rem 0.5rem", whiteSpace: "nowrap" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.15rem 0.5rem",
                                  background: m.bg,
                                  border: `1px solid ${m.border}`,
                                  color: m.color,
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.03em",
                                }}
                              >
                                {m.label}
                              </span>
                            </td>
                            <td style={{ padding: "0.6rem 0.5rem" }}>
                              <div style={{ fontWeight: 600 }}>{a.property_name || "-"}</div>
                              <div style={{ color: "var(--fs-text-muted)", fontSize: "0.8rem" }}>
                                {a.unit_id}
                              </div>
                            </td>
                            <td style={{ padding: "0.6rem 0.5rem" }}>{a.tenant_name || "-"}</td>
                            <td style={{ padding: "0.6rem 0.5rem" }}>
                              <div style={{ fontWeight: 600 }}>{a.title}</div>
                              <div style={{ color: "var(--fs-text-muted)", fontSize: "0.82rem", lineHeight: 1.45 }}>
                                {a.detail}
                              </div>
                              {a.recommended_action && (
                                <div style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>
                                  <em>→ {a.recommended_action}</em>
                                </div>
                              )}
                              {a.ai_explanation && (
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    marginTop: "0.3rem",
                                    color: "var(--fs-text-muted)",
                                  }}
                                >
                                  {a.ai_explanation}
                                </div>
                              )}
                            </td>
                            <td
                              style={{
                                padding: "0.6rem 0.5rem",
                                textAlign: "right",
                                fontVariantNumeric: "tabular-nums",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {a.annual_impact ? fmtMoney(a.annual_impact) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="fs-footer">
        <div className="fs-footer-inner">
          <span className="fs-footer-wordmark">GroundTruth</span>
          <span className="fs-footer-copy">Rent roll anomaly detection · San Francisco</span>
        </div>
      </footer>
    </>
  );
}
