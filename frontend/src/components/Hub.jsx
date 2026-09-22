import { useEffect, useState } from "react";
import Header from "./Header";
import { getSystemStatus } from "../api";

function agoLabel(h) {
  if (h == null) return "no runs yet";
  if (h < 1) return "just now";
  if (h < 48) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function SystemStatus() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    getSystemStatus().then(setStatus).catch(() => {});
  }, []);
  if (!status) return null;
  return (
    <div className="hub-status">
      <p className="hub-section-label">System status</p>
      <div className="hub-status-grid">
        {status.agents.map((a) => {
          const hasRun = a.hours_ago != null;
          const color = !hasRun ? "#9aa5ad" : a.hours_ago > 30 ? "#b7791f" : "#2f855a";
          return (
            <div key={a.id} className="hub-status-item">
              <span className="hub-status-dot" style={{ background: color }} />
              <div>
                <div className="hub-status-name">{a.name}</div>
                <div className="hub-status-detail">
                  {a.hours_ago != null ? `${agoLabel(a.hours_ago)} · ` : ""}
                  {a.detail}
                </div>
                {a.memory && a.memory.passages > 0 && (
                  <div className="hub-status-mem">
                    🧠 learned {a.memory.sources} source{a.memory.sources === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {status.scheduler?.enabled && (
        <p className="hub-status-foot">Auto-runs daily: Brief 6:00 AM PT, Hiring 6:30 AM PT.</p>
      )}
    </div>
  );
}

const TOOLS = [
  {
    id: "evals",
    name: "Evals & Verification",
    description:
      "The trust layer: golden-set eval scores per agent, live hallucination-catch rate, the double-LLM verification pipeline, and a full audit trail. How we know the AI is right.",
    icon: "◇",
    role: "All",
    status: "live",
    path: "/evals",
  },
  {
    id: "lease-agent",
    name: "Lease Abstraction",
    description: "Extract key terms from commercial leases, flag risks, and export structured data.",
    icon: "📄",
    role: "Leasing",
    status: "live",
    path: "/lease-agent",
  },
  {
    id: "rent-roll",
    name: "Rent Roll Anomaly Detector",
    description: "Scan a rent roll for missed escalations, expired free rent, CAM gaps, and holdovers, with dollars at risk.",
    icon: "📈",
    role: "Finance",
    status: "live",
    path: "/rent-roll",
  },
  {
    id: "timesheet-agent",
    name: "Timesheet Reimbursements",
    description: "Turn the monthly timesheet export into an hours-by-job grid with anomaly checks.",
    icon: "⏱",
    role: "Operations",
    status: "live",
    path: "/timesheet-agent",
  },
  {
    id: "invoice-agent",
    name: "Invoice Agent",
    description: "Review consultant invoices against their contract, build the running billing sheet, and draft revision-request emails.",
    icon: "🧾",
    role: "Finance",
    status: "live",
    path: "/invoice-agent",
  },
  {
    id: "morning-brief",
    name: "Morning Intelligence Brief",
    description:
      "Daily synthesis of overnight SF real-estate developments: news, Power Station, competitor activity, regulatory updates, and interest rates, focused on Dogpatch and SoMa.",
    icon: "🗞",
    role: "All",
    status: "live",
    path: "/morning-brief",
  },
  {
    id: "competitive-hiring",
    name: "Competitive Hiring Intelligence",
    description:
      "Daily scan of SF / Bay Area commercial real-estate competitors' job postings: who's hiring, for what, at what seniority, and what it signals.",
    icon: "🎯",
    role: "All",
    status: "live",
    path: "/competitive-hiring",
  },
  {
    id: "admin",
    name: "Admin",
    description: "Tune agent settings, manage access, and review/forget what the agents have learned.",
    icon: "⚙️",
    role: "All",
    status: "live",
    path: "/admin",
    adminOnly: true,
  },
  {
    id: "sql-analyst",
    name: "SQL Analyst Agent",
    description: "Natural-language questions over the client's warehouse, with guardrails: schema-grounded SQL, read-only, every query logged and previewed before it runs.",
    icon: "🧮",
    role: "Finance",
    status: "coming-soon",
  },
  {
    id: "mcp-connectors",
    name: "MCP Connectors",
    description: "Safely expose enterprise systems (CRM, DMS, ticketing) to Claude over MCP with per-tool RBAC and human-in-the-loop approvals for high-risk actions.",
    icon: "🔌",
    role: "Operations",
    status: "coming-soon",
  },
  {
    id: "eval-studio",
    name: "Eval Studio",
    description: "Author golden datasets and task-specific rubrics, run them on every model/prompt change, and gate deploys on pass-rate thresholds in CI.",
    icon: "🧪",
    role: "All",
    status: "coming-soon",
  },
  {
    id: "monitoring",
    name: "Production Monitoring",
    description: "Live latency, cost, tool-failure, and hallucination dashboards per deployment, with alerting and sampled human review.",
    icon: "📟",
    role: "All",
    status: "coming-soon",
  },
];

const ROLES = ["All", "Leasing", "Operations", "Finance", "Legal"];

// The static demo ships three fully-interactive agents that tell the verification
// story end to end. The others render as roadmap cards so the platform still reads
// as broad without exposing screens that need the live backend.
const DEMO = import.meta.env.VITE_DEMO === "1";
const DEMO_LIVE = new Set(["evals", "lease-agent", "invoice-agent"]);

export default function Hub({ user, onLogout, onSelectTool }) {
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = TOOLS.filter(
    (t) =>
      (!t.adminOnly || user?.is_admin) &&
      // Admin isn't part of the public demo.
      (!DEMO || t.id !== "admin") &&
      // Hide access-restricted agents (e.g. Timesheet Reimbursements) from users
      // who aren't on that agent's allowlist. tool_access is false only when set.
      (user?.tool_access?.[t.id] !== false) &&
      (roleFilter === "All" || t.role === roleFilter || t.role === "All")
  );

  const isLive = (t) => t.status === "live" && (!DEMO || DEMO_LIVE.has(t.id));
  const liveTools = filtered.filter(isLive);
  const comingSoon = filtered.filter((t) => !isLive(t));

  return (
    <div className="hub-page">
      <Header user={user} onLogout={onLogout} />

      <main className="hub-main">
        <div className="hub-hero">
          <p className="login-eyebrow">GroundTruth · Applied AI Platform</p>
          <h1 className="hub-title">Verified AI for high-stakes work.</h1>
          <p className="hub-subtitle">
            A production deployment of Claude-powered agents into a real workflow, every number
            they produce checked against the source and an independent model before a human signs
            off. Open any agent, or start with Evals &amp; Verification to see how we prove it works.
          </p>
        </div>

        <SystemStatus />

        <div className="hub-filters">
          {ROLES.map((role) => (
            <button
              key={role}
              className={`hub-filter-btn ${roleFilter === role ? "active" : ""}`}
              onClick={() => setRoleFilter(role)}
            >
              {role}
            </button>
          ))}
        </div>

        {liveTools.length > 0 && (
          <div className="hub-section">
            <p className="hub-section-label">Available now</p>
            <div className={`hub-grid ${liveTools.length > 1 ? "hub-grid--multi" : ""}`}>
              {liveTools.map((liveTool) => (
                <div
                  key={liveTool.id}
                  className="tool-card tool-card--live"
                  onClick={() => onSelectTool(liveTool.id)}
                >
                  <div className="tool-card-icon">{liveTool.icon}</div>
                  <div className="tool-card-body">
                    <div className="tool-card-header">
                      <h2 className="tool-card-name">{liveTool.name}</h2>
                      <span className="tool-badge tool-badge--live">Live</span>
                    </div>
                    <p className="tool-card-desc">{liveTool.description}</p>
                    <span className="tool-card-role">{liveTool.role}</span>
                  </div>
                  <div className="tool-card-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="hub-section">
          <p className="hub-section-label">Coming soon</p>
          <div className="hub-grid hub-grid--multi">
            {comingSoon.map((tool) => (
              <div key={tool.id} className="tool-card tool-card--soon">
                <div className="tool-card-icon">{tool.icon}</div>
                <div className="tool-card-body">
                  <div className="tool-card-header">
                    <h2 className="tool-card-name">{tool.name}</h2>
                    <span className="tool-badge tool-badge--soon">Soon</span>
                  </div>
                  <p className="tool-card-desc">{tool.description}</p>
                  <span className="tool-card-role">{tool.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="fs-footer">
        <div className="fs-footer-inner">
          <span className="fs-footer-wordmark">GroundTruth</span>
          <span className="fs-footer-copy">San Francisco · Employee Platform</span>
        </div>
      </footer>
    </div>
  );
}
