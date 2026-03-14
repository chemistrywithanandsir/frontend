// src/app/pages/Notes.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Chapter,
  type NoteBundle,
  MOCK_EXAMS,
  MOCK_LATEST_BUNDLES,
} from "../../data/notesData";

export function NotesPage() {
  const navigate = useNavigate();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedChemistryType, setSelectedChemistryType] = useState<
    Chapter["chemistryType"] | null
  >(null);

  const selectedExam = useMemo(
    () => MOCK_EXAMS.find((e) => e.id === selectedExamId) ?? null,
    [selectedExamId]
  );

  const bundlesForExam = useMemo(() => {
    if (!selectedExam) return MOCK_LATEST_BUNDLES;
    return MOCK_LATEST_BUNDLES.filter(
      (b) => b.examCode.toLowerCase() === selectedExam.code.toLowerCase()
    );
  }, [selectedExam]);

  const chemistryStats = useMemo(() => {
    const base: Record<Chapter["chemistryType"], number> = {
      Organic: 0,
      Inorganic: 0,
      Physical: 0,
    };
    for (const bundle of bundlesForExam) {
      for (const ch of bundle.chapters) {
        base[ch.chemistryType] += 1;
      }
    }
    return base;
  }, [bundlesForExam]);

  const filteredBundles = useMemo(() => {
    if (!selectedChemistryType) return bundlesForExam;
    return bundlesForExam.filter((b) =>
      b.chapters.some((ch) => ch.chemistryType === selectedChemistryType)
    );
  }, [bundlesForExam, selectedChemistryType]);

  const handleBundleClick = (bundleId: string) => {
    navigate(`/dashboard/bundles/${bundleId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-12 space-y-6 sm:space-y-8">
      {/* Step header */}
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight">
          Notes library
        </h1>
        <p className="text-sm md:text-[15px] text-slate-400">
          Choose exam → choose chemistry type → browse bundles.
        </p>
      </header>

      {/* Step indicators */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Select exam
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
          Choose chemistry type
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Pick a bundle
        </span>
      </div>

      {/* Step 1: exams */}
      <section className="space-y-3">
        <h2 className="text-lg md:text-xl font-semibold">Select exam</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {MOCK_EXAMS.map((exam) => {
            const isActive = selectedExamId === exam.id;
            return (
              <button
                key={exam.id}
                type="button"
                onClick={() => {
                  setSelectedExamId(exam.id);
                  setSelectedChemistryType(null);
                }}
                className={`min-w-0 w-full rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  isActive
                    ? "border-cyan-400/70 bg-slate-900 shadow-[0_14px_35px_rgba(8,47,73,0.8)]"
                    : "border-slate-800 bg-slate-900/80 hover:border-cyan-400/50 hover:-translate-y-0.5"
                }`}
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Exam
                </p>
                <p className="text-slate-100 font-semibold">{exam.name}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: chemistry types */}
      <section className="space-y-3">
        <h2 className="text-lg md:text-xl font-semibold">
          Choose chemistry type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {(["Organic", "Inorganic", "Physical"] as Chapter["chemistryType"][]).map(
            (chem) => {
              const count = chemistryStats[chem] ?? 0;
              const isActive = selectedChemistryType === chem;
              const subtitle =
                chem === "Organic"
                  ? "Carbon compounds & mechanisms."
                  : chem === "Inorganic"
                  ? "Blocks & coordination chemistry."
                  : "Numerical-heavy physical topics.";
              return (
                <button
                  key={chem}
                  type="button"
                  onClick={() => setSelectedChemistryType(chem)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                    isActive
                      ? "border-fuchsia-400/70 bg-slate-900 shadow-[0_16px_40px_rgba(76,29,149,0.7)]"
                      : "border-slate-800 bg-slate-900/80 hover:border-fuchsia-400/60 hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-slate-100">
                      {chem} Chemistry
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {count} ch.
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{subtitle}</p>
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* Step 3: bundles */}
      <section className="space-y-3">
        <h2 className="text-lg md:text-xl font-semibold">Pick a bundle</h2>
        {filteredBundles.length === 0 ? (
          <p className="text-sm text-slate-400">
            No bundles yet for this combination in the mock data.
          </p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredBundles.map((bundle) => (
              <button
                key={bundle.id}
                type="button"
                onClick={() => handleBundleClick(bundle.id)}
                className="w-full group rounded-2xl border border-slate-800 bg-slate-950/95 px-3 sm:px-4 py-3 sm:py-4 text-left flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 hover:border-cyan-400/70 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(8,47,73,0.9)] transition-all"
              >
                {/* Thumbnail on the left, if provided */}
                {bundle.thumbnailUrl && (
                  <div className="relative w-full sm:w-32 md:w-40 h-36 sm:h-auto flex-shrink-0">
                    <img
                      src={bundle.thumbnailUrl}
                      alt={bundle.title}
                      className="w-full h-full object-cover rounded-xl border border-slate-800/70"
                    />
                  </div>
                )}

                {/* Middle content */}
                <div className="flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-slate-100">
                        {bundle.examCode}
                      </span>
                      <span className="text-[10px] uppercase text-slate-500">
                        Notes bundle
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-50 text-sm leading-snug line-clamp-2">
                      {bundle.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {bundle.description}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {bundle.chapters.length} chapters · PDF notes
                    </p>
                  </div>

                  <p className="mt-1 text-[11px] text-slate-500 group-hover:text-cyan-300/90 transition-colors flex items-center gap-1">
                    View bundle details &amp; price
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </p>
                </div>

                {/* Right side: price and small CTA */}
                <div className="flex flex-row sm:flex-col items-end sm:items-end justify-between sm:justify-between text-right sm:ml-2 gap-3 sm:gap-0">
                  <div>
                    {bundle.originalPriceInRupees &&
                      bundle.originalPriceInRupees > bundle.priceInRupees && (
                        <p className="text-[11px] text-emerald-400 font-semibold">
                          Offer
                        </p>
                      )}
                    <p className="text-lg font-bold text-slate-50">
                      ₹{bundle.priceInRupees.toLocaleString("en-IN")}
                    </p>
                    {bundle.originalPriceInRupees &&
                      bundle.originalPriceInRupees > bundle.priceInRupees && (
                        <p className="text-[11px] text-slate-500 line-through">
                          ₹{bundle.originalPriceInRupees.toLocaleString("en-IN")}
                        </p>
                      )}
                  </div>
                  <span className="mt-0 sm:mt-2 inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-semibold px-3 py-1">
                    Buy bundle
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
