import { useState } from "react";
import { submitFeedback } from "../api";

// Reusable 👍/👎 (+ correction note on 👎) on any agent output. A downvote note
// is fed back into the agent's memory server-side so it self-corrects.
export default function Feedback({ agent, targetType, targetRef, compact = true }) {
  const [state, setState] = useState(null); // null | "up" | "down" | "done"
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (verdict, noteText) => {
    setBusy(true);
    try {
      await submitFeedback(agent, targetType, targetRef, verdict, noteText);
      setState("done");
    } catch {
      setState(null);
    } finally {
      setBusy(false);
    }
  };

  if (state === "done") {
    return <span className="fb-done">✓ thanks</span>;
  }

  if (state === "down") {
    return (
      <span className="fb-note">
        <input
          type="text"
          value={note}
          autoFocus
          placeholder="what was wrong? (teaches the agent)"
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send("down", note)}
        />
        <button className="fb-btn" disabled={busy} onClick={() => send("down", note)}>Send</button>
      </span>
    );
  }

  return (
    <span className={`fb ${compact ? "fb-compact" : ""}`} title="Rate this (teaches the agent)">
      <button className="fb-btn" disabled={busy} onClick={() => send("up", null)} aria-label="Good">👍</button>
      <button className="fb-btn" disabled={busy} onClick={() => setState("down")} aria-label="Wrong">👎</button>
    </span>
  );
}
