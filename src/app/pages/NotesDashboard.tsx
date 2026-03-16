// src/app/pages/NotesDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardMiniSidebar } from "../components/DashboardMiniSidebar";
import {
  type Chapter,
  MOCK_EXAMS,
  MOCK_LATEST_BUNDLES,
} from "../../data/notesData";
import NeetLogo from "../../assests/neet.jpg";
import JeeMainLogo from "../../assests/JEE(mains).png";
import JeeAdvancedLogo from "../../assests/Jee-advanced.jpg";
import CbseLogo from "../../assests/CBSE.svg";
import { useRazorpayPayment } from "../hooks/useRazorpayPayment";
import { useMyBundles } from "../hooks/useMyBundles";
import { fetchPublicBundles, getCachedPublicBundles } from "../api/notesApi";

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

type BundleForCard = {
  id: string;
  title: string;
  description?: string;
  examCode?: string;
  priceInRupees?: number;
  actualPriceInRupees?: number | null;
  thumbnailUrl?: string | null;
  displayExamLabel?: string;
};

function BundleCardWithBuy({
  bundle,
  examId,
  isPurchased,
  onViewDetails,
}: {
  bundle: BundleForCard;
  examId: string;
  isPurchased: boolean;
  onViewDetails: () => void;
}) {
  const navigate = useNavigate();
  const { pay, loading, error } = useRazorpayPayment();
  const price = Number(bundle.priceInRupees ?? 0);
  const actualPrice = bundle.actualPriceInRupees != null ? Number(bundle.actualPriceInRupees) : null;
  const showDiscount = actualPrice != null && actualPrice > price;
  const discountPct = showDiscount ? Math.round((1 - price / actualPrice) * 100) : 0;

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    pay(bundle.id, bundle.title);
  };

  const handleCardClick = () => {
    if (isPurchased) {
      navigate(`/dashboard/my-notes/${examId}/bundle/${bundle.id}`);
    } else {
      onViewDetails();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      className="w-full group rounded-2xl border border-slate-800 bg-slate-950/95 px-3 sm:px-4 py-3 sm:py-4 text-left flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 hover:border-cyan-400/70 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(8,47,73,0.9)] transition-all cursor-pointer"
    >
      {bundle.thumbnailUrl && (
        <div className="relative w-full sm:w-32 md:w-40 aspect-video flex-shrink-0">
          <img
            src={bundle.thumbnailUrl}
            alt={bundle.title}
            className="w-full h-full object-contain rounded-xl border border-slate-800/70"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-slate-100">
              {bundle.displayExamLabel || bundle.examCode}
            </span>
            <span className="text-[10px] uppercase text-slate-500">
              Notes bundle
            </span>
          </div>
          <h3 className="font-semibold text-slate-50 text-sm leading-snug line-clamp-2">
            {bundle.title}
          </h3>
          <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {bundle.description || "Curated notes PDFs for this exam."}
          </p>
        </div>
        {error && (
          <p className="text-[11px] text-red-400 mt-1">{error}</p>
        )}
        <p className="mt-1 text-[11px] text-slate-500 group-hover:text-cyan-300/90 transition-colors flex items-center gap-1">
          {isPurchased ? "You own this bundle" : "View bundle details &amp; price"}
          {!isPurchased && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-row sm:flex-col items-end justify-between text-right sm:ml-2 shrink-0 gap-3 sm:gap-0">
        {isPurchased ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            Purchased
          </span>
        ) : (
          <>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-baseline gap-2 flex-wrap justify-end">
                <p className="text-lg font-bold text-slate-50">
                  ₹{price.toLocaleString("en-IN")}
                </p>
                {showDiscount && (
                  <>
                    <p className="text-sm text-slate-500 line-through">
                      ₹{actualPrice!.toLocaleString("en-IN")}
                    </p>
                    <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-semibold">
                      {discountPct}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleBuy}
              disabled={loading}
              className="mt-0 sm:mt-2 inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-semibold px-3 py-1.5 hover:from-cyan-300 hover:to-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Opening…" : "Buy bundle"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// PAGE 1: Select Exam
export function NotesExamPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-50">
      <DashboardMiniSidebar />
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 sm:px-6 py-5 sm:py-6 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
              <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1">
                Notes Library
              </span>
              <span className="text-slate-400 normal-case">
                Curated PDF notes, organized by exam and chemistry branch
              </span>
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Notes Library
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Find revision notes for JEE, NEET and CBSE. Pick your exam and
              chemistry type, browse bundles, and preview the first few pages
              of each PDF before you buy—then unlock full access to the notes
              you need.
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
                    onClick={() => navigate(`/dashboard/notes/${exam.id}`)}
                    className="relative min-w-0 rounded-[1.6rem] border border-slate-800/80 bg-slate-950/80 px-5 py-4 text-left transition-all hover:border-cyan-400/80 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(8,47,73,0.9)] overflow-hidden"
                  >
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
                      Browse {exam.name} notes for{" "}
                      <span className="text-cyan-300">Organic</span>,{" "}
                      <span className="text-violet-300">Inorganic</span> &amp;{" "}
                      <span className="text-sky-300">Physical</span> chemistry.
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 border border-slate-700/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        PDF bundles
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 border border-slate-700/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        Chapter-wise
                      </span>
                    </div>
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

// PAGE 2: Select Chemistry Type
export function NotesChemistryPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { bundles: purchasedBundles } = useMyBundles();
  const purchasedIds = useMemo(
    () => new Set((purchasedBundles || []).map((b) => b.id)),
    [purchasedBundles]
  );

  const exam = MOCK_EXAMS.find((e) => e.id === examId);

  const cachedBundles = useMemo(
    () => (exam ? getCachedPublicBundles(exam.id) : null),
    [exam]
  );

  const [bundlesForExam, setBundlesForExam] = useState<typeof MOCK_LATEST_BUNDLES>(
    (cachedBundles as any) ?? []
  );
  const [loading, setLoading] = useState(!cachedBundles);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBundles = async () => {
      if (!exam) return;
      setLoading(true);
      setError(null);
      try {
        const bundles = await fetchPublicBundles({ examCode: exam.id });
        setBundlesForExam(bundles as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bundles.");
      } finally {
        setLoading(false);
      }
    };

    void loadBundles();
  }, [exam]);

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

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Unknown exam. Go back to{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/notes")}
            className="text-cyan-400 underline"
          >
            exam selection
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
        <div className="w-full max-w-5xl space-y-8">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 sm:px-6 py-5 sm:py-6 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
            <button
              type="button"
              onClick={() => navigate("/dashboard/notes")}
              className="text-[11px] text-slate-400 hover:text-cyan-300"
            >
              ← Back to exams
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              {exam.name} · Notes Library
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Browse all available notes bundles for this exam. You can mix Organic,
              Inorganic and Physical topics inside each bundle.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Available bundles</h2>
            {loading && (
              <p className="text-sm text-slate-400">Loading bundles…</p>
            )}
            {!loading && error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            {!loading && !error && bundlesForExam.length === 0 && (
              <p className="text-sm text-slate-400">
                No notes bundles are available for this exam yet. Check back soon.
              </p>
            )}
            {!loading && error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            {!loading && !error && bundlesForExam.length > 0 && (
              <div className="space-y-4">
                {bundlesForExam.map((bundle) => (
                  <BundleCardWithBuy
                    key={bundle.id}
                    bundle={bundle}
                    examId={exam.id}
                    isPurchased={purchasedIds.has(bundle.id)}
                    onViewDetails={() => navigate(`/dashboard/bundles/${bundle.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// PAGE 3: Bundles Grid
export function NotesBundlesPage() {
  const { examId, chemType } = useParams<{ examId: string; chemType: string }>();
  const navigate = useNavigate();

  const exam = MOCK_EXAMS.find((e) => e.id === examId);
  const chemistryType =
    chemType === "organic"
      ? "Organic"
      : chemType === "inorganic"
      ? "Inorganic"
      : chemType === "physical"
      ? "Physical"
      : null;

  const filteredBundles = useMemo(() => {
    if (!exam) return [];
    let list = MOCK_LATEST_BUNDLES.filter(
      (b) => b.examCode.toLowerCase() === exam.code.toLowerCase()
    );
    if (chemistryType) {
      list = list.filter((b) =>
        b.chapters.some((ch) => ch.chemistryType === chemistryType)
      );
    }
    return list;
  }, [exam, chemistryType]);

  const handleBundleClick = (bundleId: string) => {
    navigate(`/dashboard/bundles/${bundleId}`);
  };

  if (!exam || !chemistryType) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300 text-sm">
          Invalid route.{" "}
          <button
            type="button"
            onClick={() => navigate("/dashboard/notes")}
            className="text-cyan-400 underline"
          >
            Go back to notes
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
        <div className="w-full max-w-5xl space-y-8">
          <header className="space-y-3 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 sm:px-6 py-5 sm:py-6 border border-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/notes/${exam.id}`)}
              className="text-[11px] text-slate-400 hover:text-cyan-300"
            >
              ← Back to chemistry type
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              {exam.name} · {chemistryType} Notes
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl">
              Pick a bundle to view details, preview chapters, and checkout.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Pick a bundle</h2>
            {filteredBundles.length === 0 ? (
              <p className="text-sm text-slate-400">
                No bundles yet for this combination.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBundles.map((bundle) => (
                  <button
                    key={bundle.id}
                    type="button"
                    onClick={() => handleBundleClick(bundle.id)}
                    className="group rounded-2xl border border-slate-800 bg-slate-950/95 px-4 py-4 text-left flex flex-col gap-3 hover:border-cyan-400/70 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(8,47,73,0.9)] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-slate-100">
                        {bundle.examCode}
                      </span>
                      <span className="text-[10px] uppercase text-slate-500">
                        Notes bundle
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-slate-50 text-sm leading-snug line-clamp-2">
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
