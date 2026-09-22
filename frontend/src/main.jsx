import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

function ChunkLoading() {
  return (
    <div style={{ padding: "48px", textAlign: "center", color: "#5a6b73",
                  fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>
      Loading…
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="login-page">
          <div className="login-card">
            <p className="login-eyebrow">GroundTruth</p>
            <h1>Something went wrong</h1>
            <p className="login-sub">
              This tool hit an unexpected error. Reloading usually fixes it.
            </p>
            <button className="btn btn-primary" onClick={() => (window.location.href = "/")}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<ChunkLoading />}>
          <App />
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
