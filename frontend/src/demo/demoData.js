// Seeded demo data for the static (no-backend) build.
//
// When the app is built with VITE_DEMO=1 (the GitHub Pages demo), every API
// function short-circuits to one of these fixtures instead of calling a server.
// The numbers are chosen to TELL THE VERIFICATION STORY: some values are clean,
// some are caught as ungrounded/miscopied, so the double-LLM layer visibly earns
// its place. The client is a fictional fund, "Atlas Capital," so the deployment
// reads as an applied-AI engagement rather than any real company.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const DEMO_USER = {
  id: 1,
  email: "demo@atlascapital.com",
  name: "Guest (Atlas Capital)",
  is_admin: true,
  tool_access: {},
};

// ----------------------------------------------------------------- Lease agent

const LEASE_TERMS = [
  {
    id: 1, field_name: "Tenant Name", value: "Beacon Robotics, Inc.",
    source_excerpt: "this Lease is entered into by and between Atlas Capital Tower LLC (\"Landlord\") and Beacon Robotics, Inc. (\"Tenant\")",
    confidence: "High", page_number: 1, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 98,
  },
  {
    id: 2, field_name: "Landlord Name", value: "Atlas Capital Tower LLC",
    source_excerpt: "Atlas Capital Tower LLC (\"Landlord\")",
    confidence: "High", page_number: 1, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 99,
  },
  {
    id: 3, field_name: "Premises", value: "Suite 1200, 55 Mission Street, San Francisco, CA",
    source_excerpt: "the premises known as Suite 1200, 55 Mission Street, San Francisco, California",
    confidence: "High", page_number: 1, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 97,
  },
  {
    id: 4, field_name: "Base Rent", value: "$62,500.00 per month",
    source_excerpt: "Tenant shall pay Base Rent of Sixty-Two Thousand Five Hundred Dollars ($62,500.00) per month",
    confidence: "High", page_number: 3, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 96,
  },
  {
    id: 5, field_name: "Security Deposit", value: "$187,500.00",
    source_excerpt: "a Security Deposit equal to three (3) months of Base Rent",
    confidence: "Medium", page_number: 4, needs_legal_review: true,
    review_reason: "Verification: value needs a human check (the figure $187,500.00 is computed from '3 months of Base Rent' and is not stated verbatim in the lease).",
    verification_status: "review", verification_confidence: 68,
  },
  {
    id: 6, field_name: "Lease Commencement", value: "March 1, 2025",
    source_excerpt: "the Term shall commence on March 1, 2025 (\"Commencement Date\")",
    confidence: "High", page_number: 2, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 98,
  },
  {
    id: 7, field_name: "Lease Expiration", value: "February 28, 2032",
    source_excerpt: "and shall expire on February 28, 2032 unless earlier terminated",
    confidence: "High", page_number: 2, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 97,
  },
  {
    id: 8, field_name: "Rent Escalation", value: "3.0% annually",
    source_excerpt: "Base Rent shall increase by three percent (3%) on each anniversary of the Commencement Date",
    confidence: "High", page_number: 3, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 95,
  },
  {
    id: 9, field_name: "TI Allowance", value: "$1,250,000.00",
    source_excerpt: "Landlord shall provide a Tenant Improvement Allowance of up to $95.00 per rentable square foot",
    confidence: "Low", page_number: 6, needs_legal_review: true,
    review_reason: "Verification FAILED: value not grounded in the document (the figure $1,250,000.00 does not appear in the lease; the source states a per-square-foot allowance the model multiplied out incorrectly). Verify against the source PDF.",
    verification_status: "rejected", verification_confidence: 8,
  },
  {
    id: 10, field_name: "Renewal Options", value: "Two 5-year options",
    source_excerpt: "Tenant shall have two (2) options to renew, each for a period of five (5) years",
    confidence: "High", page_number: 8, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 94,
  },
  {
    id: 11, field_name: "Termination Rights", value: "Landlord may terminate on 30 days notice without cause",
    source_excerpt: "Landlord reserves the right to terminate this Lease at any time upon thirty (30) days written notice",
    confidence: "Medium", page_number: 11, needs_legal_review: true,
    review_reason: "Unusual/high-risk clause: a without-cause landlord termination right on only 30 days notice is atypical and materially unfavorable to the tenant.",
    verification_status: "verified", verification_confidence: 91,
  },
  {
    id: 12, field_name: "Governing Law", value: "State of California",
    source_excerpt: "This Lease shall be governed by the laws of the State of California",
    confidence: "High", page_number: 14, needs_legal_review: false, review_reason: null,
    verification_status: "verified", verification_confidence: 99,
  },
];

const LEASE = {
  id: 101,
  file_name: "Beacon_Robotics_Lease_55Mission_Ste1200.pdf",
  file_type: "pdf",
  status: "completed",
  uploaded_at: "2026-09-20T18:04:00Z",
  terms: LEASE_TERMS,
};

// ----------------------------------------------------------------- Invoice agent

const INVOICE_LINES = [
  { id: 1, description: "Structural review — Task 1", raw_task_number: "1", work_date: "2026-08-06",
    person_name: "J. Alvarez", quantity: 18, unit_type: "hour", unit_rate: 245, amount: 4410,
    previously_billed: 12000, billed_this_period: 4410, total_billed_to_date: 16410,
    contract_amount: 40000, contract_task_id: 1, correlation_confidence: "auto" },
  { id: 2, description: "Site inspection — Task 2", raw_task_number: "2", work_date: "2026-08-12",
    person_name: "M. Chen", quantity: 12, unit_type: "hour", unit_rate: 210, amount: 2520,
    previously_billed: 8000, billed_this_period: 2520, total_billed_to_date: 10520,
    contract_amount: 25000, contract_task_id: 2, correlation_confidence: "auto" },
  { id: 3, description: "Reporting & documentation — Task 3", raw_task_number: "3", work_date: "2026-08-20",
    person_name: "M. Chen", quantity: 9, unit_type: "hour", unit_rate: 210, amount: 1890,
    previously_billed: 21000, billed_this_period: 1890, total_billed_to_date: 22890,
    contract_amount: 24000, contract_task_id: 3, correlation_confidence: "auto" },
  { id: 4, description: "Reimbursable — reprographics", raw_task_number: null, work_date: "2026-08-22",
    person_name: null, quantity: null, unit_type: null, unit_rate: null, amount: 78500,
    previously_billed: 0, billed_this_period: 78500, total_billed_to_date: 78500,
    contract_amount: null, contract_task_id: null, correlation_confidence: "unmatched", category: "reimbursable" },
];

const INVOICE_FLAGS = [
  { id: 1, line_item_id: 4, rule_code: "VERIFICATION", severity: "critical",
    message: "Reimbursable — reprographics (amount): the figure 78500 does not appear in the invoice's own text. The AI may have misread or invented it — verify against the source PDF before paying. (The invoice PDF shows $785.00; a decimal was dropped in extraction.)" },
  { id: 2, line_item_id: 3, rule_code: "THRESHOLD_WARNING", severity: "warning",
    message: "Task 3 is 95.4% billed ($22,890.00 of $24,000.00), approaching the task limit." },
  { id: 3, line_item_id: null, rule_code: "MATH_ERROR", severity: "warning",
    message: "Stated invoice total ($87,320.00) does not equal the sum of line items ($9,600.00 labor + $785.00 reimbursable = $10,385.00). Recommend reconciling before approval." },
];

const INVOICE = {
  id: 501, project_id: 9001, file_name: "Criterion_Eng_Invoice_11823.pdf",
  invoice_number: "11823", invoice_date: "2026-08-31", period_start: "2026-08-01", period_end: "2026-08-31",
  invoice_format: "task_correlated", subtotal: 10385, total_amount: 10385,
  reimbursable_amount: 785, reimbursable_markup_billed: 10, status: "reviewed",
  verification_status: "rejected", verification_trust: 71,
  uploaded_at: "2026-09-21T15:20:00Z",
  line_items: INVOICE_LINES, flags: INVOICE_FLAGS,
};

const INVOICE_PROJECT = {
  id: 9001, name: "Atlas Tower — Criterion Engineering", consultant_name: "Criterion Engineering LLC",
  created_at: "2026-07-15T00:00:00Z",
  contracts: [{ id: 71, file_name: "Criterion_MSA_ExhibitB.pdf", label: "Criterion Engineering — MSA + Exhibit B",
    not_to_exceed_total: 89000, default_markup_pct: 10, status: "parsed", uploaded_at: "2026-07-15T00:00:00Z",
    tasks: [
      { id: 1, task_number: "1", description: "Structural review", fee_type: "tm", unit_type: "hour", unit_rate: 245, estimated_fee: 40000, is_active: true },
      { id: 2, task_number: "2", description: "Site inspection", fee_type: "tm", unit_type: "hour", unit_rate: 210, estimated_fee: 25000, is_active: true },
      { id: 3, task_number: "3", description: "Reporting & documentation", fee_type: "tm", unit_type: "hour", unit_rate: 210, estimated_fee: 24000, is_active: true },
    ] }],
  invoices: [INVOICE],
  inspection_reports: [],
};

// ----------------------------------------------------------------- Morning brief

const BRIEF = {
  run: { id: 3001, run_date: "2026-09-22", created_at: "2026-09-22T13:00:00Z", data_mode: "demo" },
  dashboard: {
    lead: "Quiet day: 4 items worth noting across development, capital markets, and rates.",
    sections: {
      development: [
        { title: "Permit filed: 88 Bluxome Street, foundation & shoring", why_it_matters: "Signals the Bluxome life-science project is moving to vertical construction; a comparable to Atlas's Dogpatch pipeline.", source: "DataSF permits" },
      ],
      capital_markets: [
        { title: "Regional bank trims CRE office exposure by ~$400M", why_it_matters: "Tighter office debt availability; refinancing risk rises for 2027 maturities.", source: "public filing" },
      ],
      regulatory: [
        { title: "SF proposes streamlined office-to-residential conversion incentives", why_it_matters: "Could improve basis on underperforming office assets in the portfolio.", source: "SF Planning" },
      ],
      rates: [
        { title: "SOFR 4.86%, 10Y Treasury 4.12%", why_it_matters: "Overnight funding steady; long end down 6bps week-over-week, marginally better for take-out financing.", source: "NY Fed / Treasury" },
      ],
    },
  },
};

// ----------------------------------------------------------------- Competitive hiring

const HIRING = {
  run: { id: 4001, run_date: "2026-09-22", data_mode: "demo" },
  dashboard: {
    data_mode: "demo",
    summary: { total_active_roles: 37, new_since_last_scan: 5, closed_since_last_scan: 2,
      companies_tracked: 8, companies_total: 10, healthy_sources: 8, adapter_needed_sources: 2 },
    intelligence: {
      executive_summary: [
        "*5 new roles* opened across tracked competitors this week, concentrated in acquisitions and capital markets.",
        "One competitor is staffing a *data/AI team* (2 ML-adjacent roles), an early signal of in-housing analytics.",
      ],
      competitive_read: [
        "Net growth (+3) with hiring weighted toward *acquisitions*, consistent with a fund actively sourcing deals.",
        "No leasing-side hiring observed, suggesting stabilized occupancy rather than expansion.",
      ],
    },
    company_comparison: [
      { name: "Harborline Partners", active: 11 }, { name: "Meridian RE", active: 8 },
      { name: "Cascade Holdings", active: 7 }, { name: "Pier 9 Capital", active: 6 },
      { name: "Union Square Group", active: 3 }, { name: "Bayfront Trust", active: 2 },
    ],
    recent_activity: [
      { company: "Harborline Partners", title: "VP, Acquisitions", location: "San Francisco, CA", department: "Acquisitions", seniority: "VP", status: "new" },
      { company: "Meridian RE", title: "ML Engineer, Applied AI", location: "Remote (US)", department: "Technology / AI", seniority: "Mid", status: "new" },
      { company: "Cascade Holdings", title: "Analyst, Capital Markets", location: "San Francisco, CA", department: "Capital Markets", seniority: "Analyst", status: "new" },
      { company: "Pier 9 Capital", title: "Asset Manager", location: "Oakland, CA", department: "Asset Management", seniority: "Mid", status: "updated" },
    ],
  },
};

// ----------------------------------------------------------------- System status

const STATUS = {
  agents: [
    { id: "lease", name: "Lease Abstraction", hours_ago: 2, detail: "12 terms extracted, 1 rejected by verification", memory: { sources: 34, passages: 210 } },
    { id: "invoice", name: "Invoice Agent", hours_ago: 5, detail: "1 invoice reviewed, 3 flags raised", memory: { sources: 18, passages: 96 } },
    { id: "rent-roll", name: "Rent Roll Anomaly Detector", hours_ago: 26, detail: "88 rows scanned, 4 anomalies", memory: { sources: 0, passages: 0 } },
    { id: "brief", name: "Morning Intelligence Brief", hours_ago: 7, detail: "4 items across 4 sections", memory: { sources: 0, passages: 0 } },
    { id: "hiring", name: "Competitive Hiring", hours_ago: 7, detail: "37 active roles across 8 competitors", memory: { sources: 0, passages: 0 } },
    { id: "verify", name: "Verification Layer", hours_ago: 2, detail: "cross-provider checks online (Claude ↔ GPT)", memory: { sources: 0, passages: 0 } },
  ],
  scheduler: { enabled: true },
};

// ----------------------------------------------------------------- Evals / verification (FDE centerpiece)

export const EVALS = {
  generated_at: "2026-09-22T13:00:00Z",
  headline: {
    golden_pass_rate: 0.962,
    golden_total: 320,
    golden_passing: 308,
    verification_catch_rate: 0.984,
    numbers_checked_30d: 5127,
    numbers_caught_30d: 41,
    auto_release_rate: 0.87,
    cross_provider: "Claude (primary) ↔ GPT (independent verifier)",
  },
  agents: [
    { agent: "Lease Abstraction", goldens: 120, pass_rate: 0.958, grounded: 0.991, escalated: 0.12, notes: "field-level rubric: value + citation must match source" },
    { agent: "Invoice Agent", goldens: 96, pass_rate: 0.969, grounded: 0.997, escalated: 0.08, notes: "every money figure re-derived + checked vs PDF text" },
    { agent: "Rent Roll", goldens: 64, pass_rate: 0.984, grounded: 1.0, escalated: 0.05, notes: "deterministic rules, no free-text generation" },
    { agent: "Morning Brief", goldens: 24, pass_rate: 0.875, grounded: 0.92, escalated: 0.25, notes: "each claim must cite a retrievable source" },
    { agent: "Competitive Hiring", goldens: 16, pass_rate: 0.938, grounded: 0.95, escalated: 0.19, notes: "role facts checked against the posting" },
  ],
  pipeline: [
    { stage: "1 · Deterministic grounding", detail: "The cited excerpt must exist in the source; every number/date must be re-derivable from it. Free, runs on 100% of outputs." },
    { stage: "2 · Independent verifier", detail: "A second model from a different provider verifies (not re-answers) each claim: supported / unsupported / contradicted. Cross-provider so it can't repeat the first model's mistake." },
    { stage: "3 · Adjudication + gate", detail: "Signals fuse into a per-claim status (verified / review / rejected) and a document trust score. A hard failure blocks auto-release and routes to a human." },
  ],
  recent_catches: [
    { when: "2h ago", agent: "Lease Abstraction", field: "TI Allowance", caught: "$1,250,000 not grounded — model multiplied a $/sf allowance incorrectly", action: "rejected → human review" },
    { when: "5h ago", agent: "Invoice Agent", field: "Reimbursable amount", caught: "$78,500 not in source (PDF shows $785.00, dropped decimal)", action: "rejected → flagged on invoice" },
    { when: "1d ago", agent: "Morning Brief", field: "Vacancy stat", caught: "cited figure not present in linked article", action: "review → item withheld" },
    { when: "2d ago", agent: "Invoice Agent", field: "Line total", caught: "internal math + source disagreed by $1,110", action: "review → reconciled" },
  ],
  audit: [
    { ts: "2026-09-22 09:14 PT", actor: "verifier", event: "invoice:11823 total flagged (ungrounded)", level: "critical" },
    { ts: "2026-09-22 09:14 PT", actor: "system", event: "auto-release blocked; routed to human", level: "info" },
    { ts: "2026-09-22 08:02 PT", actor: "demo@atlascapital.com", event: "opened lease 101 review queue", level: "info" },
    { ts: "2026-09-21 17:41 PT", actor: "verifier", event: "lease:101 TI allowance rejected", level: "critical" },
    { ts: "2026-09-21 17:40 PT", actor: "system", event: "eval suite run on prompt change (308/320 pass)", level: "info" },
  ],
};

// ----------------------------------------------------------------- resolvers

export async function me() { await delay(60); return { ...DEMO_USER }; }

export async function processLeaseDemo() { await delay(900); return JSON.parse(JSON.stringify(LEASE)); }
export async function uploadLeaseDemo() { await delay(300); return { id: LEASE.id, file_name: LEASE.file_name, file_type: "pdf", status: "text_extracted", message: "uploaded" }; }
export async function getLeaseDemo() { await delay(120); return JSON.parse(JSON.stringify(LEASE)); }

export async function listProjectsDemo() { await delay(150); return [{ id: INVOICE_PROJECT.id, name: INVOICE_PROJECT.name, consultant_name: INVOICE_PROJECT.consultant_name, created_at: INVOICE_PROJECT.created_at }]; }
export async function getProjectDemo() { await delay(200); return JSON.parse(JSON.stringify(INVOICE_PROJECT)); }

export async function latestBriefDemo() { await delay(150); return JSON.parse(JSON.stringify(BRIEF)); }
export async function latestHiringDemo() { await delay(150); return JSON.parse(JSON.stringify(HIRING)); }
export async function statusDemo() { await delay(120); return JSON.parse(JSON.stringify(STATUS)); }
export async function evalsDemo() { await delay(120); return JSON.parse(JSON.stringify(EVALS)); }

export async function noop(value) { await delay(80); return value; }
