import { useState, useEffect } from "react";
import { API_BASE } from "../api";
import Header from "./Header";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function CreateProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          property_address: address.trim() || null,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to create project (${res.status})`);
      }
      const project = await res.json();
      onCreate(project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "var(--fs-space-2)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--fs-white)",
          width: "100%",
          maxWidth: "460px",
          border: "1px solid var(--fs-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--fs-space-1) var(--fs-space-2)",
            borderBottom: "1px solid var(--fs-border)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--fs-blue)" }}>
            New Project
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "var(--fs-text-muted)",
              padding: "4px 8px",
              fontFamily: "inherit",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "var(--fs-space-2)", display: "flex", flexDirection: "column", gap: "var(--fs-space-2)" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fs-text-muted)", marginBottom: "6px" }}>
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 123 Market St Lease"
              required
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--fs-border)",
                fontSize: "14px",
                fontFamily: "inherit",
                color: "var(--fs-blue)",
                boxSizing: "border-box",
                borderRadius: 0,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fs-text-muted)", marginBottom: "6px" }}>
              Property Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Market St, San Francisco, CA"
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--fs-border)",
                fontSize: "14px",
                fontFamily: "inherit",
                color: "var(--fs-blue)",
                boxSizing: "border-box",
                borderRadius: 0,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fs-text-muted)", marginBottom: "6px" }}>
              Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this project"
              rows={3}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--fs-border)",
                fontSize: "14px",
                fontFamily: "inherit",
                color: "var(--fs-blue)",
                resize: "vertical",
                boxSizing: "border-box",
                borderRadius: 0,
              }}
            />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "8px 10px", fontSize: "13px", borderRadius: "2px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--fs-space-1)", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || loading}>
              {loading ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsView({ user, onLogout, onBack, onSelectProject, onQuickExtract }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/projects`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load projects (${r.status})`);
        return r.json();
      })
      .then((data) => setProjects(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = (project) => {
    setShowCreate(false);
    setProjects((prev) => [project, ...prev]);
    onSelectProject(project);
  };

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project and all its documents?")) return;
    try {
      await fetch(`${API_BASE}/api/projects/${projectId}`, { method: "DELETE", credentials: "include" });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch {
      alert("Failed to delete project.");
    }
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} onBack={onBack} demo="/demos/lease.mp4" demoTitle="Lease Abstraction" />

      <main className="fs-main">
        <section className="fs-section bg-gray" style={{ padding: "var(--fs-space-3) var(--fs-space-3) var(--fs-space-2)" }}>
          <div style={{ maxWidth: "900px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--fs-space-2)", flexWrap: "wrap", marginBottom: "var(--fs-space-2)" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fs-text-muted)", marginBottom: "6px" }}>
                  Lease Abstraction
                </div>
                <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "var(--fs-blue)", letterSpacing: "-0.02em" }}>
                  Projects
                </h1>
              </div>
              <div style={{ display: "flex", gap: "var(--fs-space-1)", flexWrap: "wrap" }}>
                <button className="btn btn-secondary" onClick={onQuickExtract}>
                  Quick Extract ↗
                </button>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  + New Project
                </button>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "14px", color: "var(--fs-text-muted)", lineHeight: 1.5 }}>
              Organize lease documents by property. Upload multiple versions to track amendments and changes over time.
            </p>
          </div>
        </section>

        <section className="fs-section" style={{ padding: "var(--fs-space-3)" }}>
          <div style={{ maxWidth: "900px" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "var(--fs-space-3)", color: "var(--fs-text-muted)", fontSize: "14px" }}>
                <div className="spinner" />
                Loading projects…
              </div>
            ) : error ? (
              <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "12px 16px", fontSize: "14px", borderRadius: "2px" }}>
                {error}
              </div>
            ) : projects.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "var(--fs-space-5)",
                  background: "var(--fs-gray)",
                  border: "1px solid var(--fs-border)",
                }}
              >
                <div style={{ fontSize: "40px", opacity: 0.2, marginBottom: "16px" }}>🗂</div>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "16px", color: "var(--fs-blue)" }}>
                  No projects yet
                </p>
                <p style={{ margin: "0 0 var(--fs-space-2)", fontSize: "14px", color: "var(--fs-text-muted)" }}>
                  Create a project to start organizing lease documents.
                </p>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  Create your first project
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--fs-space-1)" }}>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--fs-space-2)",
                      padding: "var(--fs-space-2)",
                      background: "var(--fs-white)",
                      border: "1px solid var(--fs-border)",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--fs-neon)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--fs-border)")}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "var(--fs-blue)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      🗂
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "var(--fs-blue)", fontSize: "15px", marginBottom: "3px" }}>
                        {project.name}
                      </div>
                      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--fs-text-muted)", flexWrap: "wrap" }}>
                        {project.property_address && <span>📍 {project.property_address}</span>}
                        <span>{(project.documents || []).length} document{(project.documents || []).length !== 1 ? "s" : ""}</span>
                        <span>Created {formatDate(project.created_at)}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span style={{ fontSize: "12px", color: "var(--fs-text-muted)" }}>
                        Open →
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        title="Delete project"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "var(--fs-text-muted)",
                          padding: "4px 6px",
                          borderRadius: "2px",
                          opacity: 0.5,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#dc2626"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.color = "var(--fs-text-muted)"; }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </>
  );
}
