import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import SectionHeading from "./SectionHeading";
import {
  SCRIPT, firstMessage, agentReply, scoreLead, detectDoNotContact,
} from "../demo/voiceQualifier";

const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

const STATUS_STYLE = {
  qualified: { bg: "#dcfce7", fg: "#166534", label: "Qualified" },
  nurture: { bg: "#fef9c3", fg: "#854d0e", label: "Nurture" },
  disqualified: { bg: "#fee2e2", fg: "#991b1b", label: "Disqualified" },
};

const FIELD_LABELS = [
  ["intent", "Intent"], ["timeline", "Timeline"], ["budget_usd", "Budget"],
  ["financing", "Financing"], ["location", "Area"],
];

function fieldValue(k, v) {
  if (v == null || v === "unknown") return "—";
  if (k === "budget_usd") return `$${Number(v).toLocaleString()}`;
  return String(v);
}

function pickVoice() {
  if (!canSpeak) return null;
  const vs = window.speechSynthesis.getVoices();
  return (
    vs.find((v) => /en(-|_)US/i.test(v.lang) && /(samantha|jenny|female|aria|google us)/i.test(v.name)) ||
    vs.find((v) => /^en/i.test(v.lang)) || vs[0] || null
  );
}

export default function VoiceQualifier({ user, onLogout, onBack }) {
  const [phase, setPhase] = useState("idle"); // idle|speaking|listening|processing|done|denied
  const [messages, setMessages] = useState([]); // {who, text, interim?}
  const [structured, setStructured] = useState({});
  const [result, setResult] = useState(null);
  const [latency, setLatency] = useState(null);
  const [interim, setInterim] = useState("");

  const structRef = useRef({});
  const recogRef = useRef(null);
  const abortRef = useRef(false);
  const scrollRef = useRef(null);
  const voiceRef = useRef(null);

  useEffect(() => {
    if (canSpeak) {
      voiceRef.current = pickVoice();
      window.speechSynthesis.onvoiceschanged = () => { voiceRef.current = pickVoice(); };
    }
    return () => { abortRef.current = true; try { window.speechSynthesis.cancel(); } catch {} try { recogRef.current?.stop(); } catch {} };
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, interim]);

  const addMsg = (who, text) => setMessages((m) => [...m, { who, text }]);

  const speak = (text) =>
    new Promise((resolve) => {
      addMsg("agent", text);
      if (!canSpeak) { setTimeout(resolve, 300); return; }
      setPhase("speaking");
      const u = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 1.03; u.pitch = 1.0;
      u.onend = resolve; u.onerror = resolve;
      try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch { setTimeout(resolve, 300); }
    });

  const listen = () =>
    new Promise((resolve) => {
      if (!SR) { resolve(null); return; }
      const rec = new SR();
      recogRef.current = rec;
      rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      let finalText = ""; let settled = false;
      const done = (val) => { if (!settled) { settled = true; setInterim(""); try { rec.stop(); } catch {} resolve(val); } };
      setPhase("listening"); setInterim("");
      rec.onresult = (e) => {
        let intr = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else intr += r[0].transcript;
        }
        setInterim(intr);
        if (finalText.trim()) done(finalText.trim());
      };
      rec.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { setPhase("denied"); } done(null); };
      rec.onend = () => done(finalText.trim() || null);
      try { rec.start(); } catch { done(null); }
    });

  const finish = (s) => {
    const r = scoreLead(s);
    setResult(r);
    setPhase("done");
  };

  const runTurn = async (userMsg) => {
    if (abortRef.current) return;
    if (userMsg != null) addMsg("lead", userMsg);
    setPhase("processing");
    const t0 = performance.now();
    const turn = agentReply(structRef.current, userMsg);
    structRef.current = turn.structured;
    setStructured(turn.structured);
    setLatency(Math.round(performance.now() - t0));
    await speak(turn.reply);
    if (abortRef.current) return;
    if (turn.done) { finish(turn.structured); return; }
    const ans = await listen();
    if (abortRef.current) return;
    if (ans == null) {
      await speak("Sorry, I didn't quite catch that, could you say that again?");
      const retry = await listen();
      if (abortRef.current) return;
      if (retry == null) { finish(structRef.current); return; }
      return runTurn(retry);
    }
    return runTurn(ans);
  };

  const startCall = async () => {
    abortRef.current = false;
    structRef.current = {}; setStructured({}); setMessages([]); setResult(null); setLatency(null);
    await speak(firstMessage(null));
    if (abortRef.current) return;
    const ack = await listen();
    if (abortRef.current) return;
    if (ack && detectDoNotContact(ack)) { addMsg("lead", ack); structRef.current = { do_not_contact: true }; finish(structRef.current); return; }
    if (ack) addMsg("lead", ack);
    runTurn(null);
  };

  const endCall = () => {
    abortRef.current = true;
    try { window.speechSynthesis.cancel(); } catch {}
    try { recogRef.current?.stop(); } catch {}
    if (!result) finish(structRef.current);
  };

  const live = phase === "speaking" || phase === "listening" || phase === "processing";
  const statusLabel = { speaking: "Ava is speaking…", listening: "Listening…", processing: "Thinking…", denied: "Microphone blocked", done: "Call ended", idle: "Ready" }[phase];

  return (
    <>
      <style>{`
        @keyframes gtpulse { 0%{transform:scale(1);opacity:.55} 70%{transform:scale(1.9);opacity:0} 100%{opacity:0} }
        .gt-mic { position:relative; width:96px; height:96px; border-radius:50%; border:none; cursor:pointer;
          background:var(--fs-neon); color:var(--fs-blue); font-size:34px; display:flex; align-items:center; justify-content:center; }
        .gt-mic[disabled]{ opacity:.5; cursor:default; }
        .gt-mic .ring{ position:absolute; inset:0; border-radius:50%; background:var(--fs-neon); }
        .gt-listening .ring{ animation:gtpulse 1.4s ease-out infinite; }
      `}</style>
      <Header user={user} onLogout={onLogout} onBack={onBack} toolName="Lead Qualifier (Voice)" />
      <main className="fs-main">
        <section className="fs-section fs-hero">
          <SectionHeading label="Voice Lead Qualifier" number={0} />
          <h1>Talk to the agent.</h1>
          <p className="fs-hero-lead">
            An outbound voice agent, Ava, calls opted-in real-estate leads, works a short qualification
            script, and scores each lead in real time. Press the mic and role-play the lead: speak your
            answers out loud and watch the structured profile fill in. In production this same logic runs
            over the phone through a voice API (Bland / Vapi); here it runs in your browser.
          </p>
        </section>

        <section className="fs-section bg-gray">
          <div className="fs-section-inner" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "start" }}>
            {/* Call panel */}
            <div style={{ border: "1px solid var(--fs-border)", borderRadius: 12, background: "var(--fs-white)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--fs-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>☎ {phase === "idle" ? "Ready to call" : "Live call — Ava × Lead"}</strong>
                <span style={{ fontSize: "0.8rem", color: live ? "#0f7a52" : "var(--fs-text-muted)", fontWeight: 700 }}>
                  {live && <span style={{ marginRight: 6 }}>●</span>}{statusLabel}
                </span>
              </div>

              <div ref={scrollRef} style={{ height: 300, overflowY: "auto", padding: 16, background: "var(--fs-gray)" }}>
                {messages.length === 0 && phase === "idle" && (
                  <div style={{ color: "var(--fs-text-muted)", textAlign: "center", marginTop: 90 }}>
                    Press the mic to start the call.
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.who === "agent" ? "flex-start" : "flex-end", marginBottom: 8 }}>
                    <span style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: "0.9rem", lineHeight: 1.4,
                      background: m.who === "agent" ? "var(--fs-white)" : "var(--fs-blue)", color: m.who === "agent" ? "var(--fs-blue)" : "var(--fs-white)",
                      border: m.who === "agent" ? "1px solid var(--fs-border)" : "none" }}>
                      <strong style={{ fontSize: "0.66rem", opacity: 0.7, display: "block" }}>{m.who === "agent" ? "Ava" : "You (lead)"}</strong>
                      {m.text}
                    </span>
                  </div>
                ))}
                {interim && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: "0.9rem", fontStyle: "italic", opacity: 0.6, background: "var(--fs-blue)", color: "#fff" }}>{interim}…</span>
                  </div>
                )}
              </div>

              <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 16, justifyContent: "center", borderTop: "1px solid var(--fs-border)" }}>
                {phase === "idle" || phase === "done" ? (
                  <button className={`gt-mic`} onClick={startCall} title="Start call" disabled={!SR && !canSpeak}>
                    🎤
                  </button>
                ) : (
                  <>
                    <button className={`gt-mic ${phase === "listening" ? "gt-listening" : ""}`} disabled title={statusLabel}>
                      <span className="ring" />
                      <span style={{ position: "relative" }}>{phase === "listening" ? "🎧" : "🔊"}</span>
                    </button>
                    <button className="btn btn-secondary" onClick={endCall}>End call</button>
                  </>
                )}
                {latency != null && live && (
                  <span style={{ fontSize: "0.75rem", color: "var(--fs-text-muted)" }}>turn logic {latency} ms</span>
                )}
              </div>
              {!SR && (
                <div className="status-bar" style={{ margin: 12 }}>
                  Voice recognition needs Chrome or Safari. {canSpeak ? "Ava will still speak; " : ""}open this in Chrome for the full talk-to-agent demo.
                </div>
              )}
              {phase === "denied" && (
                <div className="status-bar error" style={{ margin: 12 }}>Microphone permission was blocked. Allow the mic and press the mic button again.</div>
              )}
            </div>

            {/* Live extraction + result */}
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ border: "1px solid var(--fs-border)", borderRadius: 12, background: "var(--fs-white)", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fs-text-muted)", marginBottom: 12 }}>
                  Extracted live
                </div>
                {FIELD_LABELS.map(([k, label]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--fs-border)" }}>
                    <span style={{ color: "var(--fs-text-muted)", fontSize: "0.85rem" }}>{label}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{fieldValue(k, structured[k])}</span>
                  </div>
                ))}
              </div>

              {result && (
                <div style={{ border: "1px solid var(--fs-border)", borderRadius: 12, background: "var(--fs-white)", padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: "2rem", fontWeight: 800 }}>{result.score}</span>
                    <span style={{ ...({ padding: "3px 10px", borderRadius: 5, fontWeight: 800, fontSize: "0.8rem" }),
                      background: STATUS_STYLE[result.status].bg, color: STATUS_STYLE[result.status].fg }}>
                      {STATUS_STYLE[result.status].label}
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "var(--fs-text-muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                    {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="fs-section">
          <SectionHeading label="How it works in production" number={1} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
            {[
              ["Outbound call", "A voice API (Bland / Vapi) dials the lead from a provisioned number and streams audio both ways."],
              ["Same script + rubric", "The identical qualification script and 0-100 scoring you see here run server-side — the browser and the phone agent share one engine."],
              ["Structured extraction", "Intent, timeline, budget, financing, and area are pulled from the transcript in real time (shown filling in on the right)."],
              ["Guardrails", "The agent identifies itself, honors an instant opt-out (do-not-contact => disqualified), and never gives financial advice."],
            ].map(([h, d]) => (
              <div key={h} style={{ border: "1px solid var(--fs-border)", borderRadius: 10, padding: 18, background: "var(--fs-white)" }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{h}</div>
                <div style={{ color: "var(--fs-text-muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="fs-footer">
        <div className="fs-footer-inner">
          <span className="fs-footer-wordmark">GroundTruth</span>
          <span className="fs-footer-copy">Voice Lead Qualifier · Applied AI</span>
        </div>
      </footer>
    </>
  );
}
