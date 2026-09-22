import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import SectionHeading from "./SectionHeading";
import {
  processTimesheet,
  getTimesheetRuns,
  getTimesheetRun,
  getTimesheetDownloadUrl,
} from "../api";

function fmt(n) {
  if (n === null || n === undefined || n === "") return "-";
  const x = Number(n);
  return Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/\.?0+$/, "");
}

function fmtDate(s) {
  if (!s) return "-";
  const d = new Date(s);
  return isNaN(d)
    ? s
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Bars({ items, labelKey, total }) {
  const max = Math.max(...items.map((i) => i.hours), 1);
  return (
    <div className="ts-bars">
      {items.map((i) => {
        const pct = total ? Math.round((i.hours / total) * 100) : 0;
        return (
          <div className="ts-bar-row" key={i[labelKey]}>
            <div className="ts-bar-label" title={i[labelKey]}>{i[labelKey]}</div>
            <div className="ts-bar-track">
              <div className="ts-bar-fill" style={{ width: `${(i.hours / max) * 100}%` }} />
            </div>
            <div className="ts-bar-val">{fmt(i.hours)} · {pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

function MasterDetail({ list, detail }) {
  return (
    <div className="ts-md">
      <div className="ts-md-list">{list}</div>
      <div className="ts-md-detail">{detail}</div>
    </div>
  );
}

function EmployeeView({ results }) {
  const rows = useMemo(
    () => [...results.matrix].sort((a, b) => b.total - a.total),
    [results]
  );
  const [selected, setSelected] = useState(0);
  const row = rows[selected];
  const breakdown = results.jobs
    .map((job, i) => ({ job, hours: row.cells[i] }))
    .filter((x) => x.hours)
    .sort((a, b) => b.hours - a.hours);

  return (
    <MasterDetail
      list={rows.map((r, i) => (
        <button
          key={r.employee}
          className={`ts-md-item ${i === selected ? "active" : ""}`}
          onClick={() => setSelected(i)}
        >
          <span className="ts-mi-name">{r.employee}</span>
          <span className="ts-mi-val">{fmt(r.total)}</span>
        </button>
      ))}
      detail={
        <>
          <div className="ts-detail-head">
            <h3>{row.employee}</h3>
            <div className="ts-dh-sub">
              {fmt(row.total)} hours across {breakdown.length} job{breakdown.length === 1 ? "" : "s"}
            </div>
          </div>
          <Bars items={breakdown} labelKey="job" total={row.total} />
        </>
      }
    />
  );
}

function JobView({ results }) {
  const jobs = results.job_totals;
  const [selected, setSelected] = useState(0);
  const jt = jobs[selected];
  const jobIdx = results.jobs.indexOf(jt.job);
  const breakdown = results.matrix
    .map((row) => ({ employee: row.employee, hours: row.cells[jobIdx] }))
    .filter((x) => x.hours)
    .sort((a, b) => b.hours - a.hours);

  return (
    <MasterDetail
      list={jobs.map((j, i) => (
        <button
          key={j.job}
          className={`ts-md-item ${i === selected ? "active" : ""}`}
          onClick={() => setSelected(i)}
        >
          <span className="ts-mi-name">{j.job}</span>
          <span className="ts-mi-val">{fmt(j.total)}</span>
        </button>
      ))}
      detail={
        <>
          <div className="ts-detail-head">
            <h3>{jt.job}</h3>
            <div className="ts-dh-sub">
              {fmt(jt.total)} hours across {breakdown.length} employee{breakdown.length === 1 ? "" : "s"}
            </div>
          </div>
          <Bars items={breakdown} labelKey="employee" total={jt.total} />
        </>
      }
    />
  );
}

function ListView({ results }) {
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState("hours");
  const entries = useMemo(() => {
    const out = [];
    results.matrix.forEach((row) =>
      row.cells.forEach((v, i) => {
        if (v) out.push({ employee: row.employee, job: results.jobs[i], hours: v });
      })
    );
    return out;
  }, [results]);

  const rows = entries
    .filter(
      (e) =>
        e.employee.toLowerCase().includes(term.toLowerCase()) ||
        e.job.toLowerCase().includes(term.toLowerCase())
    )
    .sort((a, b) =>
      sort === "employee"
        ? a.employee.localeCompare(b.employee) || b.hours - a.hours
        : sort === "job"
          ? a.job.localeCompare(b.job) || b.hours - a.hours
          : b.hours - a.hours
    );

  return (
    <>
      <div className="ts-list-controls">
        <input
          type="search"
          placeholder="Filter by employee or job…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="hours">Sort: hours (high → low)</option>
          <option value="employee">Sort: employee (A → Z)</option>
          <option value="job">Sort: job (A → Z)</option>
        </select>
        <span className="ts-muted">{rows.length} of {entries.length} entries</span>
      </div>
      <div className="ts-grid-wrap">
        <table className="ts-grid">
          <thead>
            <tr><th>Employee</th><th>Job</th><th>Hours</th></tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={i}>
                <td>{e.employee}</td>
                <td>{e.job}</td>
                <td className="ts-num">{fmt(e.hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function GridView({ results }) {
  return (
    <div className="ts-grid-wrap">
      <table className="ts-grid">
        <thead>
          <tr>
            <th>Employee</th>
            {results.jobs.map((j) => <th key={j}>{j}</th>)}
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {results.matrix.map((row) => (
            <tr key={row.employee}>
              <td>{row.employee}</td>
              {row.cells.map((v, i) => (
                <td key={i} className={v ? "" : "ts-zero"}>{v ? fmt(v) : "·"}</td>
              ))}
              <td className="ts-total">{fmt(row.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>TOTAL</td>
            {results.column_totals.map((v, i) => <td key={i}>{fmt(v)}</td>)}
            <td>{fmt(results.grand_total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const VIEWS = [
  { id: "grid", label: "Grid" },
  { id: "employee", label: "By employee" },
  { id: "job", label: "By job" },
  { id: "list", label: "List" },
];

export default function TimesheetAgent({ user, onLogout, onBack }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [monthLabel, setMonthLabel] = useState("");
  const [status, setStatus] = useState(null); // null | "processing" | "success" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [results, setResults] = useState(null);
  const [runId, setRunId] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null); // Supabase signed URL, when available
  const [view, setView] = useState("grid");
  const [runs, setRuns] = useState([]);
  const [dragging, setDragging] = useState(false);

  const loadRuns = () => {
    getTimesheetRuns()
      .then((data) => setRuns(data.runs))
      .catch(() => setRuns([]));
  };

  useEffect(loadRuns, []);

  const pickFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setStatus("error");
      setStatusMessage("Please choose an .xlsx file.");
      return;
    }
    setSelectedFile(f);
    setStatus(null);
    setStatusMessage("");
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setStatus("processing");
    setStatusMessage("Building hours grid…");
    try {
      const data = await processTimesheet(selectedFile, monthLabel);
      setResults(data.results);
      setRunId(data.run.id);
      setDownloadUrl(data.download_url || null);
      setStatus("success");
      const s = data.results.summary;
      setStatusMessage(
        `Done: ${s.employees} employees, ${s.jobs} jobs, ${fmt(s.grand_total)} total hours, ` +
          `${s.anomalies} anomal${s.anomalies === 1 ? "y" : "ies"} flagged.`
      );
      loadRuns();
    } catch (err) {
      setStatus("error");
      setStatusMessage(err.message || "An unexpected error occurred.");
    }
  };

  const openRun = async (id) => {
    setStatus("processing");
    setStatusMessage("Loading run…");
    try {
      const data = await getTimesheetRun(id);
      setResults(data.results);
      setRunId(data.run.id);
      setDownloadUrl(data.download_url || null);
      setStatus(null);
      setStatusMessage("");
    } catch (err) {
      setStatus("error");
      setStatusMessage(err.message);
    }
  };

  const summary = results?.summary;

  return (
    <>
      <Header user={user} onLogout={onLogout} onBack={onBack} toolName="Timesheet Reimbursements" demo="/demos/timesheet.mp4" />

      <main className="fs-main">
        <section className="fs-section fs-hero">
          <SectionHeading label="About this tool" number={1} />
          <h1>Every hour, on the grid.</h1>
          <p className="fs-hero-lead">
            Upload the monthly timesheet export to build a per-employee, per-job hours grid,
            a UCSF-reimbursable rollup, and an anomaly report. Hours only, no salary or cost.
          </p>
        </section>

        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            <SectionHeading label="Upload export" number={2} />
            <div
              className={`upload-zone ${dragging ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files[0]);
              }}
            >
              <p className="ts-dz-title">
                {selectedFile ? selectedFile.name : "Drop the monthly timesheet export here"}
              </p>
              <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
                Browse (.xlsx)
                <input
                  type="file"
                  accept=".xlsx"
                  hidden
                  onChange={(e) => pickFile(e.target.files[0])}
                />
              </label>
            </div>
            <div className="ts-controls">
              <input
                type="text"
                placeholder="Label (optional, e.g. May 2026)"
                value={monthLabel}
                onChange={(e) => setMonthLabel(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={handleProcess}
                disabled={!selectedFile || status === "processing"}
              >
                {status === "processing" ? "Processing…" : "Build hours grid"}
              </button>
            </div>
            {status && (
              <div className={`status-bar ${status}`} style={{ marginTop: "var(--fs-space-3)" }}>
                {status === "processing" && <div className="spinner" />}
                {statusMessage}
              </div>
            )}
          </div>
        </section>

        {results && (
          <section className="fs-section">
            <div className="fs-section-inner">
              <SectionHeading label="Results" number={3} />

              <div className="ts-summary">
                <div className="ts-stat"><div className="ts-stat-num">{summary.employees}</div><div className="ts-stat-lbl">Employees</div></div>
                <div className="ts-stat"><div className="ts-stat-num">{summary.jobs}</div><div className="ts-stat-lbl">Jobs</div></div>
                <div className="ts-stat"><div className="ts-stat-num">{fmt(summary.grand_total)}</div><div className="ts-stat-lbl">Total hours</div></div>
                <div className="ts-stat"><div className="ts-stat-num">{fmt(summary.ucsf_total)}</div><div className="ts-stat-lbl">UCSF reimbursable</div></div>
                <div className={`ts-stat ${summary.anomalies ? "ts-stat--flag" : ""}`}>
                  <div className="ts-stat-num">{summary.anomalies}</div>
                  <div className="ts-stat-lbl">Anomalies</div>
                </div>
              </div>

              <div className="ts-card">
                <h3 className="ts-card-title">Anomalies</h3>
                {results.anomalies.length === 0 ? (
                  <p className="ts-no-flags">✓ No anomalies detected.</p>
                ) : (
                  results.anomalies.map((a, i) => (
                    <div className="ts-anomaly" key={i}>
                      <div>
                        <div className="ts-anomaly-cat">{a.category}</div>
                        <div className="ts-anomaly-who">{a.who}</div>
                      </div>
                      <div>{a.detail}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="ts-card">
                <div className="ts-tabbar">
                  <div className="ts-tabs">
                    {VIEWS.map((v) => (
                      <button
                        key={v.id}
                        className={`ts-tab ${view === v.id ? "active" : ""}`}
                        onClick={() => setView(v.id)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  {(downloadUrl || runId) && (
                    <a
                      className="btn btn-secondary"
                      href={downloadUrl || getTimesheetDownloadUrl(runId)}
                      target={downloadUrl ? "_blank" : undefined}
                      rel={downloadUrl ? "noopener noreferrer" : undefined}
                      download
                    >
                      ⬇ Download .xlsx
                    </a>
                  )}
                </div>
                {view === "grid" && <GridView results={results} />}
                {view === "employee" && <EmployeeView results={results} />}
                {view === "job" && <JobView results={results} />}
                {view === "list" && <ListView results={results} />}
              </div>
            </div>
          </section>
        )}

        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            <SectionHeading label="History" number={results ? 4 : 3} />
            {runs.length === 0 ? (
              <p className="ts-muted">No runs yet. Upload an export to get started.</p>
            ) : (
              <div className="ts-history">
                {runs.map((run) => (
                  <div className="ts-hrow" key={run.id}>
                    <span className="ts-hrow-label">{run.month_label || run.source_filename}</span>
                    <span className="ts-muted">
                      {fmtDate(run.created_at)}
                      {run.uploaded_by ? ` · ${run.uploaded_by}` : ""}
                    </span>
                    <span>{run.employee_count ?? "-"} emp</span>
                    <span>{run.job_count ?? "-"} jobs</span>
                    <span>{fmt(run.total_hours)} hrs</span>
                    <span>{run.anomaly_count ? `⚠ ${run.anomaly_count}` : "✓ 0"}</span>
                    <button className="ts-link" onClick={() => openRun(run.id)}>open</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="fs-footer">
        <div className="fs-footer-inner">
          <span className="fs-footer-wordmark">GroundTruth</span>
          <span className="fs-footer-copy">Timesheet Reimbursements · San Francisco</span>
        </div>
      </footer>
    </>
  );
}
