import React, { useState, useEffect } from "react";
import { useProfile } from "../context/ProfileContext";

const CLASS_OPTIONS = [
  "Class 10",
  "Class 11",
  "Class 12",
  "Dropper",
  "Other",
];

const APPEARING_YEARS = ["2025", "2026", "2027", "2028", "2029", "2030"];

export function ProfileSetupModal() {
  const { updateProfile, prefillName } = useProfile();
  const [name, setName] = useState(prefillName);

  useEffect(() => {
    if (prefillName) setName((prev) => (prev ? prev : prefillName));
  }, [prefillName]);
  const [cls, setCls] = useState("");
  const [appearingYear, setAppearingYear] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile({
        displayName: name.trim(),
        class: cls.trim(),
        appearingYear: appearingYear.trim() || undefined,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-slate-50">
            Welcome to Chemistry by Anand
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tell us a bit about yourself to get started.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Your name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor="profile-class"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Class
            </label>
            <select
              id="profile-class"
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400/60"
            >
              <option value="">Select your class</option>
              {CLASS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="profile-year"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Appearing year
            </label>
            <select
              id="profile-year"
              value={appearingYear}
              onChange={(e) => setAppearingYear(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400/60"
            >
              <option value="">Select appearing year</option>
              {APPEARING_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
