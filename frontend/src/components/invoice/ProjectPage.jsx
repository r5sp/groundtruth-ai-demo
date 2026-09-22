import { useCallback, useEffect, useState } from "react";
import {
  deleteInvoice,
  getBillingSheetUrl,
  getBillingSummary,
  getProject,
  uploadContract,
  uploadInspectionReport,
  uploadInvoice,
} from "./api";
import SectionHeading from "../SectionHeading";
import UploadDropzone from "./UploadDropzone";
import BillingSummaryTable from "./BillingSummaryTable";
import InvoiceCard from "./InvoiceCard";
import ChatPanel from "./ChatPanel";

export default function ProjectPage({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    // Clear first: a refresh that succeeds after a failed one has to recover the page.
    // Previously the error latched forever, so one blip left the project unusable even
    // once the API was healthy again.
    setError("");
    try {
      const [p, s] = await Promise.all([getProject(projectId), getBillingSummary(projectId)]);
      setProject(p);
      setSummary(s);
    } catch (err) {
      setError(err.message);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id) => {
    setNotice("");
    try {
      await deleteInvoice(projectId, id);
    } catch (err) {
      // The card may be stale: if an earlier refresh failed, the list on screen can
      // still show an invoice the server no longer has. Resync and say what happened
      // rather than letting a raw 404 escape the click handler unhandled.
      await refresh();
      setNotice(
        err.status === 404
          ? "This invoice was already removed. The project has been refreshed."
          : `Couldn't delete that invoice: ${err.message}`
      );
      return;
    }
    await refresh();
  };

  // Only take over the whole page when there is nothing to show. Once the project has
  // loaded, a failed refresh reports inline instead: batch uploads refresh after every
  // file, so a single transient failure used to replace the invoice list and the
  // dropzone - mid-batch - with a bare error string and no way back.
  if (error && !project) {
    return (
      <main className="fs-main">
        <div className="fs-section">
          <div className="status-bar error">{error}</div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="fs-main">
        <div className="fs-section" style={{ display: "flex", justifyContent: "center" }}>
          <div className="spinner" />
        </div>
      </main>
    );
  }

  const contract = project.contracts[project.contracts.length - 1];
  const invoices = [...project.invoices].sort((a, b) =>
    (a.period_start || a.uploaded_at).localeCompare(b.period_start || b.uploaded_at)
  );
  // Changes whenever an invoice is added or removed, so the download link points at a
  // fresh URL rather than whatever the browser cached before the last upload.
  const sheetVersion = `${invoices.length}-${invoices.map((i) => i.id).join(".")}`;

  return (
    <div className="app-shell">
      <div className="app-main">
        <main>
          <div className="breadcrumb">
            <button type="button" onClick={onBack}>
              ← Projects
            </button>
            <span>/</span>
            <span>{project.name}</span>
          </div>

          {/* A refresh failed but the project is still on screen. Say so without tearing
              the page down - the figures below are simply from before the failure. */}
          {error && (
            <div className="status-bar error" style={{ marginBottom: "var(--fs-space-2)" }}>
              Couldn't refresh this project: {error} The figures below may be out of date.
            </div>
          )}

          {notice && (
            <div className="status-bar" style={{ marginBottom: "var(--fs-space-2)" }}>{notice}</div>
          )}

          <section className="fs-section-inner" style={{ marginBottom: "var(--fs-space-4)" }}>
            <h1 style={{ fontFamily: "Origin, Arbeit, sans-serif", fontSize: "2rem", marginBottom: 4 }}>
              {project.name}
            </h1>
            {project.consultant_name && (
              <p style={{ color: "var(--fs-light-blue)" }}>{project.consultant_name}</p>
            )}
          </section>

          <section className="fs-section-inner" style={{ marginBottom: "var(--fs-space-4)" }}>
            <SectionHeading label="Contract" number={1} />
            {contract ? (
              <div className="card">
                <div className="card-title">{contract.file_name}</div>
                <p>
                  {contract.label && <strong>{contract.label}: </strong>}
                  {contract.tasks.length} tasks
                  {contract.not_to_exceed_total != null &&
                    ` · Not-to-exceed $${contract.not_to_exceed_total.toLocaleString()}`}
                </p>
                <div style={{ marginTop: "var(--fs-space-2)" }}>
                  <UploadDropzone
                    compact
                    label="Replace with an updated contract/addendum"
                    sublabel="Drop the latest PDF or DOCX to update the fee schedule"
                    onUpload={async (file) => {
                      await uploadContract(projectId, file);
                      await refresh();
                    }}
                  />
                </div>
              </div>
            ) : (
              <UploadDropzone
                label="Drop the contract here (optional)"
                sublabel="PDF or DOCX. The consultant's agreement or Exhibit B fee schedule. Optional: invoices analyze on their own; add the contract for full rate and cost-code cross-checks."
                onUpload={async (file) => {
                  await uploadContract(projectId, file);
                  await refresh();
                }}
              />
            )}
          </section>

          <section className="fs-section-inner" style={{ marginBottom: "var(--fs-space-4)" }}>
            <div className="section-toolbar">
              <SectionHeading label="Billing sheet" number={2} />
              {summary?.rows?.length > 0 && (
                <a
                  className="btn btn-secondary btn-sm"
                  href={getBillingSheetUrl(projectId, sheetVersion)}
                  download
                >
                  Download Excel
                </a>
              )}
            </div>
            {invoices.length > 0 && (
              <p style={{ color: "var(--fs-light-blue)", marginBottom: "var(--fs-space-2)" }}>
                Rebuilt from all {invoices.length} invoice{invoices.length === 1 ? "" : "s"} on this project.
                Billed to date carries into prior billed as each new invoice is added; download again for the
                current version.
              </p>
            )}
            <BillingSummaryTable summary={summary} />
          </section>

          <section className="fs-section-inner" style={{ marginBottom: "var(--fs-space-4)" }}>
            <SectionHeading label="Invoices" number={3} />
            {!contract && (
              <p style={{ color: "var(--fs-light-blue)", marginBottom: "var(--fs-space-2)" }}>
                Drop invoices here. They're analyzed on their own (% billed, 75% and at-limit flags, math checks).
                Add the contract above for full cross-checks against the fee schedule.
              </p>
            )}
            <div style={{ marginBottom: "var(--fs-space-2)" }}>
              {/* The dropzone is the "add another" control and it never goes away - but once an
                  invoice is on screen the only button next to it is Delete, so a generic "drop
                  invoices here" heading above it read as the empty-state prompt rather than a
                  live action. Naming the state makes continuing the obvious move. */}
              <UploadDropzone
                compact
                multiple
                label={invoices.length > 0 ? "Add another invoice" : "Drop monthly invoices here"}
                sublabel={
                  invoices.length > 0
                    ? `PDF or DOCX. Adds to the ${invoices.length} already on this project - drop one or several. Nothing you've uploaded is replaced or removed.`
                    : "PDF or DOCX. Add as many as you like, in any order - each one is added to the billing sheet, never replacing what's already there"
                }
                onUpload={async (file) => {
                  await uploadInvoice(projectId, file);
                  // Refresh per file rather than once at the end, so the billing sheet
                  // above visibly rolls forward as each invoice lands.
                  await refresh();
                }}
              />
            </div>
            {invoices.length === 0 ? (
              <div className="empty-state">
                <p>No invoices uploaded yet.</p>
              </div>
            ) : (
              invoices
                .slice()
                .reverse()
                .map((inv) => (
                  <InvoiceCard
                    key={inv.id}
                    invoice={inv}
                    hasContract={!!contract}
                    onDelete={handleDelete}
                  />
                ))
            )}
          </section>

          <section className="fs-section-inner" style={{ marginBottom: "var(--fs-space-4)" }}>
            <SectionHeading label="Inspection / field reports" number={4} />
            <p style={{ color: "var(--fs-light-blue)", marginBottom: "var(--fs-space-2)" }}>
              Optional: upload daily or monthly field reports so invoiced inspection dates can be cross-checked
              against them.
            </p>
            <UploadDropzone
              compact
              label="Drop a field/inspection report here"
              sublabel="PDF or DOCX"
              onUpload={async (file) => {
                await uploadInspectionReport(projectId, file);
                await refresh();
              }}
            />
            {project.inspection_reports?.length > 0 && (
              <ul style={{ marginTop: "var(--fs-space-2)", fontSize: "0.875rem" }}>
                {project.inspection_reports.map((r) => (
                  <li key={r.id}>{r.file_name}</li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
      <ChatPanel projectId={projectId} />
    </div>
  );
}
