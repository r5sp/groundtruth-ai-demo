# GroundTruth — Verified AI for high-stakes workflows

A portfolio/forward-deployed-engineering demo of a production-style Claude
deployment: a hub of document agents whose **every extracted number is checked
against the source and by an independent second model before a human signs off.**

> **Live demo:** _(link added after deploy)_
> Runs entirely in the browser on seeded sample data — no login, no backend.

## Why this exists

The hard part of shipping AI into a real enterprise workflow isn't calling the
model — it's answering *"how do you know it's right?"* GroundTruth is built around
that question. The headline screen is **Evals & Verification**: golden-set pass
rates per agent, a live hallucination-catch rate, the double-LLM verification
pipeline, and an immutable audit log.

## What to look at

- **Evals & Verification** — the trust layer. Golden datasets, per-agent rubrics,
  the 3-stage verification pipeline, recent catches, and the audit trail.
- **Lease Abstraction** — extracts key lease terms; each field carries a
  verification badge (`✓ Verified` / `⚠ Check` / `✕ Rejected`) and a source
  excerpt. Watch it reject a fabricated TI-allowance figure the model computed
  wrong.
- **Invoice Agent** — reviews a consultant invoice against its contract; catches a
  reimbursable amount the model misread from the PDF ($78,500 vs $785.00) and
  flags it before payment.

## The verification approach

1. **Deterministic grounding** (free, runs on 100% of outputs) — the cited
   excerpt must exist in the source; every number/date must be re-derivable.
2. **Independent verifier** — a second model from a *different provider* verifies
   (not re-answers) each claim, so it can't repeat the first model's mistake.
3. **Adjudication + gate** — signals fuse into a per-claim status and a document
   trust score; a hard failure blocks auto-release and routes to a human.

## Stack

- React + Vite single-page app, lazy-loaded per-agent chunks.
- Ships as a fully static build (`VITE_DEMO=1`) backed by an in-browser data
  layer, so the whole product is explorable from one link with no server.
- The production version is backed by a FastAPI service (not included in this
  demo repo) with Google SSO, per-agent RBAC, and the verification engine.

## Run locally

```bash
cd frontend
npm install
VITE_DEMO=1 npm run dev
```
