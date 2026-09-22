import { useEffect, useState } from "react";
import Header from "./Header";
import SectionHeading from "./SectionHeading";
import { getLatestBrief, getBriefRuns, getBriefRun, runBrief } from "../api";
import Feedback from "./Feedback";
import { EmptyState } from "./ui";

const SECTION_ORDER = ["news", "power_station", "competitor", "regulatory"];

function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d)
    ? s
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function fmtDay(s) {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function bps(n) {
  if (n === null || n === undefined) return "n/a";
  if (n === 0) return "flat";
  return `${n > 0 ? "+" : ""}${n} bps`;
}

function RatesPanel({ rates }) {
  if (!rates || !rates.available) {
    return <p className="brief-muted">Interest-rate data unavailable this run.</p>;
  }
  return (
    <div className="brief-rates">
      {rates.instruments.map((r) => (
        <div className="brief-rate" key={r.label}>
          <div className="brief-rate-label">{r.label}</div>
          <div className="brief-rate-val">{r.value.toFixed(2)}%</div>
          <div className={`brief-rate-delta ${(r.day_bps ?? 0) > 0 ? "up" : (r.day_bps ?? 0) < 0 ? "down" : ""}`}>
            {bps(r.day_bps)} d/d
          </div>
          <div className="brief-rate-week">{bps(r.week_bps)} w/w</div>
          {/* SOFR publishes for the prior business day, so it can trail the
              Treasury curve: show its own date when it differs. */}
          {r.as_of && r.as_of !== rates.as_of && (
            <div className="brief-rate-own-asof">as of {r.as_of}</div>
          )}
        </div>
      ))}
      {rates.as_of && <div className="brief-muted brief-rate-asof">as of {rates.as_of}</div>}
    </div>
  );
}

function SourcesStrip({ sources, moreCount }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="brief-sources">
      <span className="brief-sources-label">Sources:</span>
      {sources.map((s, i) => (
        <span className="brief-citation" key={i}>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              [{i + 1}] {s.title}
            </a>
          ) : (
            <span>[{i + 1}] {s.title}</span>
          )}
          {s.source && <span className="brief-muted"> · {s.source}</span>}
        </span>
      ))}
      {moreCount > 0 && (
        <span className="brief-muted">+{moreCount} more in the full sections below</span>
      )}
    </div>
  );
}

function ItemCard({ item }) {
  return (
    <div className="brief-item">
      <div className="brief-item-head">
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="brief-item-title">
            {item.title}
          </a>
        ) : (
          <span className="brief-item-title">{item.title}</span>
        )}
        {item.importance != null && (
          <span className="brief-chip" title="Importance">{item.importance}</span>
        )}
      </div>
      <div className="brief-item-meta">
        {item.source && <span>{item.source}</span>}
        {item.published_at && <span>{fmtDay(item.published_at)}</span>}
        {(item.neighborhoods || []).map((n) => (
          <span className="brief-tag" key={n}>{n}</span>
        ))}
      </div>
      {item.summary && <p className="brief-item-summary">{item.summary}</p>}
      {item.why_it_matters && <p className="brief-item-why">Why it matters: {item.why_it_matters}</p>}
      <div className="brief-item-fb">
        <Feedback agent="brief" targetType="brief_item" targetRef={item.url || item.title} />
      </div>
    </div>
  );
}

export default function MorningBrief({ user, onLogout, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // { run, brief }
  const [runs, setRuns] = useState([]);
  const [running, setRunning] = useState(false);

  const runNow = async () => {
    setRunning(true);
    setError("");
    const baselineId = data?.run?.id || null;
    try {
      await runBrief(); // kicks off a background run; poll for the result
      const deadline = Date.now() + 4 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((res) => setTimeout(res, 6000));
        const latest = await getLatestBrief();
        if (latest?.run?.id && latest.run.id !== baselineId) {
          setData(latest);
          const rr = await getBriefRuns();
          setRuns(rr.runs || []);
          return;
        }
      }
      setError("Still building. Give it another minute, then refresh.");
    } catch (e) {
      setError(e.message || "Failed to run brief");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    getLatestBrief()
      .then((d) => setData(d))
      .catch((e) => setError(e.message || "Failed to load brief"))
      .finally(() => setLoading(false));
    getBriefRuns()
      .then((d) => setRuns(d.runs || []))
      .catch(() => setRuns([]));
  }, []);

  const openRun = async (id) => {
    setLoading(true);
    try {
      const d = await getBriefRun(id);
      setData(d);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const brief = data?.brief;
  const run = data?.run;
  const counts = brief?.counts;
  const labels = brief?.section_labels || {};

  return (
    <>
      <Header user={user} onLogout={onLogout} onBack={onBack} toolName="Morning Intelligence Brief" demo="/demos/brief.mp4" />

      <main className="fs-main">
        <section className="fs-section fs-hero">
          <SectionHeading label="About this tool" number={1} />
          <h1>What moved overnight.</h1>
          <p className="fs-hero-lead">
            A daily brief of SF real-estate developments: market news, Power Station, competitor
            activity, regulatory changes, and interest-rate moves, with priority focus on Dogpatch
            and SoMa. Produced automatically each morning.
          </p>
        </section>

        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <SectionHeading label="Today's brief" number={2} />
              <button className="btn btn-secondary btn-sm" onClick={runNow} disabled={running || loading}>
                {running ? "Running…" : "Run now"}
              </button>
            </div>

            {loading && <div className="status-bar processing"><div className="spinner" />Loading brief…</div>}
            {running && <div className="status-bar processing"><div className="spinner" />Building brief. This can take up to a minute…</div>}
            {error && !loading && <div className="status-bar error">{error}</div>}

            {!loading && !error && !brief && (
              <EmptyState
                title="No brief yet"
                hint="It runs automatically every morning, or hit “Run now” above to generate today's."
              />
            )}

            {!loading && brief && (
              <>
                {brief.digest && <p className="brief-digest">{brief.digest}</p>}
                <SourcesStrip sources={brief.top_sources} moreCount={brief.more_sources} />
                <div className="brief-meta-line">
                  {counts && (
                    <span>
                      {counts.total_items} new item{counts.total_items === 1 ? "" : "s"} ·{" "}
                      {counts.dogpatch_soma ?? 0} Dogpatch/SoMa ·{" "}
                      {counts.by_section?.power_station ?? 0} Power Station ·{" "}
                      {counts.by_section?.competitor ?? 0} competitor ·{" "}
                      {counts.by_section?.regulatory ?? 0} regulatory
                    </span>
                  )}
                  {run?.created_at && <span className="brief-muted">last run {fmtDate(run.created_at)}</span>}
                  {brief.ai_used === false && (
                    <span className="brief-muted">AI summarization unavailable (keyword mode)</span>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {!loading && brief && (
          <section className="fs-section">
            <div className="fs-section-inner">
              <SectionHeading label={labels.rates || "Interest Rates"} number={3} />
              <RatesPanel rates={brief.rates} />
              {brief.rates?.instruments?.length > 0 && (
                <p className="brief-muted">{brief.rates.source || ""}</p>
              )}

              {SECTION_ORDER.map((key) => {
                const items = brief.sections?.[key] || [];
                return (
                  <div className="brief-section" key={key}>
                    <h3 className="brief-section-title">
                      {labels[key] || key} <span className="brief-count">{items.length}</span>
                    </h3>
                    {items.length === 0 ? (
                      <p className="brief-muted">Nothing new.</p>
                    ) : (
                      items.map((it, i) => <ItemCard item={it} key={i} />)
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            <SectionHeading label="Past briefs" number={brief ? 4 : 3} />
            {runs.length === 0 ? (
              <p className="brief-muted">No past briefs yet.</p>
            ) : (
              <div className="brief-history">
                {runs.map((r) => (
                  <div className="brief-hrow" key={r.id}>
                    <span className="brief-hrow-date">{fmtDate(r.created_at)}</span>
                    <span className="brief-muted">{r.item_count ?? "-"} items</span>
                    <span className="brief-muted">{r.ai_used ? "AI" : "keyword"}</span>
                    <button className="brief-link" onClick={() => openRun(r.id)}>open</button>
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
          <span className="fs-footer-copy">Morning intelligence brief · San Francisco</span>
        </div>
      </footer>
    </>
  );
}
