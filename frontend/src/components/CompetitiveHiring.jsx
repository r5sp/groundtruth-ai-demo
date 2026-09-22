import { useEffect, useState } from "react";
import Header from "./Header";
import SectionHeading from "./SectionHeading";
import { getLatestHiring, runHiring } from "../api";
import Feedback from "./Feedback";
import { EmptyState, ErrorBar, Loading } from "./ui";
import "./hiring.css";

const STATUS_LABEL = {
  new: "New",
  updated: "Updated",
  closed: "Closed",
  active: "Active",
};

function Stat({ label, value, tone }) {
  return (
    <div className={`hiring-stat ${tone || ""}`}>
      <div className="hiring-stat-value">{value}</div>
      <div className="hiring-stat-label">{label}</div>
    </div>
  );
}

export default function CompetitiveHiring({ user, onLogout, onBack }) {
  const [data, setData] = useState(undefined); // undefined = loading
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    getLatestHiring()
      .then((res) => setData(res.dashboard || null))
      .catch((err) => setError(err.message));
  }, []);

  const runNow = async () => {
    setRunning(true);
    setError("");
    try {
      const before = await getLatestHiring();
      const baselineId = before?.run?.id || null;
      await runHiring(); // background scan; poll for the new run
      const deadline = Date.now() + 4 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((res) => setTimeout(res, 6000));
        const latest = await getLatestHiring();
        if (latest?.run?.id && latest.run.id !== baselineId) {
          setData(latest.dashboard || null);
          return;
        }
      }
      setError("Still scanning. Give it another minute, then refresh.");
    } catch (err) {
      setError(err.message || "Scan failed");
    } finally {
      setRunning(false);
    }
  };

  const body = () => {
    if (error) return <ErrorBar message={error} />;
    if (data === undefined) return <Loading label="Loading dashboard…" />;
    if (!data) {
      return (
        <EmptyState
          title="No scan yet"
          hint="It runs automatically every morning, or hit “Run scan now” above to see it immediately."
        />
      );
    }

    const s = data.summary || {};
    const intel = data.intelligence || {};
    const recent = data.recent_activity || [];
    const allCompanies = data.company_comparison || [];
    // Only chart companies that actually have Bay Area roles; the rest are either
    // JS-rendered career pages we can't scrape yet or genuinely have no openings,
    // and a wall of zeros just buries the real signal.
    const companies = allCompanies.filter((c) => (c.active || 0) > 0);
    const zeroCount = allCompanies.length - companies.length;
    const maxActive = Math.max(1, ...companies.map((c) => c.active || 0));

    return (
      <>
        {data.data_mode === "demo" && (
          <div className="hiring-demo-badge">DEMO / SAMPLE DATA</div>
        )}

        <div className="hiring-stats">
          <Stat label="Active roles" value={s.total_active_roles ?? "-"} />
          <Stat label="New since last scan" value={s.new_since_last_scan ?? 0} tone="pos" />
          <Stat label="Closed since last scan" value={s.closed_since_last_scan ?? 0} tone="neg" />
          <Stat label="Companies tracked" value={`${s.companies_tracked ?? 0}/${s.companies_total ?? 0}`} />
          <Stat label="Healthy sources" value={s.healthy_sources ?? 0} />
          <Stat label="Adapter needed" value={s.adapter_needed_sources ?? 0} />
        </div>

        {intel.executive_summary?.length > 0 && (
          <section className="fs-section-inner hiring-block">
            <SectionHeading label="Executive summary" number={1} />
            <ul className="hiring-list">
              {intel.executive_summary.map((line, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: mdBold(line) }} />
              ))}
            </ul>
          </section>
        )}

        {intel.competitive_read?.length > 0 && (
          <section className="fs-section-inner hiring-block">
            <SectionHeading label="Competitive read" number={2} />
            <ul className="hiring-list">
              {intel.competitive_read.map((line, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: mdBold(line) }} />
              ))}
            </ul>
          </section>
        )}

        {allCompanies.length > 0 && (
          <section className="fs-section-inner hiring-block">
            <SectionHeading label="Active roles by company" number={3} />
            {companies.length > 0 && (
              <div className="hiring-bars">
                {companies
                  .slice()
                  .sort((a, b) => (b.active || 0) - (a.active || 0))
                  .map((c) => (
                    <div key={c.name} className="hiring-bar-row">
                      <span className="hiring-bar-name">{c.name}</span>
                      <span className="hiring-bar-track">
                        <span
                          className="hiring-bar-fill"
                          style={{ width: `${((c.active || 0) / maxActive) * 100}%` }}
                        />
                      </span>
                      <span className="hiring-bar-count">{c.active || 0}</span>
                    </div>
                  ))}
              </div>
            )}
            {zeroCount > 0 && (
              <p style={{ color: "var(--fs-light-blue)", marginTop: "var(--fs-space-2)", fontSize: "0.875rem" }}>
                {zeroCount} more competitor{zeroCount === 1 ? "" : "s"} tracked with no current Bay Area
                roles, or on a career site we can't auto-read yet ({s.adapter_needed_sources ?? 0} need a
                dedicated scraper).
              </p>
            )}
          </section>
        )}

        {recent.length > 0 && (
          <section className="fs-section-inner hiring-block">
            <SectionHeading label="Recent activity" number={4} />
            <div className="billing-table-wrap">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Department</th>
                    <th>Seniority</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i}>
                      <td>{r.company}</td>
                      <td className="wrap">
                        {r.source_url ? (
                          <a href={r.source_url} target="_blank" rel="noopener noreferrer">
                            {r.title}
                          </a>
                        ) : (
                          r.title
                        )}
                      </td>
                      <td>{r.location || "-"}</td>
                      <td>{r.department || "-"}</td>
                      <td>{r.seniority || "-"}</td>
                      <td>
                        <span className={`hiring-badge ${r.status}`}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                        <Feedback agent="hiring" targetType="hiring_role" targetRef={`${r.company}:${r.title}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} onBack={onBack} toolName="Competitive Hiring" demo="/demos/hiring.mp4" />
      <main className="fs-main">
        <section className="fs-section fs-hero">
          <SectionHeading label="Competitive Hiring Intelligence" number={0} />
          <h1>Who's hiring, for what, and what it signals.</h1>
          <p className="fs-hero-lead">
            A daily read on SF / Bay Area commercial real-estate competitors: open roles by
            company, what changed since the last scan, and a rule-based competitive read.
          </p>
        </section>
        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--fs-space-2)" }}>
              <button className="btn btn-secondary btn-sm" onClick={runNow} disabled={running}>
                {running ? "Scanning…" : "Run scan now"}
              </button>
            </div>
            {running && (
              <div className="status-bar processing" style={{ marginBottom: "var(--fs-space-2)" }}>
                <div className="spinner" />
                Scanning competitor job boards. This can take a minute or two…
              </div>
            )}
            {body()}
          </div>
        </section>
      </main>
      <footer className="fs-footer">
        <div className="fs-footer-inner">
          <span className="fs-footer-wordmark">GroundTruth</span>
          <span className="fs-footer-copy">Competitive Hiring · San Francisco</span>
        </div>
      </footer>
    </>
  );
}

// Render the source's *bold* markers (used in exec summary / competitive read).
function mdBold(text) {
  const esc = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
}
