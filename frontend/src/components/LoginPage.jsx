import { useEffect, useState } from "react";
import { DEMO } from "../api";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function LoginPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_error") === "domain") {
      setError("Access denied. Only approved accounts can sign in.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("auth_error") === "signin") {
      setError("Sign-in didn't complete. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google/login`;
  };

  // Live demo build: no real auth, just drop the visitor into the workspace.
  if (DEMO) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="login-eyebrow">GroundTruth · Applied AI Platform</p>
          <h1>Verified AI for high-stakes work.</h1>
          <p className="login-sub">
            A live, interactive demo of a production Claude deployment: document agents whose every
            number is checked against the source and by an independent model before a human signs
            off. No login, explore as a guest.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Enter the demo →
          </button>
          <p className="login-footer-note">
            Sample data only. Built as an applied-AI / forward-deployed engineering portfolio project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="login-eyebrow">GroundTruth · Applied AI</p>
        <h1>GroundTruth</h1>
        <p className="login-sub">
          Sign in with your organization Google account to continue.
        </p>

        {error && <div className="status-bar error">{error}</div>}

        <button className="btn btn-google" onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
