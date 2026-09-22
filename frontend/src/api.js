export const API_BASE = import.meta.env.VITE_API_URL || "";

// In the static demo build (VITE_DEMO=1, GitHub Pages) there is no backend, so
// every call resolves to a seeded fixture instead of hitting the network.
import * as demo from "./demo/demoData";
export const DEMO = import.meta.env.VITE_DEMO === "1";

const fetchOpts = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

function parseApiError(body, fallback) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg || String(d)).join("; ");
  return fallback;
}

export async function fetchMe() {
  if (DEMO) return demo.me();
  const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function logout() {
  if (DEMO) return;
  await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
}

export async function uploadLease(file) {
  if (DEMO) return demo.uploadLeaseDemo();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/leases/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Upload failed"));
  }
  return res.json();
}

export async function processLease(leaseId, file) {
  if (DEMO) return demo.processLeaseDemo();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/leases/${leaseId}/process`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Processing failed"));
  }
  return res.json();
}

export async function getLease(leaseId) {
  if (DEMO) return demo.getLeaseDemo();
  const res = await fetch(`${API_BASE}/api/leases/${leaseId}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to fetch lease"));
  }
  return res.json();
}

export function getExportUrl(leaseId, format) {
  return `${API_BASE}/api/leases/${leaseId}/export?format=${format}`;
}

// ---------------------------------------------------------------- Timesheet Agent

export async function processTimesheet(file, monthLabel) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("month_label", monthLabel || "");

  const res = await fetch(`${API_BASE}/api/timesheets/process`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Processing failed"));
  }
  return res.json();
}

export async function getTimesheetRuns() {
  const res = await fetch(`${API_BASE}/api/timesheets/runs`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to load history"));
  }
  return res.json();
}

export async function getTimesheetRun(runId) {
  const res = await fetch(`${API_BASE}/api/timesheets/runs/${runId}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to load run"));
  }
  return res.json();
}

export function getTimesheetDownloadUrl(runId) {
  return `${API_BASE}/api/timesheets/runs/${runId}/download`;
}

// ---------------------------------------------------------------- Rent Roll Anomaly Detector

export async function scanRentRoll(file, { asOf, buildingTotalSf } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (asOf) formData.append("as_of", asOf);
  if (buildingTotalSf) formData.append("building_total_sf", JSON.stringify(buildingTotalSf));

  const res = await fetch(`${API_BASE}/api/rent-roll/scan`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Scan failed"));
  }
  return res.json();
}
// Added to frontend/src/api.js (uses the existing API_BASE / fetchOpts / parseApiError
// already defined at the top of that file).

// ---------------------------------------------------------------- Morning Intelligence Brief
// Read-only from the UI: the brief is produced by the scheduled morning cron.

export async function getLatestBrief() {
  if (DEMO) return demo.latestBriefDemo();
  const res = await fetch(`${API_BASE}/api/brief/latest`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to load brief"));
  }
  return res.json();
}

export async function getBriefRuns() {
  if (DEMO) return [];
  const res = await fetch(`${API_BASE}/api/brief/runs`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to load history"));
  }
  return res.json();
}

export async function getBriefRun(runId) {
  const res = await fetch(`${API_BASE}/api/brief/runs/${runId}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to load brief"));
  }
  return res.json();
}

// ---------------------------------------------------------------- Competitive Hiring
// Read-only from the UI: scans are produced by the scheduled daily cron.

export async function getLatestHiring() {
  if (DEMO) return demo.latestHiringDemo();
  const res = await fetch(`${API_BASE}/api/hiring/latest`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to load hiring dashboard"));
  }
  return res.json();
}

export async function getHiringRuns() {
  const res = await fetch(`${API_BASE}/api/hiring/runs`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to load history"));
  }
  return res.json();
}

// Manual run triggers (logged-in users) for the cron-produced agents.
export async function runBrief() {
  if (DEMO) return demo.latestBriefDemo();
  const res = await fetch(`${API_BASE}/api/brief/run`, { method: "POST", credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to run brief"));
  }
  return res.json();
}

export async function runHiring() {
  if (DEMO) return demo.latestHiringDemo();
  const res = await fetch(`${API_BASE}/api/hiring/run`, { method: "POST", credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to run scan"));
  }
  return res.json();
}

// System status: per-agent last-run health for the hub status panel.
export async function getSystemStatus() {
  if (DEMO) return demo.statusDemo();
  const res = await fetch(`${API_BASE}/api/status`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load status");
  return res.json();
}

// Feedback on any agent output (the self-correction loop).
export async function submitFeedback(agent, target_type, target_ref, verdict, note) {
  if (DEMO) return { ok: true };
  const res = await fetch(`${API_BASE}/api/feedback`, {
    ...fetchOpts,
    method: "POST",
    body: JSON.stringify({ agent, target_type, target_ref, verdict, note: note || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to send feedback"));
  }
  return res.json();
}

// --- Admin + memory ---
export async function getAdminSettings() {
  if (DEMO) return { settings: {} };
  const res = await fetch(`${API_BASE}/api/admin/settings`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}
export async function putAdminSetting(key, value) {
  const res = await fetch(`${API_BASE}/api/admin/settings`, {
    ...fetchOpts, method: "PUT", body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Failed to save"));
  }
  return res.json();
}
export async function getAdminUsers() {
  if (DEMO) return [demo.DEMO_USER];
  const res = await fetch(`${API_BASE}/api/admin/users`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}
export async function getAuditEvents(limit = 200) {
  if (DEMO) return { events: [] };
  const res = await fetch(`${API_BASE}/api/admin/audit?limit=${limit}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load security activity");
  return res.json();
}
export async function setUserAdmin(userId, isAdmin) {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/admin`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ is_admin: isAdmin }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.detail || "Failed to update admin access");
  }
  return res.json();
}
export async function getMemory() {
  if (DEMO) return { items: [] };
  const res = await fetch(`${API_BASE}/api/memory`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load memory");
  return res.json();
}
export async function forgetMemory(agent, label, ref) {
  const qs = new URLSearchParams({ agent, label, ...(ref ? { ref } : {}) });
  const res = await fetch(`${API_BASE}/api/memory?${qs}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Failed to forget");
  return res.json();
}

// Evals & verification summary (FDE centerpiece).
export async function getEvalsSummary() {
  if (DEMO) return demo.evalsDemo();
  const res = await fetch(`${API_BASE}/api/evals/summary`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load evals");
  return res.json();
}
