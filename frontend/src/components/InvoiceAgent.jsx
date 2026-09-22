import { useState } from "react";
import Header from "./Header";
import ProjectsList from "./invoice/ProjectsList";
import ProjectPage from "./invoice/ProjectPage";
import "./invoice/invoice-agent.css";

export default function InvoiceAgent({ user, onLogout, onBack }) {
  const [projectId, setProjectId] = useState(null);

  return (
    <>
      <Header user={user} onLogout={onLogout} onBack={onBack} toolName="Invoice Agent" demo="/demos/invoice.mp4" />

      {projectId ? (
        <ProjectPage projectId={projectId} onBack={() => setProjectId(null)} />
      ) : (
        <ProjectsList onOpenProject={setProjectId} />
      )}

      <footer className="fs-footer">
        <div className="fs-footer-inner">
          <span className="fs-footer-wordmark">GroundTruth</span>
          <span className="fs-footer-copy">Invoice Agent · San Francisco</span>
        </div>
      </footer>
    </>
  );
}
