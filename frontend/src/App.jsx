import { useState, useEffect, lazy } from "react";
import Header from "./components/Header";
import Hub from "./components/Hub";
import LoginPage from "./components/LoginPage";
import SectionHeading from "./components/SectionHeading";
import UploadPanel from "./components/UploadPanel";
import TermsTable from "./components/TermsTable";
import TermDetail from "./components/TermDetail";
import { useAuth } from "./context/AuthContext";
import { uploadLease, processLease, getExportUrl, getLease, DEMO } from "./api";

// Each agent screen is a separate lazy chunk, so the initial load only ships the
// hub/login shell; the agent code downloads when you open that agent.
const ProjectsView = lazy(() => import("./components/ProjectsView"));
const ProjectDetail = lazy(() => import("./components/ProjectDetail"));
const RentRollTool = lazy(() => import("./components/RentRollTool"));
const TimesheetAgent = lazy(() => import("./components/TimesheetAgent"));
const InvoiceAgent = lazy(() => import("./components/InvoiceAgent"));
const MorningBrief = lazy(() => import("./components/MorningBrief"));
const CompetitiveHiring = lazy(() => import("./components/CompetitiveHiring"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const EvalsDashboard = lazy(() => import("./components/EvalsDashboard"));
const VoiceQualifier = lazy(() => import("./components/VoiceQualifier"));

export default function App() {
  const { user, loading, logout } = useAuth();
  const [activeTool, setActiveTool] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Lease agent standalone (Quick Extract) state
  const [quickExtract, setQuickExtract] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [lease, setLease] = useState(null);
  const [status, setStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [reviewFilter, setReviewFilter] = useState(false);

  // In the static demo there is no project workspace to browse, so opening Lease
  // Abstraction jumps straight to a pre-loaded, already-verified sample lease.
  useEffect(() => {
    if (DEMO && activeTool === "lease-agent" && !lease) {
      setQuickExtract(true);
      setStatus("success");
      setStatusMessage("Sample lease loaded. Extracted terms shown below with verification.");
      getLease().then(setLease).catch(() => {});
    }
  }, [activeTool, lease]);

  const handleProcess = async () => {
    if (!selectedFile) return;
    setStatus("processing");
    setStatusMessage("Uploading and extracting lease terms...");
    setLease(null);
    setSelectedTerm(null);
    try {
      const uploadResult = await uploadLease(selectedFile);
      setStatusMessage("Running extraction…");
      const result = await processLease(uploadResult.id, selectedFile);
      setLease(result);
      setStatus("success");
      setStatusMessage(
        `Extraction complete: ${result.terms.length} fields extracted, ` +
          `${result.terms.filter((t) => t.needs_legal_review).length} flagged for legal review.`
      );
    } catch (err) {
      setStatus("error");
      setStatusMessage(err.message || "An unexpected error occurred.");
    }
  };

  const handleBackFromLeaseAgent = () => {
    setActiveTool(null);
    setSelectedProject(null);
    setQuickExtract(false);
    setSelectedFile(null);
    setLease(null);
    setStatus(null);
    setStatusMessage("");
    setSelectedTerm(null);
    setReviewFilter(false);
  };

  const handleBackFromProject = () => {
    setSelectedProject(null);
  };

  if (loading) {
    return (
      <div className="login-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  // Hub directory
  if (!activeTool) {
    return (
      <Hub
        user={user}
        onLogout={logout}
        onSelectTool={(toolId) => setActiveTool(toolId)}
      />
    );
  }

  // Rent Roll Anomaly Detector tool
  if (activeTool === "rent-roll") {
    return (
      <RentRollTool
        user={user}
        onLogout={logout}
        onBack={() => setActiveTool(null)}
      />
    );
  }

  // Timesheet Agent
  if (activeTool === "timesheet-agent" && user?.tool_access?.["timesheet-agent"] !== false) {
    return (
      <TimesheetAgent
        user={user}
        onLogout={logout}
        onBack={() => setActiveTool(null)}
      />
    );
  }

  // Invoice Agent
  if (activeTool === "invoice-agent") {
    return (
      <InvoiceAgent
        user={user}
        onLogout={logout}
        onBack={() => setActiveTool(null)}
      />
    );
  }

  // Morning Intelligence Brief
  if (activeTool === "morning-brief") {
    return (
      <MorningBrief
        user={user}
        onLogout={logout}
        onBack={() => setActiveTool(null)}
      />
    );
  }

  // Competitive Hiring Intelligence
  if (activeTool === "competitive-hiring") {
    return (
      <CompetitiveHiring
        user={user}
        onLogout={logout}
        onBack={() => setActiveTool(null)}
      />
    );
  }

  // Voice Lead Qualifier (Web Speech demo)
  if (activeTool === "voice-qualifier") {
    return <VoiceQualifier user={user} onLogout={logout} onBack={() => setActiveTool(null)} />;
  }

  // Evals & Verification (the trust layer)
  if (activeTool === "evals") {
    return <EvalsDashboard user={user} onLogout={logout} onBack={() => setActiveTool(null)} />;
  }

  // Admin
  // Admin page is admin-only. The tile is already hidden for non-admins and the
  // backend 403s every /api/admin route; this guard makes sure the page never
  // even renders for a non-admin (defense in depth). Non-admins fall through to
  // the hub.
  if (activeTool === "admin" && user?.is_admin) {
    return <AdminPanel user={user} onLogout={logout} onBack={() => setActiveTool(null)} />;
  }

  // Lease Abstraction tool: project navigation
  if (activeTool === "lease-agent" && !quickExtract) {
    // ProjectDetail view
    if (selectedProject) {
      return (
        <ProjectDetail
          user={user}
          onLogout={logout}
          project={selectedProject}
          onBack={handleBackFromProject}
          onQuickExtract={() => setQuickExtract(true)}
        />
      );
    }

    // ProjectsView list
    return (
      <ProjectsView
        user={user}
        onLogout={logout}
        onBack={handleBackFromLeaseAgent}
        onSelectProject={(project) => setSelectedProject(project)}
        onQuickExtract={() => setQuickExtract(true)}
      />
    );
  }

  // Quick Extract: standalone lease agent (no project)
  if (activeTool === "lease-agent" && quickExtract) {
    const filteredTerms = lease?.terms
      ? reviewFilter
        ? lease.terms.filter((t) => t.needs_legal_review)
        : lease.terms
      : [];
    const reviewCount = lease?.terms?.filter((t) => t.needs_legal_review).length || 0;

    return (
      <>
        <Header user={user} onLogout={logout} onBack={handleBackFromLeaseAgent} demo="/demos/lease.mp4" demoTitle="Lease Abstraction" />

        <main className="fs-main">
          <section className="fs-section fs-hero">
            <SectionHeading label="About this tool" number={1} />
            <h1>Space for clarity in every lease.</h1>
            <p className="fs-hero-lead">
              Upload a commercial lease to extract key terms, flag risks for legal review,
              and export structured results, built for teams who create spaces with purpose.
            </p>
          </section>

          <section className="fs-section bg-gray">
            <div className="fs-section-inner">
              <SectionHeading label="Upload document" number={2} />
              <UploadPanel
                onFileSelected={setSelectedFile}
                selectedFile={selectedFile}
                disabled={status === "processing"}
              />
              <div className="btn-group">
                <button
                  className="btn btn-primary"
                  onClick={handleProcess}
                  disabled={!selectedFile || status === "processing"}
                >
                  {status === "processing" ? "Processing…" : "Extract lease terms"}
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

          {lease && lease.terms.length > 0 && (
            <section className="fs-section">
              <div className="fs-section-inner">
                <SectionHeading label="Extracted terms" number={3} />
                <div className="results-header">
                  <div>
                    <h2 className="results-title">Structured output</h2>
                    <p className="results-file">{lease.file_name}</p>
                  </div>
                  <div className="btn-group" style={{ marginTop: 0 }}>
                    <a className="btn btn-secondary" href={getExportUrl(lease.id, "csv")} download>
                      Export CSV
                    </a>
                    <a className="btn btn-secondary" href={getExportUrl(lease.id, "json")} download>
                      Export JSON
                    </a>
                  </div>
                </div>
                <div className="filters">
                  <label className="filter-toggle">
                    <input
                      type="checkbox"
                      checked={reviewFilter}
                      onChange={(e) => setReviewFilter(e.target.checked)}
                    />
                    Needs legal review only
                  </label>
                  {reviewCount > 0 && (
                    <span className="review-count">{reviewCount} flagged</span>
                  )}
                </div>
                <div className="terms-table-wrap">
                  <TermsTable terms={filteredTerms} onSelectTerm={setSelectedTerm} />
                </div>
              </div>
            </section>
          )}
        </main>

        <footer className="fs-footer">
          <div className="fs-footer-inner">
            <span className="fs-footer-wordmark">GroundTruth</span>
            <span className="fs-footer-copy">Lease abstraction · San Francisco</span>
          </div>
        </footer>

        {selectedTerm && (
          <TermDetail term={selectedTerm} onClose={() => setSelectedTerm(null)} />
        )}
      </>
    );
  }

  return null;
}
