// src/app/pages/MyNotesDashboard.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DashboardMiniSidebar } from "../components/DashboardMiniSidebar";
import {
  type Chapter,
  type NoteBundle,
  MOCK_EXAMS,
} from "../../data/notesData";
import NeetLogo from "../../assests/neet.jpg";
import JeeMainLogo from "../../assests/JEE(mains).png";
import JeeAdvancedLogo from "../../assests/Jee-advanced.jpg";
import CbseLogo from "../../assests/CBSE.svg";
import { Search, Filter, FlaskConical, Atom, BookOpen } from "lucide-react";
import { useMyBundles } from "../hooks/useMyBundles";
import { ensureBundlePageCounts, type MyBundle } from "../api/razorpayApi";

// Default PDF for demo - in production each chapter would have its own pdfUrl
import BT2025Pdf from "../../assests/BT2025.pdf";

function getExamLogo(examId: string) {
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
      return null;
  }
}

type FlatNote = {
  id: string;
  title: string;
  chemistryType: Chapter["chemistryType"];
  /** For CBSE: Chemistry | Physics | Maths */
  subject?: string | null;
  bundleTitle: string;
  pageCount: number;
  pdfUrl: string;
};

function getChemistryIcon(chem: Chapter["chemistryType"]) {
  switch (chem) {
    case "Organic":
      return (
        <div className="h-12 w-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center">
          <FlaskConical className="h-6 w-6 text-fuchsia-300" />
        </div>
      );
    case "Inorganic":
      return (
        <div className="h-12 w-12 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
          <Atom className="h-6 w-6 text-violet-300" />
        </div>
      );
    case "Physical":
      return (
        <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-amber-300" />
        </div>
      );
  }
}

function getChemistryTagClass(chem: Chapter["chemistryType"]) {
  switch (chem) {
    case "Organic":
      return "bg-fuchsia-500/10 border-fuchsia-400/30 text-fuchsia-200";
    case "Inorganic":
      return "bg-violet-500/10 border-violet-400/30 text-violet-200";
    case "Physical":
      return "bg-amber-500/10 border-amber-400/30 text-amber-200";
  }
}

/** Normalize exam code for comparison (DB may use "jee-main", frontend "JEE MAIN"). */
function normalizeExamCode(code: string): string {
  return (code || "").toLowerCase().replace(/\s+/g, "-").trim();
}

// PAGE 1: Select Exam
export function MyNotesExamPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentSuccess = (location.state as { paymentSuccess?: boolean; message?: string } | null)?.paymentSuccess;
  const paymentMessage = (location.state as { message?: string } | null)?.message;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          {paymentSuccess && paymentMessage && (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-sm">
              {paymentMessage}
            </div>
          )}
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 sm:px-6 py-5 sm:py-6 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
              <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1">
                My Notes
              </span>
              <span className="text-slate-400 normal-case">
                Your unlocked notes, all in one place
              </span>
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">My Notes</h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Everything you&apos;ve purchased lives here. Pick an exam to see
              your bundles, filter by Organic, Inorganic or Physical if you like,
              and open any note to read the full PDF.
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Choose an exam below to open your bundles for that exam.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Select your exam</h2>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-4xl">
              {MOCK_EXAMS.map((exam) => {
                const logo = getExamLogo(exam.id);
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() =>
                      navigate(`/dashboard/my-notes/${exam.id}`)
                    }
                    className="relative min-w-0 rounded-[1.6rem] border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-left transition-all hover:border-cyan-400/80 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(8,47,73,0.9)] overflow-hidden"
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
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
                        <p className="text-sm font-semibold text-slate-50">
                          {exam.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      View your purchased {exam.name} notes.
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// PAGE 2: Bundles list for an exam
export function MyNotesListPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { bundles: purchasedBundles, loading: bundlesLoading, error: bundlesError } = useMyBundles();

  const exam = MOCK_EXAMS.find((e) => e.id === examId);

  const bundlesForExam = useMemo(() => {
    if (!exam) return [] as MyBundle[];
    const examNorm = normalizeExamCode(exam.code);
    let list = purchasedBundles.filter(
      (b) => normalizeExamCode(b.examCode) === examNorm
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [exam, search, purchasedBundles]);

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Invalid route.{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-notes")}
            className="text-cyan-400 underline"
          >
            Go back
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-6">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 sm:px-6 py-5 sm:py-6 border border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/dashboard/my-notes")}
              className="text-[11px] text-slate-400 hover:text-cyan-300"
            >
              ← Back to exams
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              {exam.name} Bundles
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              These are your purchased note bundles for {exam.name}. Click a bundle to see all notes inside it.
            </p>
          </header>

          {bundlesLoading && (
            <p className="text-sm text-slate-400">Loading your bundles…</p>
          )}
          {bundlesError && (
            <p className="text-sm text-red-400">{bundlesError}</p>
          )}

          {/* Search field for bundles */}
          <div className="flex mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search your bundles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          <section className="space-y-3">
            {!bundlesLoading && !bundlesError && bundlesForExam.length === 0 ? (
              <p className="text-[13px] text-slate-400">
                You don&apos;t have any purchased bundles for this exam yet. Buy bundles from the Notes section.
              </p>
            ) : !bundlesLoading ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                {bundlesForExam.map((bundle) => (
                  <button
                    key={bundle.id}
                    type="button"
                    onClick={() =>
                      navigate(`/dashboard/my-notes/${exam.id}/bundle/${bundle.id}`)
                    }
                    className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-4 text-left transition-all hover:border-cyan-400/70 hover:bg-slate-900/80 hover:shadow-[0_12px_30px_rgba(8,47,73,0.65)]"
                  >
                    <div className="w-full sm:w-28 md:w-36 h-36 sm:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                      {bundle.thumbnailUrl ? (
                        <img
                          src={bundle.thumbnailUrl}
                          alt={bundle.title}
                          className="h-full w-full object-cover min-h-[80px]"
                        />
                      ) : (
                        <div className="h-full min-h-[80px] w-full flex items-center justify-center text-slate-500">
                          <BookOpen className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-slate-50 truncate mb-1">
                        {bundle.title}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {bundle.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

// PAGE 3: Notes inside a specific bundle (search, filter, cards)
export function MyNotesBundleNotesPage() {
  const { examId, bundleId } = useParams<{ examId: string; bundleId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Chapter["chemistryType"] | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const { bundles: purchasedBundles, loading: bundlesLoading, error: bundlesError, refetch } = useMyBundles();

  const exam = MOCK_EXAMS.find((e) => e.id === examId);

  const bundle = useMemo(() => {
    if (!exam || !bundleId) return null;
    const examNorm = normalizeExamCode(exam.code);
    return purchasedBundles.find(
      (b) =>
        b.id === bundleId &&
        normalizeExamCode(b.examCode) === examNorm
    ) ?? null;
  }, [exam, bundleId, purchasedBundles]);

  const flatNotes = useMemo((): FlatNote[] => {
    if (!bundle) return [];
    return bundle.chapters.map((ch) => ({
      id: `${bundle.id}-${ch.id}`,
      title: ch.title,
      chemistryType: ch.chemistryType as Chapter["chemistryType"],
      subject: (ch as { subject?: string | null }).subject ?? null,
      bundleTitle: bundle.title,
      pageCount: ch.pageCount,
      pdfUrl: ch.pdfUrl || BT2025Pdf,
    }));
  }, [bundle]);

  // Backfill page counts for this bundle so "0 pages" becomes real count
  useEffect(() => {
    if (!bundleId || !bundle) return;
    let cancelled = false;
    (async () => {
      await ensureBundlePageCounts(bundleId);
      if (!cancelled && refetch) refetch();
    })();
    return () => {
      cancelled = true;
    };
  }, [bundleId, bundle?.id]);

  const isCbse = normalizeExamCode(exam?.code ?? "") === "cbse";
  const filteredNotes = useMemo(() => {
    let list = flatNotes;
    if (isCbse) {
      if (subjectFilter !== "all") {
        list = list.filter((n) => (n.subject || "").toLowerCase() === subjectFilter.toLowerCase());
      }
    } else {
      if (categoryFilter !== "all") {
        list = list.filter((n) => n.chemistryType === categoryFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.bundleTitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [flatNotes, categoryFilter, subjectFilter, search, isCbse]);

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Invalid route.{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-notes")}
            className="text-cyan-400 underline"
          >
            Go back
          </button>
          .
        </p>
      </div>
    );
  }
  if (bundlesLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
        <DashboardMiniSidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading…</p>
        </main>
      </div>
    );
  }
  if (bundlesError || !bundle) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          {bundlesError || "Bundle not found or not purchased."}{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-notes")}
            className="text-cyan-400 underline"
          >
            Go back
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-6">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 sm:px-6 py-5 sm:py-6 border border-slate-800">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/my-notes/${exam.id}`)}
              className="text-[11px] text-slate-400 hover:text-cyan-300"
            >
              ← Back to bundles
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              {bundle.title}
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Notes included in this bundle. Use search and filters to quickly find a chapter, then click to open the PDF viewer.
            </p>
          </header>

          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              {isCbse ? (
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-8 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Physics">Physics</option>
                  <option value="Maths">Maths</option>
                </select>
              ) : (
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value as Chapter["chemistryType"] | "all"
                    )
                  }
                  className="w-full sm:w-auto pl-10 pr-8 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Organic">Organic Chemistry</option>
                  <option value="Inorganic">Inorganic Chemistry</option>
                  <option value="Physical">Physical Chemistry</option>
                </select>
              )}
            </div>
          </div>

          {/* Notes list */}
          <div className="space-y-2">
            {filteredNotes.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 text-center">
                No notes found in this bundle.
              </p>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/dashboard/my-notes/${exam.id}/view/${note.id}`,
                      { state: { note } }
                    )
                  }
                  className="w-full flex items-start sm:items-center gap-3 sm:gap-4 rounded-2xl border border-slate-800 bg-slate-950/95 px-4 py-3 text-left transition-all hover:border-cyan-400/50 hover:bg-slate-900/80"
                >
                  {getChemistryIcon(note.chemistryType)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-50 text-sm truncate">
                      {note.title}
                    </h3>
                    <span
                      className={`inline-flex mt-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        isCbse && note.subject
                          ? "bg-slate-600/20 border-slate-500/40 text-slate-200"
                          : getChemistryTagClass(note.chemistryType)
                      }`}
                    >
                      {isCbse && note.subject ? note.subject : `${note.chemistryType} Chemistry`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {note.pageCount > 0 ? `${note.pageCount} pages` : "—"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper to find note by id from purchased bundles
function findNoteById(noteId: string, examId: string, bundles: MyBundle[]): FlatNote | null {
  const exam = MOCK_EXAMS.find((e) => e.id === examId);
  if (!exam) return null;
  const examNorm = normalizeExamCode(exam.code);
  for (const bundle of bundles) {
    if (normalizeExamCode(bundle.examCode) !== examNorm) continue;
    for (const ch of bundle.chapters) {
      const id = `${bundle.id}-${ch.id}`;
      if (id === noteId) {
        return {
          id,
          title: ch.title,
          chemistryType: ch.chemistryType as Chapter["chemistryType"],
          subject: (ch as { subject?: string | null }).subject ?? null,
          bundleTitle: bundle.title,
          pageCount: ch.pageCount,
          pdfUrl: ch.pdfUrl || BT2025Pdf,
        };
      }
    }
  }
  return null;
}

// PAGE 4: PDF Viewer (no download, screenshot deterrent, no sidebar)
export function MyNotesPdfViewerPage() {
  const { examId, noteId } = useParams<{ examId: string; noteId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [blurred, setBlurred] = useState(false);
  const { bundles: purchasedBundles, loading: bundlesLoading } = useMyBundles();

  const noteFromState = (location.state as { note?: FlatNote })?.note;
  const noteFromBundles =
    examId && noteId && purchasedBundles.length > 0
      ? findNoteById(noteId, examId, purchasedBundles)
      : null;
  const note = noteFromState ?? noteFromBundles ?? null;

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setBlurred(true);
      }
      // Don't auto-unblur on tab return - require click to resume
    };
    const handleWindowBlur = () => {
      setBlurred(true);
    };
    const handleScreenshotKey = (e: KeyboardEvent) => {
      // Blur on Print Screen and similar keys (Linux, Windows, Mac)
      const isPrintScreen =
        e.key === "PrintScreen" ||
        e.key === "Print" ||
        e.key === "Snapshot" || // Some Linux systems
        e.code === "PrintScreen" ||
        e.code === "Print" ||
        e.keyCode === 44 ||
        e.which === 44;
      const isScreenshotKey =
        isPrintScreen ||
        e.key === "Meta" ||
        e.key === "Super";
      if (isScreenshotKey) {
        e.preventDefault();
        e.stopPropagation();
        setBlurred(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleScreenshotKey, true);
    window.addEventListener("keyup", handleScreenshotKey, true); // Fallback - some systems fire keyup for PrintScreen
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleScreenshotKey, true);
      window.removeEventListener("keyup", handleScreenshotKey, true);
    };
  }, []);

  const pdfUrl = note?.pdfUrl ?? BT2025Pdf;
  const title = note?.title ?? "Note";
  const subtitle = note
    ? `${note.chemistryType} Chemistry · ${note.bundleTitle}`
    : "Handwritten Note";

  if (!examId || !noteId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <button
          type="button"
          onClick={() => navigate("/dashboard/my-notes")}
          className="text-cyan-400 underline"
        >
          Go back to My Notes
        </button>
      </div>
    );
  }

  if (!bundlesLoading && !note) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Note not found.{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-notes")}
            className="text-cyan-400 underline"
          >
            Go back to My Notes
          </button>
        </p>
      </div>
    );
  }

  if (bundlesLoading && !noteFromState) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  const backUrl = `/dashboard/my-notes/${examId}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <div className="flex-1 flex flex-col min-w-0 relative">
      {/* Top bar - no download button */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-slate-50 truncate">
            {title}
          </h1>
          <p className="text-xs text-slate-400 truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-200 text-sm hover:border-cyan-400 hover:text-cyan-300"
          >
            Close
          </button>
        </div>
      </header>

      {/* PDF viewer - no download, right-click disabled, blur on tab/win/prtsc */}
      <div
        className="flex-1 relative overflow-hidden select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className={`w-full h-full min-h-[calc(100vh-60px)] transition-all ${blurred ? "blur-xl pointer-events-none" : ""}`}
        >
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            title={title}
            className="w-full h-full min-h-[calc(100vh-60px)] border-0"
            style={{ pointerEvents: blurred ? "none" : "auto" }}
          />
        </div>
        {blurred && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 cursor-pointer"
            onClick={() => setBlurred(false)}
            onKeyDown={(e) => e.key === "Enter" && setBlurred(false)}
            role="button"
            tabIndex={0}
            aria-label="Click to resume viewing"
          >
            <div className="px-4 py-2 rounded-full bg-slate-900/95 border border-slate-700 text-[11px] text-slate-300">
              Content protected. Click anywhere to resume viewing.
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
