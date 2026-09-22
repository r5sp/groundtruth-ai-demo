import { useEffect, useState } from "react";
import Header from "./Header";
import SectionHeading from "./SectionHeading";
import { getEvalsSummary } from "../api";
import { Loading, ErrorBar } from "./ui";

function pct(x) {
  return `${(x * 100).toFixed(1)}%`;
}

function StatTile({ label, value, sub, tone }) {
  const color = tone === "good" ? "#0f7a52" : tone === "warn" ? "#8a6d1f" : "var(--fs-blue)";
  return (
    <div
      style={{
        border: "1px solid var(--fs-border)",
        borderRadius: 10,
        padding: "18px 20px",
        background: "var(--fs-white)",
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: "1.9rem", fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "0.8rem", fontWeight: 700, marginTop: 6, color: "var(--fs-blue)" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "var(--fs-text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Bar({ value }) {
  return (
    <span style={{ display: "inline-block", width: 120, height: 8, borderRadius: 4, background: "#e5e9ec", verticalAlign: "middle" }}>
      <span style={{ display: "block", width: `${value * 100}%`, height: 8, borderRadius: 4, background: "var(--fs-neon)" }} />
    </span>
  );
}

export default function EvalsDashboard({ user, onLogout, onBack }) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    getEvalsSummary()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <Header user={user} onLogout={onLogout} onBack={onBack} toolName="Evals & Verification" />
      <main className="fs-main">
        <section className="fs-section fs-hero">
          <SectionHeading label="Evals & Verification" number={0} />
          <h1>How we know it works.</h1>
          <p className="fs-hero-lead">
            Every agent is measured against a golden dataset, and every number it produces is
            checked, against the source and by an independent second model, before a human signs
            off. This is the trust layer that makes the deployment safe to run in production.
          </p>
        </section>

        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            {error && <ErrorBar message={error} />}
            {data === undefined && !error && <Loading label="Loading eval metrics…" />}
            {data && (
              <>
                <SectionHeading label="At a glance" number={1} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
                  <StatTile label="Golden-set pass rate" value={pct(data.headline.golden_pass_rate)}
                    sub={`${data.headline.golden_passing}/${data.headline.golden_total} cases`} tone="good" />
                  <StatTile label="Verification catch rate" value={pct(data.headline.verification_catch_rate)}
                    sub={`${data.headline.numbers_caught_30d} of ${data.headline.numbers_checked_30d.toLocaleString()} numbers flagged (30d)`} tone="good" />
                  <StatTile label="Auto-release rate" value={pct(data.headline.auto_release_rate)}
                    sub="rest routed to human review" />
                  <StatTile label="Independence" value="Cross-provider"
                    sub={data.headline.cross_provider} />
                </div>
              </>
            )}
          </div>
        </section>

        {data && (
          <>
            <section className="fs-section">
              <SectionHeading label="Per-agent evals" number={2} />
              <p style={{ color: "var(--fs-text-muted)", marginBottom: 16, maxWidth: "60ch" }}>
                Each agent has its own golden dataset and task-specific rubric. A case passes only
                when the value <em>and</em> its citation match the source. Deploys are gated on these
                thresholds in CI.
              </p>
              <div className="billing-table-wrap">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Goldens</th>
                      <th>Pass rate</th>
                      <th>Grounded</th>
                      <th>Escalated to human</th>
                      <th>Rubric</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agents.map((a) => (
                      <tr key={a.agent}>
                        <td style={{ fontWeight: 700 }}>{a.agent}</td>
                        <td>{a.goldens}</td>
                        <td><Bar value={a.pass_rate} /> <span style={{ marginLeft: 8 }}>{pct(a.pass_rate)}</span></td>
                        <td>{pct(a.grounded)}</td>
                        <td>{pct(a.escalated)}</td>
                        <td style={{ color: "var(--fs-text-muted)", fontSize: "0.85rem" }}>{a.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="fs-section bg-gray">
              <div className="fs-section-inner">
                <SectionHeading label="The verification pipeline" number={3} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                  {data.pipeline.map((s) => (
                    <div key={s.stage} style={{ border: "1px solid var(--fs-border)", borderRadius: 10, padding: 20, background: "var(--fs-white)" }}>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>{s.stage}</div>
                      <div style={{ color: "var(--fs-text-muted)", fontSize: "0.9rem", lineHeight: 1.55 }}>{s.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="fs-section">
              <SectionHeading label="Recent catches" number={4} />
              <p style={{ color: "var(--fs-text-muted)", marginBottom: 16, maxWidth: "62ch" }}>
                Real interceptions from the last 48 hours, the numbers a single model would have let
                through, and what the system did instead.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {data.recent_catches.map((c, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "72px 150px 1fr 180px", gap: 14, alignItems: "center",
                    border: "1px solid var(--fs-border)", borderLeft: "4px solid var(--fs-neon)", borderRadius: 8, padding: "12px 16px", background: "var(--fs-white)" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--fs-text-muted)" }}>{c.when}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{c.agent}</span>
                    <span style={{ fontSize: "0.9rem" }}><strong>{c.field}:</strong> {c.caught}</span>
                    <span style={{ fontSize: "0.8rem", color: "#0f7a52", fontWeight: 700 }}>{c.action}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="fs-section bg-gray">
              <div className="fs-section-inner">
                <SectionHeading label="Audit log" number={5} />
                <p style={{ color: "var(--fs-text-muted)", marginBottom: 16, maxWidth: "60ch" }}>
                  Every verification decision, human action, and eval run is logged immutably, the
                  paper trail an enterprise buyer needs before trusting AI with real decisions.
                </p>
                <div className="billing-table-wrap">
                  <table className="billing-table">
                    <thead>
                      <tr><th>Timestamp</th><th>Actor</th><th>Event</th><th>Level</th></tr>
                    </thead>
                    <tbody>
                      {data.audit.map((e, i) => (
                        <tr key={i}>
                          <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{e.ts}</td>
                          <td>{e.actor}</td>
                          <td>{e.event}</td>
                          <td>
                            <span className={`badge-severity ${e.level === "critical" ? "critical" : "info"}`}>{e.level}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="fs-footer">
        <div className="fs-footer-inner">
          <span className="fs-footer-wordmark">GroundTruth</span>
          <span className="fs-footer-copy">Evals & Verification · Applied AI</span>
        </div>
      </footer>
    </>
  );
}
