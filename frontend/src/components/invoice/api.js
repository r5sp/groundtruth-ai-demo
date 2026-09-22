// Invoice Agent module API: all endpoints namespaced under /api/invoice so they
// never collide with the hub's own /api/projects (lease) routes. Auth is handled by
// the hub (Google OAuth); these calls just ride the shared session cookie.

const API_BASE = import.meta.env.VITE_API_URL || "";

import * as demo from "../../demo/demoData";
const DEMO = import.meta.env.VITE_DEMO === "1";

const jsonOpts = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

function parseApiError(body, fallback) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg || String(d)).join("; ");
  return fallback;
}

async function handleJson(res, fallback) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(parseApiError(body, fallback));
    // Callers that need to tell "gone" from "broken" apart read this - a card can
    // outlive the invoice it describes when an earlier refresh failed.
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// --- projects ---
export async function listProjects() {
  if (DEMO) return demo.listProjectsDemo();
  const res = await fetch(`${API_BASE}/api/invoice/projects`, { credentials: "include" });
  return handleJson(res, "Failed to load projects");
}

export async function createProject(name, consultant_name) {
  if (DEMO) return demo.getProjectDemo();
  const res = await fetch(`${API_BASE}/api/invoice/projects`, {
    ...jsonOpts,
    method: "POST",
    body: JSON.stringify({ name, consultant_name }),
  });
  return handleJson(res, "Failed to create project");
}

export async function getProject(projectId) {
  if (DEMO) return demo.getProjectDemo();
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}`, { credentials: "include" });
  return handleJson(res, "Failed to load project");
}

export async function deleteProject(projectId) {
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleJson(res, "Failed to delete project");
}

// --- contracts ---
export async function uploadContract(projectId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}/contracts`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleJson(res, "Failed to parse contract");
}

// --- invoices ---
export async function uploadInvoice(projectId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}/invoices`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleJson(res, "Failed to parse invoice");
}

export async function deleteInvoice(projectId, invoiceId) {
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}/invoices/${invoiceId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleJson(res, "Failed to delete invoice");
}

// --- inspection reports ---
export async function uploadInspectionReport(projectId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}/inspection-reports`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleJson(res, "Failed to parse inspection report");
}

// --- billing ---
export async function getBillingSummary(projectId) {
  if (DEMO) return { rows: [], generated_at: new Date().toISOString() };
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}/billing-summary`, {
    credentials: "include",
  });
  return handleJson(res, "Failed to load billing summary");
}

// `version` should change whenever the invoice set does. The workbook is rebuilt
// server-side on every request, but the URL is otherwise identical each time, so
// without it a browser can hand back the copy it downloaded before the latest
// invoice was added.
export function getBillingSheetUrl(projectId, version) {
  const url = `${API_BASE}/api/invoice/projects/${projectId}/billing-sheet.xlsx`;
  return version ? `${url}?v=${encodeURIComponent(version)}` : url;
}

export async function getEmailDraft(projectId, invoiceId) {
  const res = await fetch(
    `${API_BASE}/api/invoice/projects/${projectId}/invoices/${invoiceId}/email-draft`,
    { credentials: "include" }
  );
  return handleJson(res, "Failed to draft email");
}

// --- chat ---
export async function getChatHistory(projectId) {
  if (DEMO) return [];
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}/chat`, {
    credentials: "include",
  });
  return handleJson(res, "Failed to load chat history");
}

export async function sendChatMessage(projectId, message) {
  if (DEMO) return { role: "assistant", content: "This is a static demo. In the live deployment I answer from the project's contracts, invoices, and prior reviews, and every figure I cite is checked against the source." };
  const res = await fetch(`${API_BASE}/api/invoice/projects/${projectId}/chat`, {
    ...jsonOpts,
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return handleJson(res, "Failed to send message");
}
