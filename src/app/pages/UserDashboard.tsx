// src/app/pages/UserDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile, getDisplayNameFallback, getAvatarUrl } from "../context/ProfileContext";
import Logo from "../../assests/Logo.png";
import NeetLogo from "../../assests/neet.jpg";
import JeeMainLogo from "../../assests/JEE(mains).png";
import JeeAdvancedLogo from "../../assests/Jee-advanced.jpg";
import CbseLogo from "../../assests/CBSE.svg";
import { LogOut, Plus, Trash2, Target } from "lucide-react";
import {
  type Exam,
  type Chapter,
  type NoteBundle,
  MOCK_EXAMS,
  MOCK_LATEST_BUNDLES,
} from "../../data/notesData";
import {
  fetchTodayTasksForUser,
  saveTodayTasksForUser,
  type TodayTask as ApiTodayTask,
} from "../api/tasksApi";
import {
  fetchTodaySolvedCount,
  fetchWeeklyActivity,
  type WeeklyActivityPoint,
} from "../api/analyticsApi";
import { useRazorpayPayment } from "../hooks/useRazorpayPayment";
import {
  fetchPublicBundleDetail,
  fetchPublicBundles,
  getCachedPublicBundleDetail,
  getCachedPublicBundles,
} from "../api/notesApi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const MOCK_PURCHASED_BUNDLES: NoteBundle[] = MOCK_LATEST_BUNDLES;

function getExamLogoPath(examId: string) {
  // Map exam IDs to actual imported logo assets.
  switch (examId) {
    case "neet":
      return NeetLogo;
    case "jee-main":
      return JeeMainLogo;
    case "jee-advanced":
      return JeeAdvancedLogo;
    case "cbse":
      return CbseLogo;
    default:
      return "";
  }
}

function DashboardHome({
  displayName,
  onBundleClick,
}: {
  displayName: string;
  onBundleClick: (bundleId: string) => void;
}) {
  const { user } = useAuth();
  const cachedLatest = useMemo(() => getCachedPublicBundles() ?? null, []);
  const [latestBundles, setLatestBundles] = useState<NoteBundle[]>(
    cachedLatest?.slice(0, 5) ?? MOCK_LATEST_BUNDLES.slice(0, 5)
  );
  const [latestLoading, setLatestLoading] = useState(!cachedLatest);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [solvedToday, setSolvedToday] = useState(0);

  type TodayTask = { id: string; text: string; done: boolean };
  const [taskInput, setTaskInput] = useState("");
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);

  const todayKey = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSolvedToday = async () => {
      if (!user) {
        if (!cancelled) setSolvedToday(0);
        return;
      }
      const count = await fetchTodaySolvedCount(user.id);
      if (!cancelled) setSolvedToday(count);
    };
    void loadSolvedToday();
    return () => {
      cancelled = true;
    };
  }, [todayKey, user]);

  useEffect(() => {
    let cancelled = false;
    const loadTasks = async () => {
      if (!user) {
        if (!cancelled) setTodayTasks([]);
        return;
      }
      try {
        const rows = await fetchTodayTasksForUser(user.id, todayKey);
        if (!cancelled) {
          const mapped: TodayTask[] = rows.map((t: ApiTodayTask) => ({
            id: t.id,
            text: t.text,
            done: t.done,
          }));
          setTodayTasks(mapped);
        }
      } catch {
        if (!cancelled) setTodayTasks([]);
      }
    };
    void loadTasks();
    return () => {
      cancelled = true;
    };
  }, [todayKey, user]);

  const persistTasks = (tasks: TodayTask[]) => {
    setTodayTasks(tasks);
    if (!user) return;
    void saveTodayTasksForUser(user.id, todayKey, tasks);
  };

  useEffect(() => {
    const loadLatest = async () => {
      setLatestLoading(true);
      setLatestError(null);
      try {
        const bundles = await fetchPublicBundles();
        setLatestBundles(bundles.slice(0, 5));
      } catch {
        setLatestError("Could not load latest bundles.");
      } finally {
        setLatestLoading(false);
      }
    };

    void loadLatest();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
      {/* Welcome header */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7 shadow-[0_24px_60px_rgba(15,23,42,0.95)]">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Chemistry by Anand · Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Welcome back<span className="ml-2">👋</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base">
              {displayName
                ? `Hi ${displayName}. Let's keep building your chemistry rank—PYQs, notes and tests are ready when you are.`
                : "Sign in to save your progress and build your rank."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-[11px] md:text-xs max-w-xs md:max-w-none">
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900/80 px-4 py-3">
              <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-cyan-500/20 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 bottom-0 h-12 w-12 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Solved today
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    Correct questions you've checked today.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-cyan-300 leading-none">
                    {solvedToday}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {solvedToday === 1 ? "question" : "questions"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Exams section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Your Exams</h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Pick an exam to focus your prep.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-2">
          {MOCK_EXAMS.map((exam) => {
            const logoSrc = getExamLogoPath(exam.id);
            return (
              <div
                key={exam.id}
                className="min-w-0 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400/70 hover:-translate-y-1 transition-all shadow-lg/40"
              >
                <div className="h-full w-full rounded-3xl bg-gradient-to-br from-[#14f1ff] via-[#2b84ff] to-[#7c3aed] px-0.5 py-0.5">
                  <div className="h-full w-full rounded-[1.4rem] bg-slate-950 px-6 py-6 flex flex-col items-center justify-between gap-4">
                    <div className="relative mb-1">
                      <div className="h-16 w-16 rounded-2xl bg-slate-900/80 border border-slate-700 shadow-inner flex items-center justify-center overflow-hidden">
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={`${exam.name} logo`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-200">
                            {exam.code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-semibold tracking-wide text-slate-50">
                      {exam.name}
                    </div>
                    <div className="w-full flex items-center justify-center gap-3">
                      <Link
                        to={`/dashboard/pyq/${exam.id}`}
                        className="px-4 py-1.5 rounded-full bg-slate-900 border border-cyan-400/70 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                      >
                        PYQs
                      </Link>
                      <Link
                        to={`/dashboard/notes/${exam.id}`}
                        className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 text-[11px] font-semibold text-slate-950 hover:from-cyan-300 hover:to-sky-400 transition-colors"
                      >
                        Notes
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Today's target */}
      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold">
          Today's target
        </h2>
        {(() => {
          const doneCount = todayTasks.filter((t) => t.done).length;
          const totalCount = todayTasks.length;
          const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
          const addTask = () => {
            const text = taskInput.trim();
            if (!text) return;
            const newTask: TodayTask = {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              text,
              done: false,
            };
            persistTasks([newTask, ...todayTasks]);
            setTaskInput("");
          };

          return (
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/70 via-slate-950/60 to-slate-950/80 px-4 sm:px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
              <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 -bottom-16 h-44 w-44 rounded-full bg-fuchsia-500/10 blur-3xl" />

              <div className="relative">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        My tasks
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Saved to your account for today ({todayKey})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500">
                        {doneCount}/{totalCount} done
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold text-slate-200">
                        {totalCount === 0 ? "No tasks" : `${totalCount} tasks`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          value={taskInput}
                          onChange={(e) => setTaskInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTask();
                          }}
                          placeholder="Add a task (e.g. Revise Electrochemistry)…"
                          className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 pl-4 pr-12 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
                        />
                        <button
                          type="button"
                          onClick={addTask}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-cyan-400 p-2 text-slate-950 hover:bg-cyan-300"
                          aria-label="Add task"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => persistTasks(todayTasks.map((t) => ({ ...t, done: true })))}
                        disabled={totalCount === 0 || doneCount === totalCount}
                        className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-emerald-400/40 hover:text-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Mark all done
                      </button>
                    </div>

                    {todayTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 px-4 py-6 text-center">
                        <p className="text-sm font-semibold text-slate-200">
                          Add your first task
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Example: “Solve 30 PYQs” or “Revise Electrochemistry”.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
                        {todayTasks.map((t) => (
                          <div
                            key={t.id}
                            className={`group flex items-start gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
                              t.done
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={t.done}
                              onChange={() => {
                                persistTasks(
                                  todayTasks.map((x) =>
                                    x.id === t.id ? { ...x, done: !x.done } : x
                                  )
                                );
                              }}
                              className="mt-0.5 h-4 w-4 accent-emerald-400"
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm leading-snug ${
                                  t.done
                                    ? "text-slate-400 line-through"
                                    : "text-slate-100"
                                }`}
                              >
                                {t.text}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-500">
                                {t.done ? "Completed" : "Pending"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                persistTasks(todayTasks.filter((x) => x.id !== t.id))
                              }
                              className="rounded-xl border border-slate-800 bg-slate-950/30 p-2 text-slate-400 hover:text-rose-300 hover:border-rose-400/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              aria-label="Remove task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Latest Notes */}
      <section>
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 px-4 sm:px-6 py-5 space-y-4 shadow-[0_18px_45px_rgba(15,23,42,0.85)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-semibold">Latest Notes</h2>
            <Link
              to="/dashboard/notes"
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              View all
            </Link>
          </div>
          {latestLoading && (
            <p className="text-xs md:text-sm text-slate-400">Loading latest bundles…</p>
          )}
          {!latestLoading && latestError && (
            <p className="text-xs md:text-sm text-rose-400">{latestError}</p>
          )}
          {!latestLoading && !latestError && latestBundles.length > 0 && (
            <>
              {/* One row of 5 bundles on large screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                {latestBundles.slice(0, 5).map((bundle) => {
                  const chapterCount = bundle.chapters?.length ?? 0;
                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => onBundleClick(bundle.id)}
                      className="group min-w-0 rounded-2xl bg-slate-950/95 border border-slate-800 hover:border-cyan-400/60 hover:shadow-[0_20px_50px_rgba(15,23,42,0.9),0_0_0_1px_rgba(34,211,238,0.08)] hover:-translate-y-1 transition-all duration-200 text-left flex flex-col overflow-hidden"
                    >
                      {/* Top accent strip */}
                      <div className="h-1 w-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 group-hover:from-cyan-500/40 group-hover:via-slate-600 group-hover:to-cyan-500/40 transition-colors duration-200" />

                      {bundle.thumbnailUrl && (
                        <div className="w-full h-24 lg:h-28 bg-slate-900 overflow-hidden border-b border-slate-800">
                          <img
                            src={bundle.thumbnailUrl}
                            alt={bundle.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="p-3 lg:p-4 flex flex-col gap-2.5 lg:gap-3 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-slate-100">
                            <span className="text-slate-400" aria-hidden>
                              ⚗
                            </span>
                            {bundle.examCode}
                          </span>
                          {chapterCount > 0 && (
                            <span className="text-[10px] text-slate-500">
                              {chapterCount} ch.
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <h3 className="font-semibold text-slate-50 text-sm lg:text-[15px] leading-snug line-clamp-2">
                            {bundle.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {bundle.description}
                          </p>
                        </div>

                        <p className="mt-auto text-[11px] text-slate-500 group-hover:text-cyan-300/90 transition-colors flex items-center gap-1">
                          View PDFs &amp; price
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function BundleDetailSection({ bundle }: { bundle: NoteBundle }) {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // 1–5
  const { pay, loading, error } = useRazorpayPayment();

  useEffect(() => {
    if (bundle.chapters.length > 0) {
      setSelectedChapter(bundle.chapters[0]);
      setCurrentPage(1);
    }
  }, [bundle]);

  const totalChapters = bundle.chapters.length;
  const organicCount = bundle.chapters.filter(
    (ch) => ch.chemistryType === "Organic"
  ).length;
  const inorganicCount = bundle.chapters.filter(
    (ch) => ch.chemistryType === "Inorganic"
  ).length;
  const physicalCount = bundle.chapters.filter(
    (ch) => ch.chemistryType === "Physical"
  ).length;
  const isCbseBundle =
    bundle.examCode.toLowerCase().includes("cbse");

  const handleOpenViewer = () => {
    if (!selectedChapter) return;
    setCurrentPage(1);
    setIsViewerOpen(true);
  };

  const effectiveThumbnail =
    bundle.thumbnailUrl ||
    (selectedChapter && selectedChapter.thumbnailUrl) ||
    undefined;

  const previewUrl =
    selectedChapter?.pdfUrl
      ? `${API_BASE}/notes/preview?pdf_url=${encodeURIComponent(
          selectedChapter.pdfUrl,
        )}&max_pages=5`
      : null;

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Top heading bar */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
            <span className="inline-block h-6 px-3 rounded-full bg-amber-500/10 border border-amber-400/40">
              Bundle
            </span>
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold">
            {bundle.title}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {totalChapters} contents · Preview first 5 pages of each PDF before
            buying.
          </p>
        </div>
      </header>

      <div className="grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Left: components summary + bundle contents list */}
        <section>
          {/* Organic / Inorganic / Physical cards (hide for CBSE bundles) */}
          {!isCbseBundle && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-fuchsia-500/50 bg-fuchsia-500/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-200">
                  Organic
                </p>
                <p className="mt-1 text-2xl font-bold text-fuchsia-50">
                  {organicCount}
                </p>
                <p className="mt-1 text-[11px] text-fuchsia-100/80">
                  Organic chemistry notes in this bundle.
                </p>
              </div>
              <div className="rounded-2xl border border-violet-500/50 bg-violet-500/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">
                  Inorganic
                </p>
                <p className="mt-1 text-2xl font-bold text-violet-50">
                  {inorganicCount}
                </p>
                <p className="mt-1 text-[11px] text-violet-100/80">
                  Inorganic chemistry notes in this bundle.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-500/50 bg-sky-500/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200">
                  Physical
                </p>
                <p className="mt-1 text-2xl font-bold text-sky-50">
                  {physicalCount}
                </p>
                <p className="mt-1 text-[11px] text-sky-100/80">
                  Physical chemistry notes in this bundle.
                </p>
              </div>
            </div>
          )}

          {/* Contents list */}
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-slate-200">
              Bundle Contents
            </h2>
          </div>
          <div className="space-y-4">
            {bundle.chapters.map((chapter) => {
              const isActive = selectedChapter?.id === chapter.id;
              const chapterThumb =
                chapter.thumbnailUrl || bundle.thumbnailUrl || effectiveThumbnail;
              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => {
                    setSelectedChapter(chapter);
                    setCurrentPage(1);
                    setIsViewerOpen(true);
                  }}
                  className={`w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-3xl border px-3 sm:px-4 py-3.5 text-left transition-all ${
                    isActive
                      ? "border-cyan-400/80 bg-slate-900"
                      : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
                  }`}
                >
                  <div className="h-40 sm:h-20 w-full sm:w-36 rounded-2xl bg-slate-900 overflow-hidden flex-shrink-0">
                    {chapterThumb ? (
                      <img
                        src={chapterThumb}
                        alt={chapter.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[11px] text-slate-400">
                        Thumbnail
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-slate-50 truncate">
                      {chapter.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {chapter.pageCount > 0
                        ? `${chapter.pageCount} pages`
                        : "PDF notes"}
                    </p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-1 w-full sm:w-auto">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-900 border border-slate-700 text-slate-200">
                      {chapter.chemistryType}
                    </span>
                    <span className="text-[10px] text-cyan-300">
                      Preview 5 pages
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: bundle summary card */}
        <aside className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
          {effectiveThumbnail && (
            <div className="h-40 w-full bg-slate-950 overflow-hidden">
              <img
                src={effectiveThumbnail}
                alt={bundle.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-4 space-y-3 flex-1 flex flex-col">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Bundle
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                {bundle.title}
              </h2>
              {bundle.description && (
                <p className="text-[11px] text-slate-400">
                  {bundle.description}
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                Includes {totalChapters} PDFs for your chemistry revision.
              </p>
            </div>

            <div className="pt-2 space-y-1">
              <p className="text-xs text-slate-400">Bundle price</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold text-cyan-300">
                  ₹{Number(bundle.priceInRupees).toLocaleString("en-IN")}
                </span>
                {bundle.originalPriceInRupees != null && bundle.originalPriceInRupees > bundle.priceInRupees && (
                  <>
                    <span className="text-sm text-slate-500 line-through">
                      ₹{Number(bundle.originalPriceInRupees).toLocaleString("en-IN")}
                    </span>
                    <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-xs font-semibold">
                      {Math.round((1 - bundle.priceInRupees / bundle.originalPriceInRupees) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-auto pt-3 space-y-2">
              {error && (
                <p className="text-[11px] text-red-400 text-center">{error}</p>
              )}
              <button
                type="button"
                onClick={() => pay(bundle.id, bundle.title)}
                disabled={loading}
                className="w-full py-2.5 rounded-full bg-cyan-400 text-slate-950 text-sm font-semibold hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Opening payment…" : "Buy bundle"}
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                You'll unlock full PDFs (all pages) after purchase.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* PDF preview viewer for first 5 pages */}
      {isViewerOpen && selectedChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center">
          <div
            className="absolute inset-0"
            onClick={() => setIsViewerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-5xl mx-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Preview · Page {currentPage} of 5
                </p>
                <h2 className="text-sm font-semibold text-slate-50 truncate">
                  {selectedChapter.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsViewerOpen(false)}
                className="text-xs px-3 py-1 rounded-full border border-slate-600 text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
              >
                Close
              </button>
            </header>
            <div className="flex-1 min-h-[80vh] bg-slate-950 overflow-hidden">
              {previewUrl ? (
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                  title={selectedChapter.title}
                  className="w-full h-full min-h-[80vh] border-0"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No PDF URL found for this note.
                </div>
              )}
            </div>
          </div>
          {/* Clicking any chapter row opens this viewer */}
          {!selectedChapter.pdfUrl && (
            <></>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileSection({
  profile,
  userEmail,
  avatarUrl,
}: {
  profile: { displayName: string; class: string; appearingYear?: string } | null;
  userEmail: string;
  avatarUrl: string | null;
}) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [weeklyData, setWeeklyData] = useState<WeeklyActivityPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        if (!cancelled) setWeeklyData([]);
        return;
      }
      const data = await fetchWeeklyActivity(user.id);
      if (!cancelled) setWeeklyData(data);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const thisWeek = weeklyData[weeklyData.length - 1];
  const totalQuestions = weeklyData.reduce((s, w) => s + w.questions, 0);
  const totalCorrect = weeklyData.reduce((s, w) => s + w.correct, 0);
  const accuracy =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const displayName = profile?.displayName ?? "";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 flex flex-col items-center">
      {/* User details card - enhanced */}
      <div className="w-full relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 px-4 sm:px-6 md:px-8 py-6 sm:py-7 shadow-[0_24px_60px_rgba(15,23,42,0.6)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl overflow-hidden ring-2 ring-cyan-400/30 ring-offset-2 ring-offset-slate-900 shadow-lg">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-cyan-500/40 to-fuchsia-500/40 flex items-center justify-center text-2xl font-bold text-slate-100">
                  {displayName ? displayName.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-xl font-bold text-slate-50 tracking-tight">
              {displayName || "User"}
            </h2>
            <p className="text-sm text-slate-400 font-mono truncate">{userEmail}</p>
            <div className="flex flex-wrap gap-2">
              {profile?.class && (
                <span className="inline-flex items-center rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/80">
                  {profile.class}
                </span>
              )}
              {profile?.appearingYear && (
                <span className="inline-flex items-center rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300 border border-cyan-400/30">
                  Appearing {profile.appearingYear}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="w-full space-y-2">
        <Link
          to="/dashboard/my-notes"
          className="group flex items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-900/50 px-5 py-4 text-left hover:border-cyan-400/40 hover:bg-slate-900/70 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 group-hover:text-cyan-400 transition-colors">
              <span aria-hidden>🛒</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">View My Purchases</p>
              <p className="text-xs text-slate-500">Your purchased bundles</p>
            </div>
          </div>
          <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">→</span>
        </Link>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="w-full flex items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-900/50 px-5 py-4 text-left hover:border-rose-400/40 hover:bg-slate-900/70 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Sign out</p>
              <p className="text-xs text-slate-500">Sign out of your account</p>
            </div>
          </div>
          <span className="text-slate-500">→</span>
        </button>
      </div>

      {/* Weekly activity - one line */}
      <section className="w-full rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80 px-4 sm:px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">
            My Weekly Activity
          </h3>
          <span className="text-[11px] text-slate-500">
            Last 6 weeks
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[140px] rounded-xl border border-slate-700/60 bg-slate-950/90 px-4 py-4 hover:border-cyan-400/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyan-400 text-lg" aria-hidden>?</span>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Questions solved</p>
            </div>
            <p className="text-2xl font-bold text-slate-50">
              {thisWeek?.questions ?? 0}
            </p>
          </div>
          <div className="flex-1 min-w-[140px] rounded-xl border border-slate-700/60 bg-slate-950/90 px-4 py-4 hover:border-emerald-400/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-lg" aria-hidden>✓</span>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Correct questions</p>
            </div>
            <p className="text-2xl font-bold text-slate-50">
              {thisWeek?.correct ?? 0}
            </p>
          </div>
          <div className="flex-1 min-w-[140px] rounded-xl border border-slate-700/60 bg-slate-950/90 px-4 py-4 hover:border-amber-400/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 text-lg" aria-hidden>◎</span>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">Accuracy</p>
            </div>
            <p className="text-2xl font-bold text-slate-50">{accuracy}%</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function UserDashboardPage() {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { bundleId } = useParams<{ bundleId?: string }>();

  const isProfileRoute = location.pathname === "/dashboard/profile";

  // Try to resolve bundle from mock data first; if not found, fetch full detail
  // (including chapters) from the backend.
  const [bundleFromApi, setBundleFromApi] = useState<NoteBundle | null>(
    bundleId ? getCachedPublicBundleDetail(bundleId) : null
  );
  const allBundles = MOCK_LATEST_BUNDLES;
  const bundleForDetail: NoteBundle | null = bundleId
    ? allBundles.find((bundle) => bundle.id === bundleId) || bundleFromApi
    : null;
  const isBundleDetailRoute = Boolean(bundleId);

  useEffect(() => {
    // If there is a bundleId in URL but it's not in mock data, try fetching from API
    if (!bundleId) {
      setBundleFromApi(null);
      return;
    }
    const existsInMock = MOCK_LATEST_BUNDLES.some((b) => b.id === bundleId);
    if (existsInMock) return;

    const loadBundle = async () => {
      try {
        const bundle = await fetchPublicBundleDetail(bundleId);
        if (!bundle) return;
        setBundleFromApi(bundle);
      } catch {
        // ignore errors for now; dashboard will fallback to "not found"
      }
    };

    void loadBundle();
  }, [bundleId]);

  const displayName =
    profile?.displayName ?? getDisplayNameFallback(user) ?? "";
  const userEmail = user?.email ?? "";

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <p className="text-slate-300">Loading your dashboard…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-4">Please sign in</h1>
        <p className="text-slate-300">
          You need to sign in to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col items-center py-8 shrink-0">
        {/* Logo */}
        <Link to="/dashboard" className="mb-8 block">
          <img
            src={Logo}
            alt="Chemistry by Anand"
            className="h-16 w-auto object-contain"
          />
        </Link>

        {/* Nav links */}
        <nav className="flex flex-col gap-3 w-full px-4">
          <Link
            to="/dashboard"
            className={`text-left px-3 py-2 rounded-lg font-medium ${
              !isProfileRoute && !isBundleDetailRoute
                ? "bg-slate-800 text-cyan-300"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            Home
          </Link>

          <Link
            to="/dashboard/pyq"
            className="px-3 py-2 rounded-lg text-slate-200 font-medium hover:bg-slate-800"
          >
            PYQs
          </Link>
          <Link
            to="/dashboard/notes"
            className="px-3 py-2 rounded-lg text-slate-200 font-medium hover:bg-slate-800"
          >
            Notes
          </Link>

          <Link
            to="/dashboard/my-notes"
            className="px-3 py-2 rounded-lg text-slate-200 font-medium hover:bg-slate-800"
          >
            My notes
          </Link>

          <Link
            to="/dashboard/profile"
            className={`text-left px-3 py-2 rounded-lg font-medium ${
              isProfileRoute
                ? "bg-slate-800 text-cyan-300"
                : "text-slate-200 hover:bg-slate-800"
            }`}
          >
            Profile
          </Link>
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/dashboard" className="block">
            <img
              src={Logo}
              alt="Chemistry by Anand"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <Link
            to="/dashboard/profile"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200"
          >
            Profile
          </Link>
        </div>
        <nav className="mt-3 -mx-1 overflow-x-auto">
          <div className="flex gap-2 px-1 pb-1 min-w-max">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                !isProfileRoute && !isBundleDetailRoute
                  ? "bg-slate-800 text-cyan-300"
                  : "text-slate-200 border border-slate-700"
              }`}
            >
              Home
            </Link>
            <Link to="/dashboard/pyq" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 border border-slate-700">
              PYQs
            </Link>
            <Link to="/dashboard/notes" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 border border-slate-700">
              Notes
            </Link>
            <Link to="/dashboard/my-notes" className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 border border-slate-700">
              My notes
            </Link>
            <Link
              to="/dashboard/profile"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                isProfileRoute
                  ? "bg-slate-800 text-cyan-300"
                  : "text-slate-200 border border-slate-700"
              }`}
            >
              Profile
            </Link>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
        {isBundleDetailRoute ? (
          bundleForDetail ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard/notes")}
                className="text-xs mb-2 inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300"
              >
                ← Back to notes
              </button>
              <BundleDetailSection bundle={bundleForDetail} />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto py-16">
              <p className="text-slate-300 text-sm">Loading bundle…</p>
            </div>
          )
        ) : (
          <>
            {!isProfileRoute && (
              <DashboardHome
                displayName={displayName}
                onBundleClick={(id) => navigate(`/dashboard/bundles/${id}`)}
              />
            )}
            {isProfileRoute && (
              <div className="w-full flex justify-center">
                <ProfileSection
                  profile={profile}
                  userEmail={userEmail}
                  avatarUrl={getAvatarUrl(user)}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}