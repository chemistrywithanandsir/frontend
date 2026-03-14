// src/app/components/DashboardMiniSidebar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import SidebarLogo from "../../assests/Logo.png";

export function DashboardMiniSidebar() {
  const location = useLocation();
  const isPyq = location.pathname.startsWith("/dashboard/pyq");
  const isNotes = location.pathname.startsWith("/dashboard/notes");
  const isMyNotes = location.pathname.startsWith("/dashboard/my-notes");
  const isProfile = location.pathname === "/dashboard/profile";
  const isHome = !isPyq && !isNotes && !isMyNotes && !isProfile;

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/dashboard" className="block">
            <img
              src={SidebarLogo}
              alt="Chemistry by Anand"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <Link
            to="/dashboard/profile"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
              isProfile
                ? "bg-slate-800 text-cyan-300 border-slate-700"
                : "text-slate-200 border-slate-700"
            }`}
          >
            Profile
          </Link>
        </div>
        <nav className="mt-3 -mx-1 overflow-x-auto">
          <div className="flex gap-2 px-1 pb-1 min-w-max">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                isHome
                  ? "bg-slate-800 text-cyan-300"
                  : "text-slate-200 border border-slate-700"
              }`}
            >
              Home
            </Link>
            <Link
              to="/dashboard/pyq"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                isPyq
                  ? "bg-slate-800 text-cyan-300"
                  : "text-slate-200 border border-slate-700"
              }`}
            >
              PYQs
            </Link>
            <Link
              to="/dashboard/notes"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                isNotes
                  ? "bg-slate-800 text-cyan-300"
                  : "text-slate-200 border border-slate-700"
              }`}
            >
              Notes
            </Link>
            <Link
              to="/dashboard/my-notes"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                isMyNotes
                  ? "bg-slate-800 text-cyan-300"
                  : "text-slate-200 border border-slate-700"
              }`}
            >
              My notes
            </Link>
          </div>
        </nav>
      </div>

      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col items-center py-8 shrink-0">
        <Link to="/dashboard" className="flex items-center justify-center mb-8">
          <img
            src={SidebarLogo}
            alt="Chemistry by Anand"
            className="h-16 w-auto object-contain"
          />
        </Link>

        <nav className="flex flex-col gap-3 w-full px-4">
          <Link
            to="/dashboard"
            className={`px-3 py-2 rounded-lg font-medium text-left ${
              isHome
                ? "bg-slate-800 text-cyan-300"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            Home
          </Link>
          <Link
            to="/dashboard/pyq"
            className={`px-3 py-2 rounded-lg font-medium text-left ${
              isPyq
                ? "bg-slate-800 text-cyan-300"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            PYQs
          </Link>
          <Link
            to="/dashboard/notes"
            className={`px-3 py-2 rounded-lg font-medium text-left ${
              isNotes
                ? "bg-slate-800 text-cyan-300"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            Notes
          </Link>
          <Link
            to="/dashboard/my-notes"
            className={`px-3 py-2 rounded-lg font-medium text-left ${
              isMyNotes
                ? "bg-slate-800 text-cyan-300"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            My notes
          </Link>
          <Link
            to="/dashboard/profile"
            className={`px-3 py-2 rounded-lg font-medium text-left ${
              isProfile
                ? "bg-slate-800 text-cyan-300"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            Profile
          </Link>
        </nav>
      </aside>
    </>
  );
}
