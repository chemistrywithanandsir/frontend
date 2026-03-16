import { motion } from "motion/react";
import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BookOpen, ClipboardList, FileText, BookMarked, FlaskConical, LogIn } from "lucide-react";
import { EXAM_CHAPTERS } from "../data/weightageChapters";
import { fetchExamWeightagePublic } from "../utils/apiWeightage";
import type { ShiftEntry } from "../utils/shiftWeightageStorage";
import { useAuth } from "../context/AuthContext";

const EXAM_NAMES: Record<string, string> = {
  neet: "NEET",
  "jee-main": "JEE Main",
  "jee-advanced": "JEE Advanced",
};

const FILLS = ["#22d3ee", "#38bdf8", "#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#34d399", "#a78bfa", "#8b5cf6", "#7c3aed", "#6366f1", "#4f46e5"];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-slate-200 max-w-xs truncate" title={label}>{label}</p>
      <p className="text-cyan-300 font-semibold">{payload[0]?.value} questions</p>
    </div>
  );
};

const ACTION_CARDS = [
  { icon: BookOpen,      label: "View Notes",              to: "/dashboard/notes" },
  { icon: ClipboardList, label: "Solve Chapterwise PYQs",  to: "/dashboard/pyq"   },
  { icon: FileText,      label: "Get Chapterwise Notes",   to: "/dashboard/notes" },
  { icon: BookMarked,    label: "Get NCERT Notes",         to: "/dashboard/notes" },
  { icon: FlaskConical,  label: "Important Reactions",     to: "/dashboard/notes" },
] as const;

export function ExamWeightagePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const examId = location.pathname.replace("/", "") || "";
  const normalizedId = examId === "jee-mains" ? "jee-main" : examId;
  const chapters = EXAM_CHAPTERS[normalizedId];
  const examName = EXAM_NAMES[normalizedId] ?? examId;

  const [yearsAvailable, setYearsAvailable] = useState<string[]>([]);
  const [storedByYear, setStoredByYear] = useState<Record<string, Record<string, number>>>({});
  const [shiftEntriesAll, setShiftEntriesAll] = useState<ShiftEntry[]>([]);
  const [year, setYear] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!normalizedId) return;
      const res = await fetchExamWeightagePublic(normalizedId);
      if (cancelled) return;
      const byYear = res.byYear || {};
      setStoredByYear(
        Object.fromEntries(
          Object.entries(byYear).map(([y, m]) => [String(y), m as Record<string, number>])
        )
      );
      const years = Object.keys(byYear)
        .map((y) => String(y))
        .sort((a, b) => Number(b) - Number(a));
      setYearsAvailable(years);

      if (normalizedId === "jee-main") {
        const shifts: ShiftEntry[] = (res.shifts || []).map((s) => ({
          id: s.id,
          year: String(s.year),
          month: s.month,
          dayLabel: s.day_label,
          shift: s.shift,
          questions: s.questions,
          physical: s.physical,
          inorganic: s.inorganic,
          organic: s.organic,
          chapterwiseNote: s.chapterwise_note || undefined,
          chapterCounts: (s.chapter_counts || undefined) as Record<string, number> | undefined,
        }));
        shifts.sort((a, b) => {
          const monthOrder: Record<string, number> = { Jan: 1, April: 2 };
          if (a.year !== b.year) return Number(a.year) - Number(b.year);
          const ma = monthOrder[a.month] ?? 99;
          const mb = monthOrder[b.month] ?? 99;
          if (ma !== mb) return ma - mb;
          if (a.dayLabel && b.dayLabel && a.dayLabel !== b.dayLabel) {
            return a.dayLabel.localeCompare(b.dayLabel);
          }
          return a.shift.localeCompare(b.shift);
        });
        setShiftEntriesAll(shifts);
      } else {
        setShiftEntriesAll([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [normalizedId]);
  useEffect(() => {
    if (normalizedId !== "jee-main") return;
    if (!shiftEntriesAll.length) return;
    // If no shift selected yet, default to the first one and sync year
    if (!selectedShiftId) {
      setSelectedShiftId(shiftEntriesAll[0].id);
      setYear(shiftEntriesAll[0].year);
    }
  }, [normalizedId, shiftEntriesAll, selectedShiftId]);

  const selectedShift =
    normalizedId === "jee-main"
      ? shiftEntriesAll.find((e) => e.id === selectedShiftId)
      : undefined;

  useEffect(() => {
    if (yearsAvailable.length > 0 && !yearsAvailable.includes(year)) {
      setYear(yearsAvailable[0]);
    }
  }, [yearsAvailable, year]);

  const chartData = useMemo(() => {
    const y = year || yearsAvailable[0];
    if (!chapters || !y) return [];
    const byYear = storedByYear[y] || {};

    const perChapter =
      normalizedId === "jee-main" && selectedShift?.chapterCounts
        ? selectedShift.chapterCounts
        : byYear;

    return chapters
      .map((ch, i) => ({
        chapter: ch.label.length > 45 ? ch.label.slice(0, 45) + "…" : ch.label,
        fullLabel: ch.label,
        questions: perChapter[ch.id] ?? 0,
        fill: FILLS[i % FILLS.length],
        chemistryType: ch.chemistryType,
      }))
      .filter((d) => d.questions > 0);
  }, [chapters, normalizedId, year, yearsAvailable, selectedShift, storedByYear]);

  const typeWeightage = useMemo(() => {
    const y = year || yearsAvailable[0];
    if (!chapters || !y) return { Physical: 0, Inorganic: 0, Organic: 0 };
    const byYear = storedByYear[y] || {};

    const perChapter =
      normalizedId === "jee-main" && selectedShift?.chapterCounts
        ? selectedShift.chapterCounts
        : byYear;

    const sums = { Physical: 0, Inorganic: 0, Organic: 0 } as Record<string, number>;
    chapters.forEach((ch) => {
      sums[ch.chemistryType] =
        (sums[ch.chemistryType] || 0) + (perChapter[ch.id] || 0);
    });
    return sums;
  }, [chapters, normalizedId, year, yearsAvailable, selectedShift, storedByYear]);

  const totalQuestions =
    typeWeightage.Physical + typeWeightage.Inorganic + typeWeightage.Organic;

  const branchTotals =
    normalizedId === "jee-main" && selectedShift
      ? {
          Physical: selectedShift.physical ?? 0,
          Inorganic: selectedShift.inorganic ?? 0,
          Organic: selectedShift.organic ?? 0,
        }
      : typeWeightage;

  const branchTotalQuestions =
    normalizedId === "jee-main" && selectedShift
      ? selectedShift.questions ||
        (selectedShift.physical ?? 0) +
          (selectedShift.inorganic ?? 0) +
          (selectedShift.organic ?? 0)
      : totalQuestions;

  const selectedShiftLabel =
    normalizedId === "jee-main" && selectedShift
      ? `${selectedShift.dayLabel ? `${selectedShift.dayLabel} · ` : ""}${
          selectedShift.year
        } · ${selectedShift.month} · ${selectedShift.shift}`
      : "";

  const showBranchWeightage =
    (normalizedId !== "jee-main" && totalQuestions > 0) ||
    (normalizedId === "jee-main" && !!selectedShift);

  if (!chapters) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Exam not found.</p>
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (yearsAvailable.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 mb-8">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-2">
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              {examName} Chemistry
            </span>
          </h1>
          <p className="text-slate-400 mb-8">
            No weightage data added yet. Data will appear here once the admin adds chapterwise questions for a year.
          </p>

          {/* Quick-access action cards — always visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Explore {examName} Resources
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {ACTION_CARDS.map(({ icon: Icon, label, to }) => (
                <motion.button
                  key={label}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (user) {
                      navigate(to);
                    } else {
                      void signInWithGoogle();
                    }
                  }}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-5 text-center shadow-md hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 group-hover:from-cyan-500/30 group-hover:to-indigo-500/30 transition-all">
                    <Icon size={22} className="text-cyan-300" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                    {label}
                  </span>
                  {!user && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                      <LogIn size={10} />
                      Sign in
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const selectedYear = year || yearsAvailable[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 mb-8"
        >
          ← Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50 mb-2 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              {examName} Chemistry
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Previous year chapterwise weightage
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 md:p-8 shadow-xl mb-8"
        >
          {normalizedId === "jee-main" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-100">
                    Chapterwise questions for selected shift
                  </h2>
                  <p className="text-sm text-slate-400">
                    Choose a JEE Main shift to see chapterwise question counts for that year.
                  </p>
                </div>
                {shiftEntriesAll.length > 0 && (
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <label className="text-sm text-slate-400 shrink-0">Shift:</label>
                    <select
                      value={selectedShiftId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedShiftId(id);
                        const found = shiftEntriesAll.find((s) => s.id === id);
                        if (found) {
                          setYear(found.year);
                        }
                      }}
                      className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 max-w-full sm:max-w-xs"
                    >
                      {shiftEntriesAll.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.dayLabel
                            ? `${entry.dayLabel} · ${entry.year} · ${entry.month} · ${entry.shift}`
                            : `${entry.year} · ${entry.month} · ${entry.shift}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {shiftEntriesAll.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">
                  No shift-wise data added yet for JEE Main.
                </p>
              ) : chartData.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">
                  No chapter data for {selectedYear}.
                </p>
              ) : (
                <>
                  <div className="md:hidden space-y-2">
                    {chartData
                      .slice()
                      .sort((a, b) => b.questions - a.questions)
                      .map((entry) => (
                        <div
                          key={entry.fullLabel}
                          className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
                        >
                          <p className="text-sm text-slate-200 leading-snug break-words">
                            {entry.fullLabel}
                          </p>
                          <span className="shrink-0 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-2 py-1">
                            {entry.questions}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div
                    className="hidden md:block w-full"
                    style={{
                      // Extra-tall chart so every chapter label and bar has generous space
                      height: Math.max(640, chartData.length * 52),
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 30, right: 40, left: 40, bottom: 100 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          tick={{ fill: "#94a3b8", fontSize: 12 }}
                          domain={[0, "auto"]}
                        />
                        <YAxis
                          type="category"
                          dataKey="chapter"
                          stroke="#94a3b8"
                          tick={{ fill: "#e2e8f0", fontSize: 13 }}
                          width={340}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "rgba(34, 211, 238, 0.1)" }}
                        />
                        <Bar dataKey="questions" radius={[0, 4, 4, 0]} maxBarSize={28}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {yearsAvailable.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        selectedYear === y
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "text-slate-400 hover:text-slate-200 border border-slate-700"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-slate-400">
                  Questions per chapter · {selectedYear}
                </p>
              </div>

              {chartData.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">
                  No chapter data for {selectedYear}.
                </p>
              ) : (
                <>
                  <div className="md:hidden space-y-2">
                    {chartData
                      .slice()
                      .sort((a, b) => b.questions - a.questions)
                      .map((entry) => (
                        <div
                          key={entry.fullLabel}
                          className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
                        >
                          <p className="text-sm text-slate-200 leading-snug break-words">
                            {entry.fullLabel}
                          </p>
                          <span className="shrink-0 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-2 py-1">
                            {entry.questions}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div
                    className="hidden md:block w-full"
                    style={{
                      height: Math.max(640, chartData.length * 52),
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 30, right: 40, left: 40, bottom: 100 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          tick={{ fill: "#94a3b8", fontSize: 12 }}
                          domain={[0, "auto"]}
                        />
                        <YAxis
                          type="category"
                          dataKey="chapter"
                          stroke="#94a3b8"
                          tick={{ fill: "#e2e8f0", fontSize: 13 }}
                          width={320}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "rgba(34, 211, 238, 0.1)" }}
                        />
                        <Bar dataKey="questions" radius={[0, 4, 4, 0]} maxBarSize={28}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>

        {/* Physical / Inorganic / Organic weightage */}
        {showBranchWeightage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 shadow-xl mb-8"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              {normalizedId === "jee-main" && selectedShift
                ? `Weightage by branch (${selectedShiftLabel})`
                : `Weightage by branch (${selectedYear})`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                <p className="text-sm text-sky-300 font-medium mb-1">Physical Chemistry</p>
                <p className="text-2xl font-bold text-white">{branchTotals.Physical}</p>
                <p className="text-xs text-slate-400">
                  {branchTotalQuestions > 0
                    ? ((branchTotals.Physical / branchTotalQuestions) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                <p className="text-sm text-violet-300 font-medium mb-1">Inorganic Chemistry</p>
                <p className="text-2xl font-bold text-white">{branchTotals.Inorganic}</p>
                <p className="text-xs text-slate-400">
                  {branchTotalQuestions > 0
                    ? ((branchTotals.Inorganic / branchTotalQuestions) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-300 font-medium mb-1">Organic Chemistry</p>
                <p className="text-2xl font-bold text-white">{branchTotals.Organic}</p>
                <p className="text-xs text-slate-400">
                  {branchTotalQuestions > 0
                    ? ((branchTotals.Organic / branchTotalQuestions) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick-access action cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Explore {examName} Resources
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ACTION_CARDS.map(({ icon: Icon, label, to }) => (
              <motion.button
                key={label}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (user) {
                    navigate(to);
                  } else {
                    void signInWithGoogle();
                  }
                }}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-5 text-center shadow-md hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 group-hover:from-cyan-500/30 group-hover:to-indigo-500/30 transition-all">
                  <Icon size={22} className="text-cyan-300" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                  {label}
                </span>
                {!user && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <LogIn size={10} />
                    Sign in
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
