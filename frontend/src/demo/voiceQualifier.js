// Client-side lead-qualification engine for the voice demo.
//
// This is a browser port of the production Python engine (script + rubric +
// scoring). It runs entirely in the page so the voice agent works on the static
// GitHub Pages demo with no backend. In the real deployment the identical logic
// backs an outbound phone call placed through a voice provider (Bland / Vapi).

export const QUALIFIED_THRESHOLD = 70;
export const NURTURE_THRESHOLD = 40;

export const SCRIPT = [
  {
    key: "intent",
    prompt:
      "Are you currently looking to buy, sell, or invest in a property, or mostly keeping an eye on the market for now?",
    keywords: {
      sell: "sell", selling: "sell", list: "sell",
      invest: "invest", rental: "invest", portfolio: "invest",
      buy: "buy", buying: "buy", purchase: "buy", "looking for a home": "buy",
      "just looking": "browsing", browsing: "browsing", "keeping an eye": "browsing",
      "not interested": "not_interested", "remove me": "not_interested", stop: "not_interested",
    },
  },
  {
    key: "timeline",
    prompt: "Got it. Ideally, when are you hoping to make a move?",
    keywords: {
      asap: "0-3mo", "right away": "0-3mo", immediately: "0-3mo", "this month": "0-3mo", "next month": "0-3mo",
      "few months": "3-6mo", spring: "3-6mo", summer: "3-6mo",
      "this year": "6-12mo", "end of the year": "6-12mo",
      "next year": "12mo+", "couple years": "12mo+", "no rush": "12mo+", someday: "12mo+",
    },
  },
  { key: "budget", prompt: "Makes sense. Do you have a price range in mind?", keywords: {} },
  {
    key: "financing",
    prompt:
      "And to match the right options, have you been pre-approved with a lender yet, or would this be a cash purchase?",
    keywords: {
      "pre-approved": "pre_approved", preapproved: "pre_approved", approved: "pre_approved",
      cash: "cash",
      "in process": "in_process", "working on": "in_process", applying: "in_process", "talking to": "in_process",
      "not yet": "none", "haven't": "none", "have not": "none",
    },
  },
  { key: "location", prompt: "Last thing, which neighborhoods or areas are you focused on?", keywords: {} },
];

const byKey = Object.fromEntries(SCRIPT.map((q) => [q.key, q]));
const fieldFor = (key) => (key === "budget" ? "budget_usd" : key);

export function firstMessage(name) {
  const who = name ? `, is this ${name}?` : ".";
  return (
    `Hi${who} This is Ava calling from Fifth Space, the real-estate group. ` +
    "You recently reached out about the market, so I wanted to check in for two quick minutes. Is now an okay time?"
  );
}

export function parseBudget(text) {
  const t = text.toLowerCase();
  let m = t.match(/(\d+(?:\.\d+)?)\s*(m|million)/);
  if (m) return Math.round(parseFloat(m[1]) * 1_000_000);
  m = t.match(/(\d+(?:\.\d+)?)\s*k/);
  if (m) return Math.round(parseFloat(m[1]) * 1_000);
  m = t.match(/\$?\s?(\d[\d,]*(?:\.\d+)?)/);
  if (m) {
    const n = Math.round(parseFloat(m[1].replace(/,/g, "")));
    return n < 10_000 ? n * 1_000 : n;
  }
  return null;
}

export function parseAnswer(key, text) {
  const low = text.toLowerCase();
  if (key === "budget") return parseBudget(text);
  if (key === "location") return text.trim() || null;
  const q = byKey[key];
  if (q) for (const [kw, val] of Object.entries(q.keywords)) if (low.includes(kw)) return val;
  return "unknown";
}

export function detectDoNotContact(text) {
  const low = text.toLowerCase();
  return ["remove me", "do not call", "don't call", "not interested", "stop calling", "take me off"].some((p) =>
    low.includes(p)
  );
}

const INTENT_PTS = { sell: 35, buy: 33, invest: 30, browsing: 8, not_interested: 0, unknown: 5 };
const TIMELINE_PTS = { "0-3mo": 25, "3-6mo": 20, "6-12mo": 12, "12mo+": 5, unknown: 3 };
const FIN_PTS = { cash: 20, pre_approved: 20, in_process: 12, none: 4, unknown: 3 };

export function scoreLead(s) {
  const reasons = [];
  if (s.do_not_contact) return { score: 0, status: "disqualified", reasons: ["Requested no further contact."] };
  if (s.intent === "not_interested") return { score: 0, status: "disqualified", reasons: ["Not interested."] };

  let score = 0;
  const ip = INTENT_PTS[s.intent] ?? 5; score += ip; reasons.push(`Intent "${s.intent || "unknown"}" (+${ip})`);
  const tp = TIMELINE_PTS[s.timeline] ?? 3; score += tp; reasons.push(`Timeline "${s.timeline || "unknown"}" (+${tp})`);
  const fp = FIN_PTS[s.financing] ?? 3; score += fp; reasons.push(`Financing "${s.financing || "unknown"}" (+${fp})`);
  if (s.budget_usd) { const bp = s.budget_usd >= 500_000 ? 15 : 10; score += bp; reasons.push(`Budget $${s.budget_usd.toLocaleString()} (+${bp})`); }
  else reasons.push("No budget captured (+0)");
  if (s.location) { score += 5; reasons.push("Target market captured (+5)"); }

  score = Math.max(0, Math.min(score, 100));
  const status = score >= QUALIFIED_THRESHOLD ? "qualified" : score >= NURTURE_THRESHOLD ? "nurture" : "disqualified";
  return { score, status, reasons };
}

export function nextIndex(structured) {
  for (let i = 0; i < SCRIPT.length; i++) {
    const v = structured[fieldFor(SCRIPT[i].key)];
    if (v === undefined || v === null || v === "unknown") return i;
  }
  return SCRIPT.length;
}

// One agent turn. Returns {reply, done, structured}.
export function agentReply(structured, lastUserMsg) {
  structured = { ...structured };
  if (lastUserMsg != null) {
    if (detectDoNotContact(lastUserMsg)) {
      structured.do_not_contact = true;
      return { reply: "Understood, I'll take you off our list. Sorry to bother you, take care.", done: true, structured };
    }
    const idx = nextIndex(structured);
    if (idx < SCRIPT.length) {
      const q = SCRIPT[idx];
      structured[fieldFor(q.key)] = parseAnswer(q.key, lastUserMsg);
    }
  }
  const idx = nextIndex(structured);
  if (idx >= SCRIPT.length) {
    return {
      reply: "That's everything I needed, thank you. A Fifth Space advisor will follow up shortly. Have a great day!",
      done: true,
      structured,
    };
  }
  return { reply: SCRIPT[idx].prompt, done: false, structured };
}
