import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.9)]">
          <p className="text-sm font-semibold text-slate-100">Loading…</p>
          <p className="mt-2 text-xs text-slate-400">Checking your session.</p>
        </div>
      </div>
    );
  }

  if (user) return <>{children}</>;

  // If signed out, always go back to homepage (no auto-login).
  return <Navigate to="/" replace state={{ from: location.pathname }} />;
}

