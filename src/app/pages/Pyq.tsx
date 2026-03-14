// src/app/pages/Pyq.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  PlusCircle,
  ChevronRight,
  Check,
  Star,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Flag,
  BarChart2,
  Target,
  XCircle,
  Minus,
  Rocket,
  BookOpen,
} from "lucide-react";
import { DashboardMiniSidebar } from "../components/DashboardMiniSidebar";
import {
  listPersonalTestsForUser,
  savePersonalTestToDb,
  getPersonalTestById,
  numericAnswersEqual,
  type StoredPersonalTestResult,
} from "../api/personalTestApi";
import {
  getExamBank,
  getChaptersFromExams,
  sampleQuestions as sampleQuestionsApi,
  type PyqQuestion,
  type ExamBank,
  type ChapterInfo,
  type ChemistryType,
} from "../api/pyqApi";
import { logQuestionAttempt, incrementPersonalTestsCompleted } from "../api/analyticsApi";
import { useAuth } from "../context/AuthContext";
import NeetLogo from "../../assests/neet.jpg";
import JeeMainLogo from "../../assests/JEE(mains).png";
import JeeAdvancedLogo from "../../assests/Jee-advanced.jpg";
import CbseLogo from "../../assests/CBSE.svg";
import CorrectSound from "../../assests/correct.mp3";
import WrongSound from "../../assests/wrong.mp3";

class PyqErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center px-6">
          <div className="max-w-xl w-full rounded-2xl border border-rose-500/40 bg-slate-900/60 p-5 space-y-2">
            <p className="text-rose-300 font-semibold text-sm">PYQ page crashed</p>
            <p className="text-slate-200 text-sm break-words">
              {this.state.error.message || String(this.state.error)}
            </p>
            <p className="text-slate-400 text-xs">
              Reload the page. If it repeats, copy the error text above.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type ExamId = "jee-main" | "jee-advanced" | "neet" | "cbse";

type Exam = { id: ExamId; name: string; code: string };

const EXAMS: Exam[] = [
  { id: "jee-main", name: "JEE Main", code: "JEE MAIN" },
  { id: "jee-advanced", name: "JEE Advanced", code: "JEE ADVANCED" },
  { id: "neet", name: "NEET", code: "NEET" },
  { id: "cbse", name: "CBSE", code: "CBSE" },
];

function getExamLogo(examId: ExamId) {
  switch (examId) {
    case "neet":
      return NeetLogo;
    case "jee-main":
      return JeeMainLogo;
    case "jee-advanced":
      return JeeAdvancedLogo;
    case "cbse":
      return CbseLogo;
  }
}

// Fallback for questions with no chapter (chapter_id was null on upload)
const UNCATEGORIZED_DISPLAY = "Uncategorized";
const UNCATEGORIZED_SLUG = "uncategorized";

function chapterToSlug(chapter: string): string {
  if (!chapter || !chapter.trim()) return UNCATEGORIZED_SLUG;
  return chapter.toLowerCase().replace(/\s+/g, "-");
}

function chapterDisplayName(chapter: string): string {
  if (!chapter || !chapter.trim()) return UNCATEGORIZED_DISPLAY;
  return chapter;
}

function slugToChapter(slug: string, chapters: string[]): string | null {
  if (slug === UNCATEGORIZED_SLUG && chapters.some((ch) => !ch || !ch.trim())) {
    return ""; // map uncategorized slug back to empty chapter
  }
  const match = chapters.find((ch) => chapterToSlug(ch) === slug);
  return match ?? null;
}

// For CBSE, older data may have chapter names like "Chemistry — Testing".
// This helper strips a leading "Chemistry / Physics / Maths —" prefix for display/slug only.
function normalizeCbseChapterName(raw: string, subjectSlug: string | undefined): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  const subjectTitle =
    subjectSlug && subjectSlug.length
      ? subjectSlug.charAt(0).toUpperCase() + subjectSlug.slice(1).toLowerCase()
      : null;
  const candidates = ["Chemistry", "Physics", "Maths", "Math"];
  if (subjectTitle && !candidates.includes(subjectTitle)) {
    candidates.push(subjectTitle);
  }
  let result = trimmed;
  for (const base of candidates) {
    const patterns = [`${base} — `, `${base} - `, `${base}– `, `${base} —`, `${base}-`];
    for (const p of patterns) {
      if (result.startsWith(p)) {
        result = result.slice(p.length).trim();
        break;
      }
    }
  }
  return result;
}

type AttemptStatus = "unattempted" | "correct" | "wrong";

type SolvedTodayStore = {
  date: string; // YYYY-MM-DD
  solvedIds: string[];
};

function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function incrementSolvedToday(questionId: string) {
  if (typeof window === "undefined") return;
  try {
    const today = getTodayKey();
    const raw = window.localStorage.getItem("pyq_solved_today_v1");
    const parsed: SolvedTodayStore = raw
      ? (JSON.parse(raw) as SolvedTodayStore)
      : { date: today, solvedIds: [] };

    // Reset automatically when day changes
    const normalized: SolvedTodayStore =
      parsed.date === today ? parsed : { date: today, solvedIds: [] };

    if (!normalized.solvedIds.includes(questionId)) {
      normalized.solvedIds = [...normalized.solvedIds, questionId];
      window.localStorage.setItem(
        "pyq_solved_today_v1",
        JSON.stringify(normalized)
      );
      window.dispatchEvent(new CustomEvent("pyq-solved-today-updated"));
    }
  } catch {
    // ignore storage errors
  }
}

function getStoredAttemptStatus(questionId: string): AttemptStatus {
  if (typeof window === "undefined") return "unattempted";
  try {
    const raw = window.localStorage.getItem("pyq_attempts_v1");
    if (!raw) return "unattempted";
    const parsed = JSON.parse(raw) as Record<string, AttemptStatus>;
    const status = parsed[questionId];
    return status ?? "unattempted";
  } catch {
    return "unattempted";
  }
}

function setStoredAttemptStatus(questionId: string, status: AttemptStatus) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("pyq_attempts_v1");
    const parsed: Record<string, AttemptStatus> = raw ? JSON.parse(raw) : {};
    parsed[questionId] = status;
    window.localStorage.setItem("pyq_attempts_v1", JSON.stringify(parsed));
    window.dispatchEvent(new CustomEvent("pyq-attempt-updated"));
  } catch {
    // ignore storage errors
  }
}

// Load exam bank from Supabase (exams, chapters, questions)
function useExamBank(examId: string | undefined) {
  const location = useLocation();
  const [bank, setBank] = useState<ExamBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const fetchBank = useCallback(() => {
    if (!examId) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    getExamBank(examId)
      .then((data) => {
        // If there is no data yet for this exam (e.g. CBSE not set up),
        // treat it as an empty bank instead of an error so the UI can still render.
        if (!data) {
          setBank(null);
          setError(null);
        } else {
          setBank(data);
          setError(null);
        }
      })
      .catch((e) => {
        setBank(null);
        setError(e?.message ?? "Failed to load questions.");
      })
      .finally(() => {
        inFlightRef.current = false;
        setLoading(false);
      });
  }, [examId]);

  useEffect(() => {
    if (!examId) {
      setBank(null);
      setLoading(false);
      setError(null);
      return;
    }
    fetchBank();
  }, [examId]);

  // Refetch when user returns to the tab/window so clearing DB rows shows fresh data
  useEffect(() => {
    if (!examId) return;
    const onFocus = () => fetchBank();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [examId, fetchBank]);

  // Refetch when a PYQ upload completes (e.g. from Admin) so list updates without leaving the tab
  useEffect(() => {
    if (!examId) return;
    const onPyqUploaded = () => fetchBank();
    window.addEventListener("pyq-uploaded", onPyqUploaded);
    return () => window.removeEventListener("pyq-uploaded", onPyqUploaded);
  }, [examId, fetchBank]);

  // Refetch when user navigates to any PYQ page (e.g. after clearing DB or uploading from Admin)
  useEffect(() => {
    if (!examId) return;
    if (location.pathname.startsWith("/dashboard/pyq")) fetchBank();
  }, [location.pathname, examId, fetchBank]);

  return { bank, loading, error, refetch: fetchBank };
}

// PAGE 1: Select Exam
export function PyqExamPage() {
  const navigate = useNavigate();
  const [pastTests, setPastTests] = useState<StoredPersonalTestResult[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function loadTests() {
      if (!user) {
        if (!cancelled) setPastTests([]);
        return;
      }
      const rows = await listPersonalTestsForUser(user.id);
      if (!cancelled) setPastTests(rows);
    }
    void loadTests();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-8 py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-6 py-6 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
              <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1">
                PYQ Practice
              </span>
              <span className="text-slate-400 normal-case">
                Real exam questions, organized by chapter
              </span>
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              Previous Year Questions
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Practice with past JEE, NEET and CBSE papers. Choose your exam and
              chemistry branch, pick a chapter, and attempt questions with
              detailed solutions—then review your attempts anytime.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Select your exam</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 max-w-4xl">
              {EXAMS.map((exam) => {
              const logo = getExamLogo(exam.id);
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/pyq/${exam.id}`)}
                  className="relative min-w-[240px] rounded-[1.6rem] border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-left transition-all hover:border-cyan-400/80 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(8,47,73,0.9)] overflow-hidden"
                >
                  {/* subtle chemistry glow */}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
                  <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-fuchsia-500/10 blur-2xl" />

                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center">
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${exam.name} logo`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-slate-200">
                          {exam.code}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">
                        Exam
                      </p>
                      <p className="text-sm font-semibold text-slate-50 flex items-center gap-1">
                        {exam.name}
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-[9px] text-cyan-300 border border-cyan-500/40">
                          ⚗
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Practice chapter-wise {exam.name} PYQs for{" "}
                    <span className="text-cyan-300">Organic</span>,{" "}
                    <span className="text-violet-300">Inorganic</span> &amp;{" "}
                    <span className="text-sky-300">Physical</span> chemistry.
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 border border-slate-700/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Smart filtering
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 border border-slate-700/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      Latest → oldest
                    </span>
                  </div>
                </button>
              );
              })}
            </div>
          </section>

          {/* Previously Given Tests */}
          {pastTests.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Previously Given Tests</h2>
              <div className="space-y-3">
                {pastTests.map((test) => {
                  const correctCount = Object.entries(test.responses).filter(
                    ([idx, ans]) => test.questions[Number(idx)]?.correctIndex === ans
                  ).length;
                  const attemptedCount = Object.keys(test.responses).length;
                  const score = correctCount * 4 - (attemptedCount - correctCount);
                  const date = new Date(test.completedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={test.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4 hover:border-slate-700"
                    >
                      <div>
                        <p className="font-medium text-slate-100">{test.examName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {date} · {test.questions.length} questions · Score: {score}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/dashboard/pyq/personal-test/review/${test.id}`)
                        }
                        className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20"
                      >
                        Review
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Create Personal test */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Or create a Personal test
            </h2>
            <button
              type="button"
              onClick={() => navigate("/dashboard/pyq/personal-test")}
              className="group w-full max-w-4xl rounded-[1.6rem] border-2 border-dashed border-slate-600/80 bg-slate-900/40 px-6 py-5 text-left transition-all hover:border-cyan-400/60 hover:bg-slate-900/70 hover:shadow-[0_12px_35px_rgba(8,47,73,0.4)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-500/25 transition-colors">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-50 group-hover:text-cyan-200 transition-colors">
                    Create a Personal test
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Build a custom test by selecting chapters, chemistry types, and number of questions from the PYQ bank.
                  </p>
                </div>
                <span className="text-slate-500 group-hover:text-cyan-400 transition-colors text-sm font-medium">
                  Configure →
                </span>
              </div>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

// Personal Test types
export type PersonalTestConfig = {
  examIds: ExamId[];
  questionCount: number;
  timeMinutes: number;
  selectedChapters: string[];
  examName: string;
};

export type PersonalTestAttemptState = {
  questions: PyqQuestion[];
  timeMinutes: number;
  examNames: string[];
  examName: string;
};

// Sample questions from DB (used by personal test)
async function sampleQuestionsFromApi(
  examIds: ExamId[],
  chapterNames: string[],
  count: number
): Promise<PyqQuestion[]> {
  return sampleQuestionsApi(examIds, chapterNames, count);
}

// PAGE: Create Personal Test - Step 1 (exams, count, time)
export function PyqPersonalTestPage() {
  const navigate = useNavigate();
  const [examIds, setExamIds] = useState<ExamId[]>([]);
  const [examName, setExamName] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [timeMinutes, setTimeMinutes] = useState(30);

  const toggleExam = (id: ExamId) => {
    setExamIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (examIds.length === 0) return;
    const config: PersonalTestConfig = {
      examIds,
      questionCount,
      timeMinutes,
      selectedChapters: [],
      examName: examName.trim() || `Personal Test ${new Date().toLocaleDateString()}`,
    };
    navigate("/dashboard/pyq/personal-test/chapters", { state: { config } });
  };

  return (
    <div className="relative min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* Soft background orbits */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <DashboardMiniSidebar />

      <main className="relative z-10 flex-1 px-4 sm:px-8 py-8 sm:py-10 flex justify-center overflow-auto">
        <div className="w-full max-w-5xl space-y-8">
          <header className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/70 px-6 py-6 sm:px-8 sm:py-7 shadow-[0_24px_80px_rgba(15,23,42,0.9)]">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-sky-500/15 blur-2xl" />
            </div>

            <div className="relative space-y-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard/pyq")}
                className="inline-flex items-center text-[11px] text-slate-400 hover:text-cyan-300"
              >
                <span className="mr-1.5">←</span>
                Back to PYQ
              </button>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-cyan-300 border border-cyan-500/30 mb-2">
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Step 1 of 2 · Configure your personal test
                  </p>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Design your perfect Chemistry test
                  </h1>
                  <p className="mt-2 text-slate-300 text-sm md:text-base max-w-2xl">
                    Blend NEET, JEE Main, JEE Advanced or CBSE PYQs into one beautiful mock paper
                    with your own name, length and timing.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-2">
                    <p className="text-slate-400">Questions</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-300">
                      {questionCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 py-2">
                    <p className="text-slate-400">Time Limit</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">
                      {timeMinutes} min
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
            <div className="space-y-6">
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-5">
                <h2 className="text-lg font-semibold">Name your exam</h2>
                <p className="text-slate-400 text-sm">
                  Set a title that will appear on your analysis later, like{" "}
                  <span className="text-cyan-300">&quot;JEE Main Mock 1&quot;</span>. This is optional.
                </p>
                <input
                  type="text"
                  placeholder="e.g. JEE Main Mock 1"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/60 outline-none"
                />
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">Select exams</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Mix and match PYQs from multiple exams to create a single powerful mock.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
                    {examIds.length || "No"} exam{examIds.length === 1 ? "" : "s"} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {EXAMS.map((exam) => {
                    const logo = getExamLogo(exam.id);
                    const isSelected = examIds.includes(exam.id);
                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => toggleExam(exam.id)}
                        className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all ${
                          isSelected
                            ? "border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_30px_rgba(34,211,238,0.32)]"
                            : "border-slate-700/80 bg-slate-900/80 hover:border-slate-500 hover:bg-slate-900"
                        }`}
                      >
                        {logo && (
                          <div className="relative">
                            <div className="absolute inset-0 rounded-xl bg-cyan-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            <img
                              src={logo}
                              alt=""
                              className="relative h-8 w-8 rounded-xl object-contain"
                            />
                          </div>
                        )}
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{exam.name}</span>
                          <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
                            {exam.code}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="ml-auto inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/50">
                            <Check className="mr-1 h-3 w-3" />
                            Added
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-5">
                <h2 className="text-lg font-semibold">Test blueprint</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">Number of questions</p>
                      <p className="text-xs text-slate-400">
                        Recommended: <span className="text-emerald-300">45–75</span> for full mock.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={questionCount}
                        onChange={(e) =>
                          setQuestionCount(
                            Math.max(5, Math.min(100, Number(e.target.value) || 5))
                          )
                        }
                        className="hidden sm:block w-32 accent-cyan-400"
                      />
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={questionCount}
                        onChange={(e) =>
                          setQuestionCount(
                            Math.max(5, Math.min(100, Number(e.target.value) || 5))
                          )
                        }
                        className="w-20 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">Time limit</p>
                      <p className="text-xs text-slate-400">
                        Pick a duration that feels exam-like but manageable.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={180}
                        value={timeMinutes}
                        onChange={(e) =>
                          setTimeMinutes(
                            Math.max(5, Math.min(180, Number(e.target.value) || 5))
                          )
                        }
                        className="hidden sm:block w-32 accent-emerald-400"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={5}
                          max={180}
                          value={timeMinutes}
                          onChange={(e) =>
                            setTimeMinutes(
                              Math.max(5, Math.min(180, Number(e.target.value) || 5))
                            )
                          }
                          className="w-20 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                        />
                        <span className="text-xs text-slate-400">min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2">
                    <p className="text-slate-400">Estimated duration</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {timeMinutes} minutes
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2">
                    <p className="text-slate-400">Max marks</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">
                      {questionCount * 4} marks
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={examIds.length === 0}
                className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_20px_45px_rgba(34,211,238,0.35)] transition-all hover:shadow-[0_26px_65px_rgba(34,211,238,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  Next: Select chapters
                  {examIds.length > 0 && ` (${examIds.length} exam${examIds.length === 1 ? "" : "s"})`}
                </span>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>

              <p className="text-[11px] text-center text-slate-500">
                Your test runs completely in your browser. You can always tweak these settings again
                if you change your mind in Step 2.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// PAGE: Create Personal Test - Step 2 (chapters)
export function PyqPersonalTestChaptersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = (location.state as { config?: PersonalTestConfig })?.config;

  const [selectedChapters, setSelectedChapters] = useState<string[]>(
    config?.selectedChapters ?? []
  );
  const [availableChapters, setAvailableChapters] = useState<ChapterInfo[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  const [startingTest, setStartingTest] = useState(false);

  useEffect(() => {
    if (!config?.examIds?.length) {
      setChaptersLoading(false);
      return;
    }
    let cancelled = false;
    setChaptersLoading(true);
    setChaptersError(null);
    getChaptersFromExams(config.examIds)
      .then((list) => {
        if (!cancelled) {
          setAvailableChapters(list);
          setChaptersError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setChaptersError(err?.message ?? "Failed to load chapters");
          setAvailableChapters([]);
        }
      })
      .finally(() => {
        if (!cancelled) setChaptersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config?.examIds?.join(",")]);

  useEffect(() => {
    if (!config) {
      navigate("/dashboard/pyq/personal-test", { replace: true });
    }
  }, [config, navigate]);

  const chapterNames = useMemo(
    () => availableChapters.map((c) => c.name),
    [availableChapters]
  );

  const toggleChapter = (ch: string) => {
    setSelectedChapters((prev) => {
      if (prev.length === 0) {
        return chapterNames.filter((c) => c !== ch);
      }
      return prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch];
    });
  };

  const selectAll = () => {
    setSelectedChapters(chapterNames);
  };

  const handleStartTest = async () => {
    if (!config) return;
    const chapters =
      selectedChapters.length > 0 ? selectedChapters : chapterNames;
    setStartingTest(true);
    try {
      const questions = await sampleQuestionsFromApi(
        config.examIds,
        chapters,
        config.questionCount
      );
      const examNames = config.examIds
        .map((id) => EXAMS.find((e) => e.id === id)?.name ?? id)
        .filter(Boolean);
      navigate("/dashboard/pyq/personal-test/attempt", {
        state: {
          questions,
          timeMinutes: config.timeMinutes,
          examNames,
          examName: config.examName ?? examNames.join(" + "),
        } as PersonalTestAttemptState,
      });
    } catch (err) {
      setStartingTest(false);
      setChaptersError(err?.message ?? "Failed to start test");
    }
  };

  if (!config) return null;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-8 py-10 flex justify-center overflow-auto">
        <div className="w-full max-w-5xl space-y-8">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-6 py-6 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
            <button
              type="button"
              onClick={() => navigate("/dashboard/pyq/personal-test")}
              className="text-[11px] text-slate-400 hover:text-cyan-300"
            >
              ← Back
            </button>
            <h1 className="text-3xl md:text-4xl font-bold">
              Select chapters
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Step 2: Choose chapters to include. Questions will be drawn from selected chapters only. Leave all selected to include every chapter.
            </p>
            <p className="text-sm text-slate-400">
              {config.questionCount} questions · {config.timeMinutes} min ·{" "}
              {config.examIds.map((id) => EXAMS.find((e) => e.id === id)?.name).join(", ")}
            </p>
          </header>

          {chaptersError && (
            <p className="text-sm text-red-400">{chaptersError}</p>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Chapters</h2>
              {!chaptersLoading && availableChapters.length > 0 && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Select all
                </button>
              )}
            </div>
            {chaptersLoading ? (
              <p className="text-slate-400 text-sm">Loading chapters…</p>
            ) : availableChapters.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No chapters found for the selected exams. Upload PYQs from the admin panel first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableChapters.map((ch) => {
                  const isSelected =
                    selectedChapters.length === 0 || selectedChapters.includes(ch.name);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChapter(ch.name)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                          : "border-slate-700 bg-slate-900/80 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {ch.name}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => void handleStartTest()}
            disabled={chaptersLoading || startingTest || availableChapters.length === 0}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startingTest ? "Starting test…" : "Start test"}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </main>
    </div>
  );
}

// Question status for exam dashboard
type QuestionStatus = "not_seen" | "seen" | "marked" | "attempted" | "attempted_marked";

// PAGE: Personal Test Attempt - Full exam dashboard
export function PyqPersonalTestAttemptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as PersonalTestAttemptState) ?? {};
  const { user } = useAuth();

  const questions = state.questions ?? [];
  const timeMinutes = state.timeMinutes ?? 30;
  const examNames = state.examNames ?? ["Personal Test"];
  const examName = state.examName ?? examNames.join(" + ");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, number | string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [seenIndices, setSeenIndices] = useState<Set<number>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(timeMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Mark current as seen
  useEffect(() => {
    if (currentQuestion) {
      setSeenIndices((prev) => new Set([...prev, currentIndex]));
    }
  }, [currentIndex, currentQuestion]);

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    setIsSubmitted(true);
    const elapsedSeconds = timeMinutes * 60 - remainingSeconds;
    if (!user) {
      return;
    }

    const resultId = await savePersonalTestToDb({
      userId: user.id,
      examName,
      timeMinutes,
      elapsedSeconds,
      questions,
      responses,
      markedForReview: Array.from(markedForReview),
    });

    void incrementPersonalTestsCompleted({
      userId: user.id,
      timeMinutes,
    });

    navigate(`/dashboard/pyq/personal-test/review/${resultId}`);
  };

  // Countdown timer - auto-submit when time runs out
  useEffect(() => {
    if (isSubmitted || questions.length === 0) return;
    if (remainingSeconds <= 0) {
      handleConfirmSubmit();
      return;
    }
    const id = window.setInterval(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [remainingSeconds, isSubmitted, questions.length]);

  const answerType = currentQuestion?.answerType ?? "MCQ";
  const isNumericQuestion = answerType === "NUMERIC";

  const getStatus = (idx: number): QuestionStatus => {
    const raw = responses[idx];
    const attempted =
      raw !== undefined &&
      raw !== null &&
      (typeof raw === "string" ? raw.trim() !== "" : true);
    const marked = markedForReview.has(idx);
    const seen = seenIndices.has(idx);
    if (attempted && marked) return "attempted_marked";
    if (attempted) return "attempted";
    if (marked) return "marked";
    if (seen) return "seen";
    return "not_seen";
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  const clearResponse = () => {
    setResponses((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
  };

  const handleSubmitClick = () => setShowSubmitModal(true);

  if (!state.questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-300">No test data. Please create a personal test first.</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/pyq/personal-test")}
            className="text-cyan-400 underline"
          >
            Create Personal Test
          </button>
        </div>
      </div>
    );
  }

  const totalMins = Math.floor(remainingSeconds / 60);
  const totalSecs = remainingSeconds % 60;
  const timerStr = `${String(totalMins).padStart(2, "0")}:${String(totalSecs).padStart(2, "0")}`;

  const attemptedCount = Object.keys(responses).length;
  const notAttemptedCount = questions.length - attemptedCount;
  const markedCount = markedForReview.size;
  const maxMarks = questions.length * 4;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - blue bar style */}
        <header className="shrink-0 bg-slate-800/90 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/pyq")}
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white">
                {examName}
              </h1>
              <p className="text-xs text-slate-400">
                {questions.length} questions · MCQ &amp; Integer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-bold text-cyan-300">
              {timerStr}
            </span>
            <span className="text-xs text-slate-400">remaining</span>
          </div>
        </header>

        {/* Main content: left = question, right = status panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left: Question and options */}
          <main className="flex-1 overflow-auto px-6 py-6">
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400">
                  +4 -1 · Question {currentIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMarkForReview}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                      markedForReview.has(currentIndex)
                        ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40"
                        : "border border-slate-600 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Star className="h-3.5 w-3.5" />
                    {markedForReview.has(currentIndex) ? "Marked" : "Mark for review"}
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-2">
                {currentQuestion.chapter} · {currentQuestion.chemistryType}
              </p>
              <p className="text-lg text-slate-100 leading-relaxed mb-6">
                {currentQuestion.stem}
              </p>

              {isNumericQuestion ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Enter your answer (integer / numerical value)</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.-]*"
                    value={typeof responses[currentIndex] === "string" ? responses[currentIndex] : ""}
                    onChange={(e) =>
                      setResponses((prev) => ({ ...prev, [currentIndex]: e.target.value }))
                    }
                    placeholder="Enter your answer"
                    className="w-full max-w-xs rounded-xl px-4 py-3 text-slate-100 bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              ) : (
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = responses[currentIndex] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setResponses((prev) => ({ ...prev, [currentIndex]: idx }))
                      }
                      className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/15"
                          : "border-slate-700 bg-slate-900/80 hover:border-slate-600"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          isSelected
                            ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/60"
                            : "bg-slate-800 text-slate-300 border border-slate-600"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-slate-100">{opt && opt.trim() ? opt : "—"}</span>
                    </button>
                  );
                })}
              </div>
              )}
            </div>
          </main>

          {/* Right: Question status panel */}
          <aside className="w-72 shrink-0 border-l border-slate-700 bg-slate-900/50 overflow-auto">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-600" />
                  <span className="text-slate-400">Attempted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-fuchsia-600" />
                  <span className="text-slate-400">Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-fuchsia-600" />
                    <span className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-slate-400">Attempted & Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-600" />
                  <span className="text-slate-400">Seen</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-slate-600" />
                  <span className="text-slate-400">Not Seen</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-300 mb-2">
                  Questions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {questions.map((_, idx) => {
                    const status = getStatus(idx);
                    const isCurrent = idx === currentIndex;
                    let btnClass = "bg-slate-600";
                    if (status === "attempted") btnClass = "bg-emerald-600";
                    else if (status === "attempted_marked") btnClass = "bg-fuchsia-600 relative overflow-visible";
                    else if (status === "marked") btnClass = "bg-fuchsia-600";
                    else if (status === "seen") btnClass = "bg-rose-600";
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${btnClass} ${
                          isCurrent ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900" : ""
                        } text-white`}
                      >
                        <span className="relative flex h-full w-full items-center justify-center">
                          {idx + 1}
                          {status === "attempted_marked" && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-slate-900 bg-emerald-400" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-700 bg-slate-900/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearResponse}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
            >
              Clear Response
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={currentIndex === questions.length - 1}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
            >
              Next
              <ArrowRight className="h-4 w-4 inline ml-1" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmitClick}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Submit Test
          </button>
        </footer>

        {/* Ready to Submit? Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20">
                  <Clock className="h-7 w-7 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Ready to Submit?</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Review your test summary below.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                <div className="rounded-xl border border-slate-700 bg-rose-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Time Remaining</span>
                  </div>
                  <p className="mt-1 font-mono text-lg font-bold text-white">
                    {timerStr}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-emerald-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Attempted</span>
                  </div>
                  <p className="mt-1 font-mono text-lg font-bold text-white">
                    {attemptedCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-700/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Minus className="h-4 w-4" />
                    <span className="text-xs font-medium">Not Attempted</span>
                  </div>
                  <p className="mt-1 font-mono text-lg font-bold text-white">
                    {notAttemptedCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-amber-500/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Flag className="h-4 w-4" />
                    <span className="text-xs font-medium">Marked</span>
                  </div>
                  <p className="mt-1 font-mono text-lg font-bold text-white">
                    {markedCount}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-700 px-6 py-4">
                <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-800/80 px-4 py-2">
                  <span className="flex items-center gap-2 text-slate-400">
                    <BarChart2 className="h-4 w-4" />
                    Max Marks
                  </span>
                  <span className="font-semibold text-white">
                    {maxMarks} marks
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    className="flex-1 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                  >
                    Submit Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// PAGE: Personal Test Review / Analysis
export function PyqPersonalTestReviewPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<StoredPersonalTestResult | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!resultId || !user) {
        if (!cancelled) setResult(null);
        return;
      }
      const row = await getPersonalTestById(user.id, resultId);
      if (!cancelled) setResult(row);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [resultId, user]);

  if (!result) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50">
        <main className="flex-1 px-8 py-10 flex justify-center">
          <div className="text-center space-y-4">
            <p className="text-slate-300">Result not found.</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/pyq")}
              className="text-cyan-400 underline"
            >
              Back to PYQ
            </button>
          </div>
        </main>
      </div>
    );
  }

  const correctCount = Object.entries(result.responses).filter(
    ([idx, ans]) => {
      const q = result.questions[Number(idx)];
      if (!q) return false;
      if (q.answerType === "NUMERIC") {
        return numericAnswersEqual(ans, q.correctAnswer);
      }
      return q.correctIndex === ans;
    }
  ).length;
  const wrongCount = Object.keys(result.responses).length - correctCount;
  const skippedCount = result.questions.length - Object.keys(result.responses).length;
  const totalMarks = result.questions.length * 4;
  const score = correctCount * 4 - wrongCount;
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  const accuracy =
    Object.keys(result.responses).length > 0
      ? (correctCount / Object.keys(result.responses).length) * 100
      : 0;
  const timeTaken = `${Math.floor(result.elapsedSeconds / 60)}:${String(result.elapsedSeconds % 60).padStart(2, "0")}`;
  const completedDate = new Date(result.completedAt).toLocaleString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getQuestionStatus = (idx: number) => {
    const userAns = result.responses[String(idx)];
    const q = result.questions[idx];
    if (!q) return "skipped";
    if (userAns === undefined) return "skipped";
    if (q.answerType === "NUMERIC") {
      return numericAnswersEqual(userAns, q.correctAnswer) ? "correct" : "wrong";
    }
    return userAns === q.correctIndex ? "correct" : "wrong";
  };

  // Question-by-question review mode
  if (reviewMode) {
    const currentQ = result.questions[reviewIndex];
    const userAns = currentQ
      ? result.responses[String(reviewIndex)]
      : undefined;
    const isNumericReview = currentQ?.answerType === "NUMERIC";
    const isCorrect = currentQ && userAns !== undefined && (
      isNumericReview
        ? numericAnswersEqual(userAns, currentQ.correctAnswer)
        : userAns === currentQ.correctIndex
    );
    const isWrong = currentQ && userAns !== undefined && !isCorrect;

    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="shrink-0 border-b border-slate-700 bg-slate-800/90 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setReviewMode(false)}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-sm font-semibold text-white">
                  Review: {result.examName}
                </h1>
                <p className="text-xs text-slate-400">
                  Question {reviewIndex + 1} of {result.questions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCorrect && (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                  Correct
                </span>
              )}
              {isWrong && (
                <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300">
                  Wrong
                </span>
              )}
              {userAns === undefined && (
                <span className="rounded-full bg-slate-600/50 px-3 py-1 text-xs font-medium text-slate-400">
                  Skipped
                </span>
              )}
            </div>
          </header>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <main className="flex-1 overflow-auto px-6 py-6">
              <div className="max-w-3xl mx-auto">
                {currentQ && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
                    <p className="text-sm text-slate-400 mb-2">
                      {currentQ.chapter} · {currentQ.chemistryType}
                    </p>
                    <p className="text-lg text-slate-100 leading-relaxed mb-6">
                      {currentQ.stem}
                    </p>

                    {currentQ.answerType === "NUMERIC" ? (
                      <div className="space-y-3 mb-6">
                        <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3">
                          <p className="text-xs text-slate-400 mb-1">Your answer</p>
                          <p className="text-slate-100 font-medium">
                            {userAns !== undefined && userAns !== "" ? String(userAns) : "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-3">
                          <p className="text-xs text-emerald-300/80 mb-1">Correct answer</p>
                          <p className="text-emerald-100 font-medium">
                            {currentQ.correctAnswer ?? "—"}
                          </p>
                        </div>
                      </div>
                    ) : (
                    <div className="space-y-3 mb-6">
                      {currentQ.options.map((opt, idx) => {
                        const isCorrectOpt = idx === currentQ.correctIndex;
                        const isUserChoice = userAns === idx;
                        let optClass =
                          "w-full flex items-center gap-4 rounded-xl border px-4 py-3 text-left";
                        if (isCorrectOpt) {
                          optClass += " border-emerald-500/60 bg-emerald-500/15";
                        } else if (isUserChoice && isWrong) {
                          optClass += " border-rose-500/60 bg-rose-500/15";
                        } else {
                          optClass += " border-slate-700 bg-slate-900/80 text-slate-400";
                        }
                        return (
                          <div key={idx} className={optClass}>
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                isCorrectOpt
                                  ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/60"
                                  : isUserChoice && isWrong
                                  ? "bg-rose-500/30 text-rose-200 border border-rose-400/60"
                                  : "bg-slate-800 text-slate-400 border border-slate-600"
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-slate-100">{opt && opt.trim() ? opt : "—"}</span>
                            {isCorrectOpt && (
                              <span className="ml-auto text-xs font-medium text-emerald-300">
                                Correct answer
                              </span>
                            )}
                            {isUserChoice && isWrong && (
                              <span className="ml-auto text-xs font-medium text-rose-300">
                                Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    )}

                    <div className="rounded-xl border border-emerald-500/40 bg-slate-950/80 p-4 space-y-2">
                      <p className="font-semibold mb-2 text-emerald-300">
                        Solution
                      </p>
                      {currentQ.solution && (
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {currentQ.solution}
                        </p>
                      )}
                      {(currentQ as PyqQuestion).solutionImageUrls?.length ? (
                        <div className="flex flex-col gap-2 mt-2">
                          {(currentQ as PyqQuestion).solutionImageUrls!.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Solution ${i + 1}`}
                              className="max-w-full rounded-lg border border-slate-700"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </main>

            <aside className="w-64 shrink-0 border-l border-slate-700 bg-slate-900/50 overflow-auto p-4">
              <p className="text-xs font-semibold text-slate-300 mb-3">
                Questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.questions.map((_, idx) => {
                  const status = getQuestionStatus(idx);
                  const isCurrent = idx === reviewIndex;
                  let bg = "bg-slate-600";
                  if (status === "correct") bg = "bg-emerald-600";
                  else if (status === "wrong") bg = "bg-rose-600";
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReviewIndex(idx)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium ${bg} ${
                        isCurrent ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900" : ""
                      } text-white`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>

          <footer className="shrink-0 border-t border-slate-700 bg-slate-900/80 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
              disabled={reviewIndex === 0}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setReviewIndex((i) =>
                  Math.min(result.questions.length - 1, i + 1)
                )
              }
              disabled={reviewIndex === result.questions.length - 1}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
            >
              Next
              <ArrowRight className="h-4 w-4 inline ml-1" />
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-6 py-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/50 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{result.examName}</h1>
              <p className="text-sm text-slate-400 mt-0.5">{completedDate}</p>
            </div>
            <span className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
              Personal Test
            </span>
          </div>

          {/* Performance cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Your Performance */}
            <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                <BarChart2 className="h-5 w-5 text-cyan-400" />
                Your Performance
              </h2>
              <div className="text-center">
                <p className="text-4xl font-bold text-cyan-300">{score.toFixed(2)}</p>
                <div className="mt-2 h-3 w-24 mx-auto rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {percentage.toFixed(1)}% out of {totalMarks.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">Total Score</p>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/pyq/personal-test")}
                  className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-3 font-semibold text-white hover:opacity-90"
                >
                  <Rocket className="h-4 w-4" />
                  Keep Trying!
                </button>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                <Target className="h-5 w-5 text-violet-400" />
                Performance Overview
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto text-emerald-400 mb-1" />
                  <p className="text-xl font-bold text-white">{correctCount}</p>
                  <p className="text-xs text-emerald-300">Correct</p>
                </div>
                <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-center">
                  <XCircle className="h-6 w-6 mx-auto text-rose-400 mb-1" />
                  <p className="text-xl font-bold text-white">{wrongCount}</p>
                  <p className="text-xs text-rose-300">Wrong</p>
                </div>
                <div className="rounded-xl bg-slate-600/30 border border-slate-600 p-3 text-center">
                  <Minus className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                  <p className="text-xl font-bold text-white">{skippedCount}</p>
                  <p className="text-xs text-slate-400">Skipped</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Correct</span>
                  <span>{totalMarks > 0 ? ((correctCount / result.questions.length) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${totalMarks > 0 ? (correctCount / result.questions.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Wrong</span>
                  <span>{totalMarks > 0 ? ((wrongCount / result.questions.length) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${totalMarks > 0 ? (wrongCount / result.questions.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Not Attempted</span>
                  <span>{totalMarks > 0 ? ((skippedCount / result.questions.length) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-slate-600 rounded-full"
                    style={{ width: `${totalMarks > 0 ? (skippedCount / result.questions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
              <BarChart2 className="h-5 w-5 text-cyan-400" />
              Key Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <Clock className="h-5 w-5 text-slate-400 mb-2" />
                <p className="text-lg font-bold text-white">Time</p>
                <p className="text-sm text-slate-400">{timeTaken}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <Target className="h-5 w-5 text-slate-400 mb-2" />
                <p className="text-lg font-bold text-white">Accuracy</p>
                <p className="text-sm text-slate-400">{accuracy.toFixed(0)}%</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <CheckCircle className="h-5 w-5 text-slate-400 mb-2" />
                <p className="text-lg font-bold text-white">Attempted</p>
                <p className="text-sm text-slate-400">
                  {Object.keys(result.responses).length}/{result.questions.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <XCircle className="h-5 w-5 text-slate-400 mb-2" />
                <p className="text-lg font-bold text-white">Negative</p>
                <p className="text-sm text-slate-400">{wrongCount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Review Questions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-2">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              Review Your Test
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Go through each question, see your answer vs the correct answer, and read the solution.
            </p>
            <button
              type="button"
              onClick={() => {
                setReviewMode(true);
                setReviewIndex(0);
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              <BookOpen className="h-5 w-5" />
              Review All Questions
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard/pyq")}
            className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            ← Back to PYQ
          </button>
        </div>
      </main>
    </div>
  );
}

// PAGE 2: Select Chemistry Type
export function PyqChemistryPage() {
  const { examId } = useParams<{ examId: ExamId }>();
  const navigate = useNavigate();

  const exam = EXAMS.find((e) => e.id === examId);
  const { bank, loading, error, refetch } = useExamBank(examId);

  const [cbseSubject, setCbseSubject] = useState<"Chemistry" | "Physics" | "Maths">(
    "Chemistry"
  );
  const isCbse = exam?.id === "cbse";

  const chapterCountsByType = useMemo(() => {
    const counts: Record<ChemistryType, number> = {
      Organic: 0,
      Inorganic: 0,
      Physical: 0,
    };
    if (!bank) return counts;

    const seen: Record<ChemistryType, Set<string>> = {
      Organic: new Set(),
      Inorganic: new Set(),
      Physical: new Set(),
    };

    for (const q of bank.questions) {
      seen[q.chemistryType].add(q.chapter);
    }

    (["Organic", "Inorganic", "Physical"] as ChemistryType[]).forEach((t) => {
      counts[t] = seen[t].size;
    });

    return counts;
  }, [bank]);

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Unknown exam. Go back to{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/pyq")}
            className="text-cyan-400 underline"
          >
            exam selection
          </button>
          .
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center">
        <p className="text-slate-400">Loading questions…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/pyq")}
            className="text-cyan-400 underline text-sm"
          >
            Back to exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-8 py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-6 py-6 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
            <button
              type="button"
              onClick={() => navigate("/dashboard/pyq")}
              className="text-[11px] text-slate-400 hover:text-cyan-300"
            >
              ← Back to exams
            </button>
            <h1 className="text-3xl md:text-4xl font-bold">
              {exam.name} {isCbse ? "· Subjects" : "· Chemistry Type"}
            </h1>
            {!isCbse && (
              <p className="text-slate-300 text-sm md:text-base max-w-2xl">
                Choose which part of chemistry you want to practice:{" "}
                <span className="text-fuchsia-300">Organic</span>,{" "}
                <span className="text-violet-300">Inorganic</span>, or{" "}
                <span className="text-sky-300">Physical</span>.
              </p>
            )}
            {isCbse && (
              <p className="text-slate-300 text-sm md:text-base max-w-2xl">
                Pick a CBSE subject below (Chemistry, Physics or Maths). Next
                you&apos;ll choose a chapter, then solve PYQs for that subject.
              </p>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs text-slate-400 hover:text-cyan-300 underline"
            >
              Refresh (reload after clearing data)
            </button>
          </header>

          {isCbse ? (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Select subject</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {(["Chemistry", "Physics", "Maths"] as const).map((subj) => {
                  const isActive = cbseSubject === subj;
                  const gradient =
                    subj === "Chemistry"
                      ? "from-cyan-500 to-emerald-400"
                      : subj === "Physics"
                      ? "from-violet-500 to-indigo-500"
                      : "from-amber-400 to-orange-500";
                  const subtitle =
                    subj === "Chemistry"
                      ? "Boards-style chemistry PYQs aligned with NCERT."
                      : subj === "Physics"
                      ? "Conceptual & numerical physics questions."
                      : "Algebra, calculus & coordinate geometry PYQs.";
                  const slug = subj.toLowerCase();

                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() =>
                        navigate(`/dashboard/pyq/${exam.id}/${slug}`)
                      }
                      className={`relative h-full rounded-3xl border bg-slate-950/90 px-5 py-5 text-left transition-all hover:-translate-y-1 shadow-[0_24px_55px_rgba(8,47,73,0.9)] overflow-hidden ${
                        isActive
                          ? "border-cyan-400/90"
                          : "border-slate-800 hover:border-cyan-400/80"
                      }`}
                    >
                      <div className="pointer-events-none absolute -right-16 -top-10 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />
                      <div className="pointer-events-none absolute -left-16 bottom-0 h-28 w-28 rounded-full bg-fuchsia-500/15 blur-3xl" />

                      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div
                              className={`inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-[11px] font-semibold text-slate-50 shadow-[0_10px_25px_rgba(88,28,135,0.7)]`}
                            >
                              {subj}
                            </div>
                            <p className="text-[11px] text-slate-200 leading-relaxed">
                              {subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-400">
                          <p>
                            Chapters and PYQs for{" "}
                            <span className="text-slate-100 font-medium">
                              {subj.toLowerCase()}
                            </span>{" "}
                            will appear on the next step.
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Choose chemistry type</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {(["Organic", "Inorganic", "Physical"] as ChemistryType[]).map(
                  (chem) => {
                    const isOrganic = chem === "Organic";
                    const isInorganic = chem === "Inorganic";
                    const gradient =
                      isOrganic
                        ? "from-fuchsia-500 to-pink-500"
                        : isInorganic
                        ? "from-violet-500 to-indigo-500"
                        : "from-sky-500 to-cyan-400";
                    const chemSlug = chem.toLowerCase();
                    const subtitle = isOrganic
                      ? "Carbon compounds, mechanisms & biomolecules."
                      : isInorganic
                      ? "Blocks, coordination & qualitative questions."
                      : "Numerical-heavy topics & graphs.";
                    const chapterCount = chapterCountsByType[chem] ?? 0;

                    return (
                      <button
                        key={chem}
                        type="button"
                        onClick={() =>
                          navigate(`/dashboard/pyq/${exam.id}/${chemSlug}`)
                        }
                        className="relative h-full rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-5 text-left transition-all hover:border-cyan-400/90 hover:-translate-y-1 shadow-[0_24px_55px_rgba(8,47,73,0.9)] overflow-hidden"
                      >
                        {/* soft glow background */}
                        <div className="pointer-events-none absolute -right-16 -top-10 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />
                        <div className="pointer-events-none absolute -left-16 bottom-0 h-28 w-28 rounded-full bg-fuchsia-500/15 blur-3xl" />

                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div
                                className={`inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-[11px] font-semibold text-slate-50 shadow-[0_10px_25px_rgba(88,28,135,0.7)]`}
                              >
                                {chem} Chemistry
                              </div>
                              <p className="text-[11px] text-slate-200 leading-relaxed">
                                {subtitle}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                Chapters
                              </p>
                              <p className="text-3xl font-semibold text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,0.7)]">
                                {chapterCount}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1 text-[11px] text-slate-400">
                            <p>
                              Targeted PYQs from{" "}
                              <span className="text-slate-100 font-medium">
                                {chem.toLowerCase()} chemistry
                              </span>{" "}
                              only.
                            </p>
                            <p className="text-slate-500">
                              Perfect for focused revision before tests and full
                              syllabus mocks.
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

// PAGE 3: Select Chapter
export function PyqChapterPage() {
  const { examId, chemType } = useParams<{
    examId: ExamId;
    chemType: string;
  }>();
  const navigate = useNavigate();

  const exam = EXAMS.find((e) => e.id === examId);

  const isCbse = exam?.id === "cbse";

  const chemistryType: ChemistryType | null = useMemo(() => {
    if (!chemType) return null;
    if (isCbse) return null;
    const lower = chemType.toLowerCase();
    if (lower === "organic") return "Organic";
    if (lower === "inorganic") return "Inorganic";
    if (lower === "physical") return "Physical";
    return null;
  }, [chemType, isCbse]);

  const { bank, loading, error } = useExamBank(examId);

  type ChapterStats = {
    name: string;
    slug: string;
    totalQuestions: number;
    yearBreakdown: {
      year: number;
      total: number;
      solved: number;
    }[];
  };

  const chapterStats: ChapterStats[] = useMemo(() => {
    if (!bank) return [];

    const relevant = isCbse
      ? bank.questions
      : bank.questions.filter((q) => q.chemistryType === chemistryType);

    const chapterYearCounts: Record<string, Record<number, number>> = {};
    const allYears = new Set<number>();

    for (const q of relevant) {
      allYears.add(q.year);
      if (!chapterYearCounts[q.chapter]) {
        chapterYearCounts[q.chapter] = {};
      }
      chapterYearCounts[q.chapter][q.year] =
        (chapterYearCounts[q.chapter][q.year] ?? 0) + 1;
    }

    if (allYears.size === 0) return [];

    const latestYear = Math.max(...Array.from(allYears));
    const yearsToShow = [latestYear, latestYear - 1, latestYear - 2];

    return Object.entries(chapterYearCounts)
      .map(([chapterName, yearMap]) => {
        const displayName = isCbse
          ? normalizeCbseChapterName(chapterName, chemType)
          : chapterDisplayName(chapterName);
        const breakdown = yearsToShow.map((year) => {
          const total = yearMap[year] ?? 0;
          // Mock "solved" count just for UI demo; real progress will come from backend later
          const solved =
            total > 0 ? Math.max(1, Math.floor((total * 2) / 3)) : 0;
          return { year, total, solved };
        });

        const totalQuestions = Object.values(yearMap).reduce(
          (sum, cnt) => sum + cnt,
          0
        );

        return {
          name: displayName,
          slug: chapterToSlug(displayName),
          totalQuestions,
          yearBreakdown: breakdown,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [bank, chemistryType, isCbse]);

  if (!exam || (!chemistryType && !isCbse)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Invalid URL. Go back to{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/pyq")}
            className="text-cyan-400 underline"
          >
            exam selection
          </button>
          .
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center">
        <p className="text-slate-400">Loading chapters…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button type="button" onClick={() => navigate("/dashboard/pyq")} className="text-cyan-400 underline text-sm">Back to exams</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-6 md:px-8 py-8 md:py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-5 md:px-6 py-5 md:py-6 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.8)] relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-14 bottom-0 h-28 w-28 rounded-full bg-fuchsia-500/8 blur-3xl" />

            <div className="relative z-10 space-y-4">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/pyq/${exam.id}`)}
              className="text-[11px] text-slate-400 hover:text-cyan-300"
            >
              ← Back to {isCbse ? "subjects" : "chemistry type"}
            </button>
              <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {exam.name}{" "}
                    {isCbse
                      ? `· ${chemType?.charAt(0).toUpperCase()}${chemType?.slice(
                          1
                        )}`
                      : `· ${chemistryType} Chemistry`}
                  </h1>
                  <p className="text-slate-300 text-xs md:text-sm max-w-2xl">
                    Choose a chapter to practice all{" "}
                    {isCbse
                      ? `${chemType?.toLowerCase()} PYQs`
                      : `${chemistryType?.toLowerCase()} chemistry PYQs` }
                    , auto‑sorted from latest year to oldest.
                  </p>
                </div>
                {chapterStats.length > 0 && (
                  <div className="mt-2 md:mt-0 inline-flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-300">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      ⚗
                    </span>
                    <span>
                      {chapterStats.length} chapters ·{" "}
                      {chapterStats
                        .reduce(
                          (sum, ch) => sum + ch.totalQuestions,
                          0
                        )
                        .toString()}{" "}
                      questions
                    </span>
                  </div>
                )}
              </div>
            </div>
          </header>

          <section className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold">
              Pick a chapter
            </h2>
            {chapterStats.length === 0 ? (
              <p className="text-sm text-slate-400">
                No chapters or questions yet. Upload PYQs from the admin panel to get started.
              </p>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-3 md:px-4 py-3 md:py-4 space-y-3 md:space-y-4 shadow-[0_22px_55px_rgba(15,23,42,0.85)]">
                {chapterStats.map((chapter) => (
                  <button
                    key={chapter.slug}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/dashboard/pyq/${exam.id}/${chemType}/${chapterToSlug(
                          chapter.name
                        )}`
                      )
                    }
                    className="w-full text-left rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 md:px-5 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 hover:border-cyan-400/70 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(8,47,73,0.75)] transition-all"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-cyan-500/25 via-slate-900 to-fuchsia-500/25 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-lg">
                        ⚗
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm md:text-base font-semibold text-slate-100">
                          {chapter.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {chapter.totalQuestions} total questions in{" "}
                          {isCbse
                            ? `${chemType?.toLowerCase()}`
                            : `${chemistryType.toLowerCase()} chemistry`}
                          .
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4 text-[10px] md:text-[11px] text-slate-400">
                      {chapter.yearBreakdown.map((stat) => (
                        <div
                          key={stat.year}
                          className="flex flex-col items-end min-w-[80px]"
                        >
                          <span className="uppercase tracking-wide text-slate-500">
                            {stat.year}
                          </span>
                          <span className="text-slate-200">
                            {stat.total} Qs
                            {stat.total > 0 && (
                              <span className="text-[10px] text-emerald-300 ml-1">
                                ({stat.solved} solved)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// PAGE 4: Question List + Detail
export function PyqQuestionPage() {
  const { examId, chemType, chapterSlug } = useParams<{
    examId: ExamId;
    chemType: string;
    chapterSlug: string;
  }>();
  const navigate = useNavigate();

  const exam = EXAMS.find((e) => e.id === examId);

  const isCbse = exam?.id === "cbse";

  const chemistryType: ChemistryType | null = useMemo(() => {
    if (!chemType) return null;
    if (isCbse) return null;
    const lower = chemType.toLowerCase();
    if (lower === "organic") return "Organic";
    if (lower === "inorganic") return "Inorganic";
    if (lower === "physical") return "Physical";
    return null;
  }, [chemType, isCbse]);

  const { bank, loading, error } = useExamBank(examId);

  const [attemptTick, setAttemptTick] = useState(0);
  useEffect(() => {
    const onAttempt = () => setAttemptTick((x) => x + 1);
    window.addEventListener("pyq-attempt-updated", onAttempt);
    return () => window.removeEventListener("pyq-attempt-updated", onAttempt);
  }, []);

  const allChapters = useMemo(() => {
    if (!bank) return [];
    if (isCbse) {
      const list = bank.questions.map((q) =>
        normalizeCbseChapterName(q.chapter, chemType)
      );
      return Array.from(new Set(list));
    }
    if (!chemistryType) return [];
    const list = bank.questions
      .filter((q) => q.chemistryType === chemistryType)
      .map((q) => q.chapter);
    return Array.from(new Set(list));
  }, [bank, chemistryType, isCbse]);

  const chapter = useMemo(() => {
    if (!chapterSlug) return null;
    return slugToChapter(chapterSlug, allChapters);
  }, [chapterSlug, allChapters]);

  const questionsForChapter = useMemo(() => {
    if (!bank || !chapter) return [];
    const base = bank.questions.filter((q) => {
      if (!isCbse) return q.chapter === chapter;
      return (
        normalizeCbseChapterName(q.chapter, chemType) ===
        normalizeCbseChapterName(chapter, chemType)
      );
    });
    const filtered = isCbse
      ? base
      : base.filter((q) => q.chemistryType === chemistryType);
    const withAttempts = filtered.map((q) => ({
      ...q,
      attemptStatus: getStoredAttemptStatus(q.id),
    }));
    return withAttempts.sort((a, b) => b.year - a.year);
  }, [bank, chapter, chemistryType, isCbse, chemType, attemptTick]);

  const questionStats = useMemo(() => {
    if (!questionsForChapter.length) {
      return {
        total: 0,
        solved: 0,
        attempted: 0,
        accuracy: 0,
        latestYear: null as number | null,
        earliestYear: null as number | null,
      };
    }
    const years = questionsForChapter.map((q) => q.year);
    const latestYear = Math.max(...years);
    const earliestYear = Math.min(...years);

    const solved = questionsForChapter.filter(
      (q) => q.attemptStatus === "correct"
    ).length;
    const attempted = questionsForChapter.filter(
      (q) => q.attemptStatus && q.attemptStatus !== "unattempted"
    ).length;
    const accuracy =
      attempted === 0 ? 0 : Math.round((solved / attempted) * 100);
    return {
      total: questionsForChapter.length,
      solved,
      attempted,
      accuracy,
      latestYear,
      earliestYear,
    };
  }, [questionsForChapter]);

  if (!exam || (!chemistryType && !isCbse)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Invalid URL. Go back to{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/pyq")}
            className="text-cyan-400 underline"
          >
            exam selection
          </button>
          .
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center">
        <p className="text-slate-400">Loading questions…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button type="button" onClick={() => navigate("/dashboard/pyq")} className="text-cyan-400 underline text-sm">Back to exams</button>
        </div>
      </div>
    );
  }
  if (!chapter) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Chapter not found. Go back to{" "}
          <button
            type="button"
            onClick={() => navigate(`/dashboard/pyq/${exam.id}/${chemType}`)}
            className="text-cyan-400 underline"
          >
            chapters
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-6 md:px-8 py-8 md:py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-7">
          <header className="space-y-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/pyq/${exam.id}/${chemType}`)}
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-900/0 px-3 py-1.5 text-[11px] font-medium text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-900/70 hover:text-cyan-300 hover:-translate-x-0.5 hover:shadow-[0_0_18px_rgba(34,211,238,0.35)]"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-cyan-300">
                ←
              </span>
              <span>Back to chapters</span>
            </button>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-400/80">
                Chapter-wise previous year questions
              </p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {exam.name} ·{" "}
                {isCbse
                  ? `${chemType?.charAt(0).toUpperCase()}${chemType
                      ?.slice(1)
                      .toLowerCase()}`
                  : chemistryType}{" "}
                ·{" "}
                <span className="text-slate-50">
                  {isCbse
                    ? normalizeCbseChapterName(chapter, chemType)
                    : chapter}
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                Smart list of all questions in this chapter, arranged from latest
                year to oldest for smooth revision.
              </p>
            </div>
          </header>

          <section className="space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border border-slate-800 px-5 py-5 space-y-4 shadow-[0_22px_55px_rgba(15,23,42,0.85)]">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Overall performance in this chapter
                </p>
                <p className="text-xs text-slate-400">
                  {questionStats.total} questions from{" "}
                  {questionStats.earliestYear ?? "—"} to{" "}
                  {questionStats.latestYear ?? "—"}, sorted latest to oldest.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Total PYQs
                  </p>
                  <p className="text-2xl font-semibold text-slate-50">
                    {questionStats.total}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    All questions available in this chapter.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/5 px-4 py-3 flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-300">
                    Correct
                  </p>
                  <p className="text-2xl font-semibold text-emerald-300">
                    {questionStats.solved}
                  </p>
                  <p className="text-[10px] text-emerald-200/80">
                    Marked correct in this chapter.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Attempted
                  </p>
                  <p className="text-2xl font-semibold text-slate-50">
                    {questionStats.attempted}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Questions you have tried in this chapter.
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-500/50 bg-sky-500/5 px-4 py-3 flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-wide text-sky-300">
                    Accuracy
                  </p>
                  <p className="text-2xl font-semibold text-sky-300">
                    {questionStats.accuracy}%
                  </p>
                  <p className="text-[10px] text-sky-200/80">
                    Correct / attempted across this chapter.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 max-h-[520px] overflow-y-auto shadow-[0_22px_55px_rgba(15,23,42,0.85)]">
              {questionsForChapter.length === 0 ? (
                <p className="p-6 text-slate-400 text-sm">
                  No questions in this chapter yet. Upload PYQs from the admin panel.
                </p>
              ) : (
                questionsForChapter.map((q, idx) => {
                  const isLast = idx === questionsForChapter.length - 1;
                  const status = q.attemptStatus ?? "unattempted";
                  const isCorrect = status === "correct";
                  const isWrong = status === "wrong";
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() =>
                        navigate(
                          `/dashboard/pyq/${exam.id}/${chemType}/${chapterSlug}/${q.id}`
                        )
                      }
                      className={`w-full text-left px-4 md:px-5 py-3 md:py-3.5 text-sm transition-all hover:bg-slate-900/95 hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(15,23,42,0.8)] ${
                        !isLast ? "border-b border-slate-800/80" : ""
                      } ${
                        status !== "unattempted"
                          ? "bg-slate-900/70 opacity-80"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex items-center gap-2">
                          {status !== "unattempted" && (
                            <span
                              className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                                isCorrect
                                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/70"
                                  : "bg-rose-500/10 text-rose-300 border border-rose-400/70"
                              }`}
                            >
                              {isCorrect ? "✓" : "✗"}
                            </span>
                          )}
                          <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-[11px] text-slate-300">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-slate-100 text-[13px] md:text-sm leading-snug line-clamp-2">
                              {q.stem}
                            </p>
                            <div className="text-[11px] text-slate-400">
                              <span className="font-medium text-slate-100">
                                {q.year}
                              </span>{" "}
                              · {exam.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// PAGE 5: Single Question Attempt with Timer
function PyqQuestionAttemptPageInner() {
  const { examId, chemType, chapterSlug, questionId } = useParams<{
    examId: ExamId;
    chemType: string;
    chapterSlug: string;
    questionId: string;
  }>();
  const navigate = useNavigate();

  const exam = EXAMS.find((e) => e.id === examId);
  const { user } = useAuth();
  const isCbse = exam?.id === "cbse";

  const chemistryType: ChemistryType | null = useMemo(() => {
    if (!chemType) return null;
    if (isCbse) return null;
    const lower = chemType.toLowerCase();
    if (lower === "organic") return "Organic";
    if (lower === "inorganic") return "Inorganic";
    if (lower === "physical") return "Physical";
    return null;
  }, [chemType, isCbse]);

  const { bank, loading, error } = useExamBank(examId);

  const allChapters = useMemo(() => {
    if (!bank) return [];
    if (isCbse) {
      const list = bank.questions.map((q) =>
        normalizeCbseChapterName(q.chapter, chemType)
      );
      return Array.from(new Set(list));
    }
    if (!chemistryType) return [];
    const list = bank.questions
      .filter((q) => q.chemistryType === chemistryType)
      .map((q) => q.chapter);
    return Array.from(new Set(list));
  }, [bank, chemistryType, isCbse, chemType]);

  const chapter = useMemo(() => {
    if (!chapterSlug) return null;
    return slugToChapter(chapterSlug, allChapters);
  }, [chapterSlug, allChapters]);

  const questionsForChapter = useMemo(() => {
    if (!bank || !chapter) return [];
    const base = bank.questions.filter((q) => {
      if (!isCbse) return q.chapter === chapter;
      return (
        normalizeCbseChapterName(q.chapter, chemType) ===
        normalizeCbseChapterName(chapter, chemType)
      );
    });
    const filtered = isCbse
      ? base
      : base.filter((q) => q.chemistryType === chemistryType);
    const withAttempts = filtered.map((q) => ({
      ...q,
      attemptStatus: getStoredAttemptStatus(q.id),
    }));
    return withAttempts.sort((a, b) => b.year - a.year);
  }, [bank, chapter, chemistryType, isCbse, chemType]);

  const currentQuestionIndex = useMemo(
    () => questionsForChapter.findIndex((q) => q.id === questionId),
    [questionsForChapter, questionId]
  );
  const currentQuestion =
    currentQuestionIndex >= 0 ? questionsForChapter[currentQuestionIndex] : null;

  // Must be defined before any early-returns to keep hook order stable.
  const answerType = currentQuestion?.answerType ?? "MCQ";
  const multiCorrectSet = useMemo(() => {
    if (answerType !== "MULTI") return new Set<number>();
    const raw = (currentQuestion?.correctAnswer ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const nums = raw
      .map((x) => parseInt(x, 10))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 4);
    return new Set(nums.map((n) => n - 1)); // store 0-based
  }, [answerType, currentQuestion?.correctAnswer]);

  const [showSolution, setShowSolution] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // MCQ
  const [multiSelected, setMultiSelected] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [numericCorrect, setNumericCorrect] = useState<boolean | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);

  // Reset timer when question changes
  useEffect(() => {
    setElapsedSeconds(0);
    setIsRunning(true);
    setShowSolution(false);
    setSelectedIndex(null);
    setMultiSelected([false, false, false, false]);
    setNumericAnswer("");
    setNumericCorrect(null);
  }, [currentQuestion?.id]);

  // Tick timer while running
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning, currentQuestion?.id]);

  const goToQuestionByIndex = (index: number) => {
    if (!exam || !chemType || !chapterSlug) return;
    if (index < 0 || index >= questionsForChapter.length) return;
    const target = questionsForChapter[index];
    navigate(
      `/dashboard/pyq/${exam.id}/${chemType}/${chapterSlug}/${target.id}`
    );
  };

  if (!exam || (!chemistryType && !isCbse)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Invalid URL. Go back to{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/pyq")}
            className="text-cyan-400 underline"
          >
            exam selection
          </button>
          .
        </p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center">
        <p className="text-slate-400">Loading question…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex bg-slate-950 text-slate-50 items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button type="button" onClick={() => navigate("/dashboard/pyq")} className="text-cyan-400 underline text-sm">Back to exams</button>
        </div>
      </div>
    );
  }
  if (!chapter || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Question or chapter not found. Go back to{" "}
          <button
            type="button"
            onClick={() => navigate(`/dashboard/pyq/${exam.id}/${chemType}`)}
            className="text-cyan-400 underline"
          >
            chapters
          </button>
          .
        </p>
      </div>
    );
  }

  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <main className="w-full max-w-5xl px-6 md:px-8 py-8 md:py-10 space-y-6">
          {/* hidden audio elements for feedback sounds */}
          <audio ref={correctAudioRef} src={CorrectSound} preload="auto" />
          <audio ref={wrongAudioRef} src={WrongSound} preload="auto" />
          <header className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/dashboard/pyq/${exam.id}/${chemType}/${chapterSlug}`)
              }
              className="text-[11px] text-slate-400 hover:text-cyan-300"
            >
              ← Back to questions list
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-200">
              <span className="text-slate-400">Time</span>
              <span className="font-semibold text-cyan-300">
                {minutes}:{seconds}
              </span>
            </div>
          </header>

          <section className="space-y-5">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 px-7 py-7 flex flex-col gap-6 shadow-[0_22px_55px_rgba(15,23,42,0.85)]">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">
                  Q {currentQuestionIndex + 1} of {questionsForChapter.length}
                </p>
                <p className="text-[12px] text-slate-400 flex items-center gap-2">
                  <span>
                    {exam.name} · {chemistryType} · {chapter}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-cyan-400/60 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
                    {currentQuestion.year}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-lg md:text-xl text-slate-100 whitespace-pre-line leading-relaxed">
                  {currentQuestion.stem}
                </p>
              </div>

              {/* Diagrams that belong to the question stem */}
              {currentQuestion.questionImageUrls?.length ? (
                <div className="mt-3 flex flex-col gap-2">
                  {currentQuestion.questionImageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Question figure ${i + 1}`}
                      className="max-w-full max-h-80 object-contain rounded-lg border border-slate-700 bg-slate-950"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ))}
                </div>
              ) : null}

              {answerType === "NUMERIC" ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Numerical</p>
                  {showSolution && numericCorrect != null && (
                    <p
                      className={`text-xs font-semibold ${
                        numericCorrect ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {numericCorrect ? "Correct" : "Incorrect"}
                    </p>
                  )}
                  <input
                    value={numericAnswer}
                    onChange={(e) => setNumericAnswer(e.target.value)}
                    placeholder="Enter your answer"
                    className={`w-full rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 ${
                      showSolution && numericCorrect != null
                        ? numericCorrect
                          ? "bg-emerald-500/10 border border-emerald-400 focus:ring-emerald-500"
                          : "bg-rose-500/10 border border-rose-500 focus:ring-rose-500"
                        : "bg-slate-950 border border-slate-700 focus:ring-cyan-500"
                    }`}
                    disabled={showSolution}
                  />
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {currentQuestion.options.map((opt, idx) => {
                  const isCorrectIndex = idx === currentQuestion.correctIndex;
                  const isSelected = answerType === "MULTI" ? multiSelected[idx] : selectedIndex === idx;
                  const isChecked = showSolution;
                  let optionClasses =
                    "w-full h-full px-5 py-4 rounded-2xl border text-sm md:text-lg flex items-center gap-4 transition-all cursor-pointer";

                  if (!isChecked) {
                    if (isSelected) {
                      optionClasses +=
                        " border-cyan-400 bg-cyan-500/15 shadow-[0_0_18px_rgba(34,211,238,0.35)]";
                    } else {
                      optionClasses +=
                        " border-slate-700 bg-slate-900/80 hover:border-cyan-400/70 hover:bg-slate-900";
                    }
                  } else {
                    if (isCorrectIndex) {
                      optionClasses +=
                        " border-emerald-400 bg-emerald-500/15 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.45)]";
                    } else if (isSelected && !isCorrectIndex) {
                      optionClasses +=
                        " border-rose-500 bg-rose-500/15 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
                    } else {
                      optionClasses +=
                        " border-slate-700 bg-slate-900/80 text-slate-100";
                    }
                  }

                  const isMultiCorrect = answerType === "MULTI" ? multiCorrectSet.has(idx) : false;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (showSolution) return;
                        if (answerType === "MULTI") {
                          setMultiSelected((prev) => {
                            const next = [...prev];
                            next[idx] = !next[idx];
                            return next;
                          });
                        } else {
                          setSelectedIndex(idx);
                        }
                      }}
                      className={optionClasses}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isChecked
                            ? answerType === "MULTI"
                              ? isMultiCorrect
                              : isCorrectIndex
                              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/70"
                              : isSelected
                              ? "bg-rose-500/20 text-rose-200 border border-rose-400/70"
                              : "bg-slate-800 text-slate-300 border border-slate-600"
                            : isSelected
                            ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/70"
                            : "bg-slate-800 text-slate-300 border border-slate-600"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="flex-1 flex flex-col gap-2 text-left">
                        {currentQuestion.optionImageUrls?.[idx] ? (
                          <img
                            src={currentQuestion.optionImageUrls[idx]}
                            alt={`Option ${String.fromCharCode(65 + idx)} figure`}
                            className="max-h-44 w-auto object-contain rounded-md border border-slate-700 bg-slate-950"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                        <span className="text-slate-100">
                          {opt && opt.trim() ? opt : currentQuestion.optionImageUrls?.[idx] ? "" : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              )}

              {showSolution && (
                <div className="mt-2 rounded-xl bg-slate-950 border border-emerald-500/40 p-3 text-xs text-slate-100 space-y-2">
                  <p className="font-semibold mb-1 text-emerald-300">
                    Solution
                  </p>
                  {currentQuestion.solution && (
                    <p className="text-slate-200">{currentQuestion.solution}</p>
                  )}
                  {currentQuestion.solutionImageUrls?.length ? (
                    <div className="flex flex-col gap-2">
                      {currentQuestion.solutionImageUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Solution figure ${i + 1}`}
                          className="max-w-full max-h-80 object-contain rounded-lg border border-slate-700 bg-slate-950"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-slate-900/80 border border-slate-800 px-6 py-3 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => goToQuestionByIndex(currentQuestionIndex - 1)}
                className="px-4 py-2 rounded-full border border-slate-700 text-xs text-slate-200 hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={currentQuestionIndex <= 0}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={async () => {
                  let isCorrect = false;
                  if (answerType === "NUMERIC") {
                    isCorrect = numericAnswersEqual(numericAnswer, currentQuestion.correctAnswer);
                    setNumericCorrect(isCorrect);
                  } else if (answerType === "MULTI") {
                    const chosen = new Set<number>();
                    multiSelected.forEach((v, idx) => {
                      if (v) chosen.add(idx);
                    });
                    isCorrect =
                      chosen.size === multiCorrectSet.size &&
                      Array.from(chosen).every((x) => multiCorrectSet.has(x));
                  } else {
                    if (selectedIndex === null) return;
                    isCorrect = selectedIndex === currentQuestion.correctIndex;
                  }
                  if (user) {
                    const chosenIndex =
                      answerType === "NUMERIC"
                        ? null
                        : answerType === "MULTI"
                        ? null
                        : selectedIndex;
                    const correctIndex =
                      answerType === "NUMERIC" || answerType === "MULTI"
                        ? null
                        : currentQuestion.correctIndex;
                    void logQuestionAttempt({
                      userId: user.id,
                      questionId: currentQuestion.id,
                      source: "pyq-drill",
                      chosenIndex,
                      correctIndex,
                    });
                  }

                  if (isCorrect) {
                    setStoredAttemptStatus(currentQuestion.id, "correct");
                    incrementSolvedToday(currentQuestion.id);
                    correctAudioRef.current?.play().catch(() => {});
                  } else {
                    setStoredAttemptStatus(currentQuestion.id, "wrong");
                    wrongAudioRef.current?.play().catch(() => {});
                  }
                  setShowSolution(true);
                  setIsRunning(false);
                }}
                className={`px-6 py-2 rounded-full text-xs font-semibold ${
                  answerType === "NUMERIC"
                    ? !numericAnswer.trim()
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    : answerType === "MULTI"
                    ? multiSelected.every((v) => !v)
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    : selectedIndex === null
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                }`}
                disabled={
                  answerType === "NUMERIC"
                    ? !numericAnswer.trim()
                    : answerType === "MULTI"
                    ? multiSelected.every((v) => !v)
                    : selectedIndex === null
                }
              >
                Check Answer
              </button>
              <button
                type="button"
                onClick={() => goToQuestionByIndex(currentQuestionIndex + 1)}
                className="px-4 py-2 rounded-full border border-slate-700 text-xs text-slate-200 hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={
                  currentQuestionIndex < 0 ||
                  currentQuestionIndex >= questionsForChapter.length - 1
                }
              >
                Next
              </button>
            </div>
          </section>
        </main>
    </div>
  );
}

export function PyqQuestionAttemptPage() {
  return (
    <PyqErrorBoundary>
      <PyqQuestionAttemptPageInner />
    </PyqErrorBoundary>
  );
}

