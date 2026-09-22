import { useEffect, useState } from "react";
import Header from "./Header";
import SectionHeading from "./SectionHeading";
import { EmptyState, ErrorBar, Loading } from "./ui";
import {
  getAdminSettings, putAdminSetting, getAdminUsers, setUserAdmin, getAuditEvents,
  getMemory, forgetMemory,
} from "../api";

const ACTION_LABELS = {
  "auth.login": "Sign-in",
  "auth.denied_domain": "Blocked sign-in (outside domain)",
  "ratelimit.exceeded": "Rate limit tripped",
  "admin.grant": "Admin granted",
  "admin.revoke": "Admin revoked",
  "setting.update": "Setting changed",
};

function AuditRow({ e }) {
  const when = e.created_at ? new Date(e.created_at).toLocaleString() : "-";
  return (
    <tr className={e.anomaly ? "audit-anomaly" : ""}>
      <td>{when}</td>
      <td>{e.anomaly ? "● " : ""}{ACTION_LABELS[e.action] || e.action}</td>
      <td className="wrap">{e.actor_email || "-"}</td>
      <td className="wrap">{[e.target, e.detail].filter(Boolean).join(" · ") || "-"}</td>
      <td>{e.ip || "-"}</td>
    </tr>
  );
}

function SettingRow({ s, onSave }) {
  const [val, setVal] = useState(s.value);
  const [saved, setSaved] = useState(false);
  const dirty = val !== s.value;
  return (
    <div className="admin-setting">
      <div>
        <div className="admin-setting-label">{s.label}</div>
        <div className="admin-setting-key">{s.key}{s.overridden ? " · custom" : " · default"}</div>
      </div>
      <div className="admin-setting-edit">
        <input value={val} onChange={(e) => { setVal(e.target.value); setSaved(false); }} />
        <button
          className="btn btn-secondary btn-sm"
          disabled={!dirty}
          onClick={async () => { await onSave(s.key, val); setSaved(true); }}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel({ user, onLogout, onBack }) {
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [mem, setMem] = useState([]);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    getAdminSettings().then((d) => setSettings(d.settings)).catch((e) => setError(e.message));
    getAdminUsers().then((d) => setUsers(d.users)).catch(() => {});
    getMemory().then((d) => setMem(d.sources)).catch(() => {});
    getAuditEvents().then((d) => setAudit(d.events)).catch(() => {});
  };
  useEffect(load, []);

  const save = async (key, value) => {
    const d = await putAdminSetting(key, value);
    setSettings(d.settings);
  };
  const toggleAdmin = async (u) => {
    try {
      const d = await setUserAdmin(u.id, !u.is_admin);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? d.user : x)));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  const forget = async (m) => {
    await forgetMemory(m.agent, m.label, m.ref);
    setMem((prev) => prev.filter((x) => !(x.agent === m.agent && x.label === m.label && x.ref === m.ref)));
  };

  const groups = (settings || []).reduce((acc, s) => {
    (acc[s.group] = acc[s.group] || []).push(s);
    return acc;
  }, {});

  return (
    <>
      <Header user={user} onLogout={onLogout} onBack={onBack} toolName="Admin" />
      <main className="fs-main">
        <section className="fs-section fs-hero">
          <SectionHeading label="Admin" number={0} />
          <h1>Tune the agents, manage access, review memory.</h1>
        </section>

        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            <SectionHeading label="Agent settings" number={1} />
            {error && <ErrorBar message={error} />}
            {settings === null && !error ? (
              <Loading label="Loading settings…" />
            ) : (
              Object.entries(groups).map(([group, rows]) => (
                <div key={group} className="admin-group">
                  <h3 className="admin-group-title">{group}</h3>
                  {rows.map((s) => <SettingRow key={s.key} s={s} onSave={save} />)}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="fs-section">
          <div className="fs-section-inner">
            <SectionHeading label="Agent memory" number={2} />
            {mem.length === 0 ? (
              <EmptyState title="Nothing learned yet" hint="Memory builds as documents are uploaded and chats happen." />
            ) : (
              <div className="billing-table-wrap">
                <table className="billing-table">
                  <thead>
                    <tr><th>Agent</th><th>Source</th><th>Kind</th><th>Chunks</th><th></th></tr>
                  </thead>
                  <tbody>
                    {mem.map((m, i) => (
                      <tr key={i}>
                        <td>{m.agent}</td>
                        <td className="wrap">{m.label}</td>
                        <td>{m.kind}</td>
                        <td>{m.chunks}</td>
                        <td><button className="btn btn-secondary btn-sm" onClick={() => forget(m)}>Forget</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="fs-section bg-gray">
          <div className="fs-section-inner">
            <SectionHeading label="Users" number={3} />
            {error && <ErrorBar message={error} />}
            <div className="billing-table-wrap">
              <table className="billing-table">
                <thead><tr><th>Email</th><th>Name</th><th>Admin</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.name || "-"}</td>
                      <td>
                        {(() => {
                          const isSelf = u.id === user.id;
                          // Can only grant admin to allowlisted emails; can always revoke.
                          const blocked = isSelf || (!u.is_admin && !u.can_be_admin);
                          const title = isSelf
                            ? "You can't change your own admin access"
                            : !u.is_admin && !u.can_be_admin
                              ? "Not on the admin allowlist (ADMIN_EMAILS)"
                              : u.is_admin ? "Revoke admin" : "Make admin";
                          return (
                            <button
                              className={`admin-toggle${u.is_admin ? " on" : ""}`}
                              onClick={() => toggleAdmin(u)}
                              disabled={blocked}
                              title={title}
                            >
                              {u.is_admin ? "✓ Admin" : (u.can_be_admin ? "Make admin" : "Not allowed")}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="fs-section">
          <div className="fs-section-inner">
            <SectionHeading label="Security activity" number={4} />
            <p className="admin-setting-key" style={{ marginBottom: "var(--fs-space-2)" }}>
              Recent sign-ins, permission changes, blocked sign-ins, and rate-limit trips.
              Highlighted rows are worth a look.
            </p>
            {audit.length === 0 ? (
              <EmptyState title="No activity yet" hint="Security events show up here as people use the tools." />
            ) : (
              <div className="billing-table-wrap">
                <table className="billing-table">
                  <thead><tr><th>When</th><th>Event</th><th>Who</th><th>Details</th><th>IP</th></tr></thead>
                  <tbody>
                    {audit.map((e) => <AuditRow key={e.id} e={e} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="fs-footer">
        <div className="fs-footer-inner">
          <span className="fs-footer-wordmark">GroundTruth</span>
          <span className="fs-footer-copy">Admin · San Francisco</span>
        </div>
      </footer>
    </>
  );
}
