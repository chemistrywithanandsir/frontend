// src/app/pages/Admin.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChemText } from "../components/ChemText";
import { supabase } from "../../lib/supabaseClient";
import {
  Home,
  LayoutDashboard,
  ArrowLeft,
  Plus,
  UploadCloud,
  FileText,
  Package,
  FileSearch,
} from "lucide-react";
import { EXAM_CHAPTERS } from "../data/weightageChapters";
import { getWeightage, setWeightage } from "../utils/weightageStorage";
import {
  getShiftWeightageForJeeMain,
  setShiftWeightageForJeeMain,
  type ShiftEntry,
} from "../utils/shiftWeightageStorage";
import {
  saveExamWeightageAdmin,
  saveJeeMainShiftAdmin,
  fetchExamWeightagePublic,
} from "../utils/apiWeightage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const ADMIN_VERIFY_CACHE_KEY = "admin_anand_verified_v1";
const ADMIN_VERIFY_TTL_MS = 1000 * 60 * 60 * 12;
const PYQ_DRAFT_KEY = "admin_pyq_draft_v1";

type AdminVerifyCache = {
  email: string;
  verifiedAt: number;
};

function getFreshAdminVerifyCache(email: string | null): AdminVerifyCache | null {
  if (typeof window === "undefined" || !email) return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_VERIFY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminVerifyCache>;
    if (!parsed.email || typeof parsed.verifiedAt !== "number") return null;
    if (parsed.email !== email) return null;
    if (Date.now() - parsed.verifiedAt > ADMIN_VERIFY_TTL_MS) return null;
    return { email: parsed.email, verifiedAt: parsed.verifiedAt };
  } catch {
    return null;
  }
}

function setAdminVerifyCache(email: string | null) {
  if (typeof window === "undefined" || !email) return;
  const value: AdminVerifyCache = { email, verifiedAt: Date.now() };
  window.localStorage.setItem(ADMIN_VERIFY_CACHE_KEY, JSON.stringify(value));
}

function clearAdminVerifyCache() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_VERIFY_CACHE_KEY);
}

type PyqDraftState = {
  pyqTextMode: "normal" | "katex";
  pyqAddMode: "pdf" | "manual";
  pyqExamMode: "standard" | "cbse";
  cbseSubject: "" | "Physics" | "Chemistry" | "Maths";
  pyqExamType: string;
  pyqChemType: "Organic" | "Inorganic" | "Physical" | "";
  pyqYear: string;
  pyqChapterName: string;
  manualQuestionType: "MCQ" | "NUMERIC" | "MULTI";
  manualYear: string;
  manualQuestion: string;
  manualOpt1: string;
  manualOpt2: string;
  manualOpt3: string;
  manualOpt4: string;
  manualCorrectIndex: number;
  manualNumericAnswer: string;
  manualMultiCorrect: boolean[];
  manualSolution: string;
};

type AdminStatus =
  | "checking_auth"
  | "redirecting_to_google"
  | "calling_backend"
  | "not_admin"
  | "admin";

type ChemistryType = "Organic" | "Inorganic" | "Physical" | "";
type PyqTextMode = "normal" | "katex";

const CHEMISTRY_TYPE_OPTIONS: Exclude<ChemistryType, "">[] = [
  "Organic",
  "Inorganic",
  "Physical",
];

type ExamTypeInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
};

function ExamTypeInput({
  label,
  value,
  onChange,
  suggestions,
}: ExamTypeInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. NEET, JEE (Main), SAT"
        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {suggestions.map((exam) => (
            <button
              key={exam}
              type="button"
              onClick={() => onChange(exam)}
              className="px-2 py-1 rounded-full bg-slate-800 text-xs text-slate-200 hover:bg-cyan-600/30"
            >
              {exam}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function applyChemTag(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  onChange: (next: string) => void,
  tag: "sup" | "sub"
) {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const fallbackPos = value.length;
  const start = element?.selectionStart ?? fallbackPos;
  const end = element?.selectionEnd ?? fallbackPos;
  const selected = value.slice(start, end);
  const wrapped = `${open}${selected}${close}`;
  const next = value.slice(0, start) + wrapped + value.slice(end);
  onChange(next);

  requestAnimationFrame(() => {
    if (!element) return;
    const cursorStart = start + open.length;
    const cursorEnd = cursorStart + selected.length;
    element.focus();
    element.setSelectionRange(cursorStart, cursorEnd || cursorStart);
  });
}

function applyBoldTag(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  onChange: (next: string) => void
) {
  const open = "<b>";
  const close = "</b>";
  const fallbackPos = value.length;
  const start = element?.selectionStart ?? fallbackPos;
  const end = element?.selectionEnd ?? fallbackPos;
  const selected = value.slice(start, end);
  const wrapped = `${open}${selected}${close}`;
  const next = value.slice(0, start) + wrapped + value.slice(end);
  onChange(next);

  requestAnimationFrame(() => {
    if (!element) return;
    const cursorStart = start + open.length;
    const cursorEnd = cursorStart + selected.length;
    element.focus();
    element.setSelectionRange(cursorStart, cursorEnd || cursorStart);
  });
}

function applyFractionTag(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  onChange: (next: string) => void
) {
  const open = "<frac>";
  const close = "</frac>";
  const fallbackPos = value.length;
  const start = element?.selectionStart ?? fallbackPos;
  const end = element?.selectionEnd ?? fallbackPos;
  const selected = value.slice(start, end);
  const inner = selected && selected.includes("/") ? selected : "a/b";
  const wrapped = `${open}${inner}${close}`;
  const next = value.slice(0, start) + wrapped + value.slice(end);
  onChange(next);

  requestAnimationFrame(() => {
    if (!element) return;
    const slashIndex = inner.indexOf("/");
    const cursorStart = start + open.length;
    const cursorEnd =
      slashIndex > 0
        ? cursorStart + slashIndex
        : cursorStart + inner.length;
    element.focus();
    element.setSelectionRange(cursorStart, cursorEnd);
  });
}

function insertAtCursor(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  onChange: (next: string) => void,
  token: string
) {
  const fallbackPos = value.length;
  const start = element?.selectionStart ?? fallbackPos;
  const end = element?.selectionEnd ?? fallbackPos;
  const next = value.slice(0, start) + token + value.slice(end);
  onChange(next);

  requestAnimationFrame(() => {
    if (!element) return;
    const pos = start + token.length;
    element.focus();
    element.setSelectionRange(pos, pos);
  });
}

function wrapSelectionWithTokens(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  onChange: (next: string) => void,
  prefix: string,
  suffix: string,
  fallbackInner: string
) {
  const fallbackPos = value.length;
  const start = element?.selectionStart ?? fallbackPos;
  const end = element?.selectionEnd ?? fallbackPos;
  const selected = value.slice(start, end);
  const inner = selected || fallbackInner;
  const wrapped = `${prefix}${inner}${suffix}`;
  const next = value.slice(0, start) + wrapped + value.slice(end);
  onChange(next);

  requestAnimationFrame(() => {
    if (!element) return;
    const cursorStart = start + prefix.length;
    const cursorEnd = cursorStart + inner.length;
    element.focus();
    element.setSelectionRange(cursorStart, cursorEnd);
  });
}

function applyInlineLatex(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  onChange: (next: string) => void
) {
  wrapSelectionWithTokens(element, value, onChange, "$", "$", "x^2");
}

function applyBlockLatex(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  onChange: (next: string) => void
) {
  wrapSelectionWithTokens(
    element,
    value,
    onChange,
    "$$\n",
    "\n$$",
    "\\frac{a}{b}"
  );
}

function applyChemEquation(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  onChange: (next: string) => void
) {
  wrapSelectionWithTokens(
    element,
    value,
    onChange,
    "$\\ce{",
    "}$",
    "H2 + O2 -> H2O"
  );
}

const SYMBOL_GROUPS: Array<{ label: string; items: string[] }> = [
  {
    label: "Fractions",
    items: ["½", "⅓", "⅔", "¼", "¾", "⅛", "⅜", "⅝", "⅞", "(a)/(b)"],
  },
  {
    label: "Arrows",
    items: ["→", "←", "↔", "↑", "↓", "⇌", "⇄", "⇒", "⇐", "⇔", "↦", "⟶", "⟵", "↗", "↘"],
  },
  {
    label: "Operators",
    items: ["±", "∓", "×", "÷", "·", "√", "∛", "∑", "∏", "∫", "∞", "∂", "∆", "∇", "°"],
  },
  {
    label: "Relations",
    items: ["=", "≠", "≈", "≡", "<", ">", "≤", "≥", "∝", "∈", "∉", "⊂", "⊆", "⊄"],
  },
  {
    label: "Greek",
    items: ["α", "β", "γ", "δ", "Δ", "θ", "λ", "μ", "π", "σ", "Σ", "ω", "Ω", "φ", "χ"],
  },
  {
    label: "Chem/Math",
    items: ["↠", "⇀", "⇁", "⊥", "∥", "∠", "∴", "∵", "⊕", "⊖", "⊗", "⊘", "⊙", "∘", "→hν"],
  },
];

const REACTION_ARROWS: Array<{ label: string; token: string }> = [
  { label: "A ⟶ B", token: " ⟶ " },
  { label: "A ⇌ B", token: " ⇌ " },
  { label: "A ⟷ B", token: " ⟷ " },
  { label: "A ⟹ B", token: " ⟹ " },
  { label: "A ⟵ B", token: " ⟵ " },
];

function shouldShowChemPreview(value: string) {
  if (!value.trim()) return false;
  return /<(sup|sub|frac|b)>|\$\$?|\\\(|\\\[|\\ce\{|⟶|⟵|⟷|⇌|⇄|⟹|⇒|→|←|↔/i.test(value);
}

function ChemTagButtons(props: {
  value: string;
  onChange: (next: string) => void;
  targetRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
}) {
  const { value, onChange, targetRef } = props;
  const [showSymbols, setShowSymbols] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-slate-500">Insert:</span>
        <button
          type="button"
          onClick={() => applyChemTag(targetRef.current, value, onChange, "sup")}
          className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 hover:border-cyan-500/70 hover:text-cyan-200"
        >
          x²
        </button>
        <button
          type="button"
          onClick={() => applyChemTag(targetRef.current, value, onChange, "sub")}
          className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 hover:border-cyan-500/70 hover:text-cyan-200"
        >
          x₂
        </button>
        <button
          type="button"
          onClick={() => applyBoldTag(targetRef.current, value, onChange)}
          className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] font-bold text-slate-200 hover:border-cyan-500/70 hover:text-cyan-200"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => applyFractionTag(targetRef.current, value, onChange)}
          className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 hover:border-cyan-500/70 hover:text-cyan-200"
        >
          frac
        </button>
        <button
          type="button"
          onClick={() => applyInlineLatex(targetRef.current, value, onChange)}
          className="rounded-md border border-violet-700/70 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-100 hover:border-violet-400/80 hover:text-violet-50"
        >
          $x$
        </button>
        <button
          type="button"
          onClick={() => applyBlockLatex(targetRef.current, value, onChange)}
          className="rounded-md border border-violet-700/70 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-100 hover:border-violet-400/80 hover:text-violet-50"
        >
          $$x$$
        </button>
        <button
          type="button"
          onClick={() => applyChemEquation(targetRef.current, value, onChange)}
          className="rounded-md border border-fuchsia-700/70 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] text-fuchsia-100 hover:border-fuchsia-400/80 hover:text-fuchsia-50"
        >
          \ce{}
        </button>
        <button
          type="button"
          onClick={() => setShowSymbols((prev) => !prev)}
          className="rounded-md border border-cyan-700/70 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200 hover:bg-cyan-500/20"
        >
          {showSymbols ? "Hide symbols" : "More symbols"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-slate-500">Reaction:</span>
        {REACTION_ARROWS.map((arrow) => (
          <button
            key={arrow.label}
            type="button"
            onClick={() => insertAtCursor(targetRef.current, value, onChange, arrow.token)}
            className="rounded-md border border-emerald-700/70 bg-emerald-500/10 px-2.5 py-1 text-sm leading-none text-emerald-200 hover:bg-emerald-500/20"
            title={`Insert ${arrow.token.trim()}`}
          >
            {arrow.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-slate-500">
        {"KaTeX: use $...$, $$...$$, or $\\ce{...}$ for chemistry equations and reactions."}
      </p>

      {showSymbols ? (
        <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-2.5 space-y-2">
          {SYMBOL_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((symbol) => (
                  <button
                    key={`${group.label}-${symbol}`}
                    type="button"
                    onClick={() => insertAtCursor(targetRef.current, value, onChange, symbol)}
                    className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 hover:border-cyan-500/70 hover:text-cyan-200"
                    title={`Insert ${symbol}`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type ChemTextInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value: string;
  onValueChange: (next: string) => void;
  mode?: PyqTextMode;
};

function ChemTextInput({
  value,
  onValueChange,
  className,
  mode = "katex",
  ...rest
}: ChemTextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedClassName = `w-full ${className ?? ""}`.trim();
  const isKatexMode = mode === "katex";
  const showPreview = isKatexMode && shouldShowChemPreview(value);
  return (
    <div className="space-y-1.5">
      {isKatexMode ? (
        <ChemTagButtons
          value={value}
          onChange={onValueChange}
          targetRef={inputRef}
        />
      ) : null}
      <input
        {...rest}
        ref={inputRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={mergedClassName}
      />
      {showPreview ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 overflow-hidden">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Preview
          </p>
          <ChemText text={value} className="text-sm text-slate-100" />
        </div>
      ) : null}
    </div>
  );
}

type ChemTextTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
> & {
  value: string;
  onValueChange: (next: string) => void;
  mode?: PyqTextMode;
};

function ChemTextTextarea({
  value,
  onValueChange,
  className,
  mode = "katex",
  ...rest
}: ChemTextTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mergedClassName = `w-full ${className ?? ""}`.trim();
  const isKatexMode = mode === "katex";
  const showPreview = isKatexMode && shouldShowChemPreview(value);
  return (
    <div className="space-y-1.5">
      {isKatexMode ? (
        <ChemTagButtons
          value={value}
          onChange={onValueChange}
          targetRef={textareaRef}
        />
      ) : null}
      <textarea
        {...rest}
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={mergedClassName}
      />
      {showPreview ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 overflow-hidden">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Preview
          </p>
          <ChemText text={value} className="text-sm text-slate-100" />
        </div>
      ) : null}
    </div>
  );
}

function PyqTextModeToggle(props: {
  mode: PyqTextMode;
  onChange: (mode: PyqTextMode) => void;
  compact?: boolean;
}) {
  const { mode, onChange, compact = false } = props;
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950/50 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Text mode
          </p>
          <p className="text-[11px] text-slate-500">
            Choose plain text or full KaTeX/chemistry syntax for PYQ writing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange("normal")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              mode === "normal"
                ? "border-slate-400 bg-slate-200/10 text-slate-100"
                : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-500"
            }`}
          >
            Normal text
          </button>
          <button
            type="button"
            onClick={() => onChange("katex")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              mode === "katex"
                ? "border-violet-400 bg-violet-500/15 text-violet-100"
                : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-violet-500/60"
            }`}
          >
            KaTeX / chemistry
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminAnandPage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AdminStatus>("checking_auth");
  const [email, setEmail] = useState<string | null>(null);

  // dynamic exam type suggestions built from previous actions, seeded with common exams
  const [examTypes, setExamTypes] = useState<string[]>([
    "NEET",
    "JEE Main",
    "JEE Advanced",
    "CBSE",
  ]);

  const [pyqExamType, setPyqExamType] = useState("");
  const [notesExamType, setNotesExamType] = useState("");
  const [bundleSourceExamType, setBundleSourceExamType] = useState("");
  const [bundleTargetExamType, setBundleTargetExamType] = useState("");
  const [pyqTextMode, setPyqTextMode] = useState<PyqTextMode>("normal");

  const [pyqChemType, setPyqChemType] = useState<ChemistryType>("");
  const [notesChemType, setNotesChemType] = useState<ChemistryType>("");
  const [bundleChemType, setBundleChemType] = useState<ChemistryType>("");

  type AdminSection = "main" | "user-dashboard" | "homepage" | "exam-weightage";
  const [adminSection, setAdminSection] = useState<AdminSection>("main");
  const [selectedExamId, setSelectedExamId] = useState<string>("neet");
  const [weightageYear, setWeightageYear] = useState<string>("2025");
  const [weightageByYear, setWeightageByYear] = useState<Record<string, Record<string, number>>>({});
  const [weightageValues, setWeightageValues] = useState<Record<string, number>>({});
  const [shiftEntries, setShiftEntries] = useState<ShiftEntry[]>([]);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftMonth, setShiftMonth] = useState<"Jan" | "April">("Jan");
  const [shiftDayLabel, setShiftDayLabel] = useState("");
  const [shiftSlot, setShiftSlot] = useState<"Shift 1" | "Shift 2">("Shift 1");
  const [shiftQuestions, setShiftQuestions] = useState<number | "">("");
  const [shiftPhysical, setShiftPhysical] = useState<number | "">("");
  const [shiftInorganic, setShiftInorganic] = useState<number | "">("");
  const [shiftOrganic, setShiftOrganic] = useState<number | "">("");
  const [shiftChapterwiseNote, setShiftChapterwiseNote] = useState("");
  const [newYearInput, setNewYearInput] = useState("");
  const [weightageSaved, setWeightageSaved] = useState(false);

  // PYQ upload
  type AdminPyqQuestion = {
    id: string;
    exam_code?: string;
    year?: number;
    chapter_name?: string;
    chemistry_type?: string | null;
    question_number?: number;
    question_text: string;
    answer_type?: "MCQ" | "NUMERIC" | "MULTI" | string;
    options?: string[];
    correct_index?: number | null;
    correct_answer?: string | null;
    solution_text?: string | null;
    question_image_urls?: string[];
    option_image_urls?: string[];
    solution_image_urls?: string[];
  };

  const [pyqYear, setPyqYear] = useState("");
  const [pyqChapterName, setPyqChapterName] = useState("");
  const [pyqMaxQuestions, setPyqMaxQuestions] = useState("");
  const [pyqUploading, setPyqUploading] = useState(false);
  const [pyqMessage, setPyqMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const pyqFileInputRef = useRef<HTMLInputElement>(null);
  const [pyqAddMode, setPyqAddMode] = useState<"pdf" | "manual">("pdf");
  const [pyqQuestions, setPyqQuestions] = useState<AdminPyqQuestion[]>([]);
  const [pyqQuestionsLoading, setPyqQuestionsLoading] = useState(false);
  const [pyqEditingQuestion, setPyqEditingQuestion] = useState<AdminPyqQuestion | null>(null);
  const [pyqEditSaving, setPyqEditSaving] = useState(false);
  const [pyqDeleteBusyId, setPyqDeleteBusyId] = useState<string | null>(null);
  const [pyqBrowseAll, setPyqBrowseAll] = useState(false);
  const [pyqBrowseExam, setPyqBrowseExam] = useState<string>(""); // "" => all
  const [pyqBrowseYear, setPyqBrowseYear] = useState<string>(""); // "" => all
  const [pyqBrowseChapter, setPyqBrowseChapter] = useState<string>(""); // "" => all
  const [pyqImageUploading, setPyqImageUploading] = useState<
    | null
    | {
        target: "stem" | "option" | "solution";
        optionIndex?: number;
        replaceIndex?: number;
      }
  >(null);
  const [pyqImageDeleting, setPyqImageDeleting] = useState<
    | null
    | {
        target: "stem" | "option" | "solution";
        optionIndex?: number;
        removeIndex?: number;
      }
  >(null);

  const uploadQuestionImage = async (args: {
    questionId: string;
    target: "stem" | "option" | "solution";
    file: File;
    optionIndex?: number;
    replaceIndex?: number;
  }) => {
    const { questionId, target, file, optionIndex, replaceIndex } = args;
    setPyqMessage(null);
    setPyqImageUploading({ target, optionIndex, replaceIndex });
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        throw new Error("Not signed in.");
      }

      const form = new FormData();
      form.append("question_id", questionId);
      form.append("target", target);
      if (typeof optionIndex === "number") {
        form.append("option_index", String(optionIndex));
      }
      if (typeof replaceIndex === "number") {
        form.append("replace_index", String(replaceIndex));
      }
      form.append("file", file);

      const res = await fetch(
        `${API_BASE}/admin/pyq/questions/images/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          (Array.isArray(json.detail)
            ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
            : json.detail) || res.statusText;
        throw new Error(detail);
      }

      const nextStem = Array.isArray(json.question_image_urls)
        ? (json.question_image_urls as string[])
        : undefined;
      const nextOpt = Array.isArray(json.option_image_urls)
        ? (json.option_image_urls as string[])
        : undefined;
      const nextSol = Array.isArray(json.solution_image_urls)
        ? (json.solution_image_urls as string[])
        : undefined;

      setPyqQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== questionId) return q;
          return {
            ...q,
            question_image_urls: nextStem ?? q.question_image_urls,
            option_image_urls: nextOpt ?? q.option_image_urls,
            solution_image_urls: nextSol ?? q.solution_image_urls,
          };
        })
      );
      setPyqEditingQuestion((prev) => {
        if (!prev || prev.id !== questionId) return prev;
        return {
          ...prev,
          question_image_urls: nextStem ?? prev.question_image_urls,
          option_image_urls: nextOpt ?? prev.option_image_urls,
          solution_image_urls: nextSol ?? prev.solution_image_urls,
        };
      });
    } catch (err) {
      setPyqMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to upload image.",
      });
    } finally {
      setPyqImageUploading(null);
    }
  };

  const deleteQuestionImage = async (args: {
    questionId: string;
    target: "stem" | "option" | "solution";
    optionIndex?: number;
    removeIndex?: number;
  }) => {
    const { questionId, target, optionIndex, removeIndex } = args;
    setPyqMessage(null);
    setPyqImageDeleting({ target, optionIndex, removeIndex });
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        throw new Error("Not signed in.");
      }

      const form = new FormData();
      form.append("question_id", questionId);
      form.append("target", target);
      if (typeof optionIndex === "number") {
        form.append("option_index", String(optionIndex));
      }
      if (typeof removeIndex === "number") {
        form.append("remove_index", String(removeIndex));
      }

      const res = await fetch(
        `${API_BASE}/admin/pyq/questions/images/delete`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          (Array.isArray(json.detail)
            ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
            : json.detail) || res.statusText;
        throw new Error(detail);
      }

      const nextStem = Array.isArray(json.question_image_urls)
        ? (json.question_image_urls as string[])
        : undefined;
      const nextOpt = Array.isArray(json.option_image_urls)
        ? (json.option_image_urls as string[])
        : undefined;
      const nextSol = Array.isArray(json.solution_image_urls)
        ? (json.solution_image_urls as string[])
        : undefined;

      setPyqQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== questionId) return q;
          return {
            ...q,
            question_image_urls: nextStem ?? q.question_image_urls,
            option_image_urls: nextOpt ?? q.option_image_urls,
            solution_image_urls: nextSol ?? q.solution_image_urls,
          };
        })
      );
      setPyqEditingQuestion((prev) => {
        if (!prev || prev.id !== questionId) return prev;
        return {
          ...prev,
          question_image_urls: nextStem ?? prev.question_image_urls,
          option_image_urls: nextOpt ?? prev.option_image_urls,
          solution_image_urls: nextSol ?? prev.solution_image_urls,
        };
      });
      setPyqMessage({ type: "success", text: "Image removed." });
    } catch (err) {
      setPyqMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to remove image.",
      });
    } finally {
      setPyqImageDeleting(null);
    }
  };

  const loadMyPyqQuestions = async () => {
    try {
      if (userDashboardPanel !== "pyq") return;

      const selectedExamLabel = pyqBrowseAll
        ? (pyqBrowseExam || "").trim()
        : pyqExamMode === "cbse"
          ? "cbse"
          : (pyqExamType || "").trim();
      const selectedYearVal = pyqBrowseAll
        ? (pyqBrowseYear || "").trim()
        : pyqAddMode === "manual"
          ? manualYear.trim()
          : pyqYear.trim();
      const selectedChapter = pyqBrowseAll
        ? (pyqBrowseChapter || "").trim()
        : (pyqChapterName || "").trim();

      // If browsing all, we can load without requiring exam selection.
      if (!pyqBrowseAll && !selectedExamLabel) {
        setPyqQuestions([]);
        setPyqEditingQuestion(null);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setPyqQuestions([]);
        setPyqEditingQuestion(null);
        return;
      }

      setPyqQuestionsLoading(true);
      let url = "";
      if (pyqBrowseAll) {
        url = `${API_BASE}/admin/pyq/questions/all`;
      } else {
        const params = new URLSearchParams();
        params.set("exam_type", selectedExamLabel);
        // Year is optional for listing; if provided, narrow results server-side.
        if (selectedYearVal) {
          params.set("year", selectedYearVal);
        }
        url = `${API_BASE}/admin/pyq/questions/list?${params.toString()}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          (Array.isArray((json as any).detail)
            ? (json as any).detail
                .map((d: { msg?: string }) => d.msg)
                .join(" ")
            : (json as any).detail) || res.statusText;
        throw new Error(detail);
      }

      const list: any[] = Array.isArray((json as any).questions)
        ? (json as any).questions
        : [];
      const norm = (s: unknown) => String(s || "").toLowerCase().trim();
      const normKey = (s: unknown) => norm(s).replace(/[^a-z0-9]+/g, "");
      const wantExam = normKey(selectedExamLabel);
      const wantChapter = norm(selectedChapter);
      const filtered = list.filter((q) => {
        const matchesExam = wantExam
          ? normKey((q as any).exam_code).includes(wantExam)
          : true;
        const matchesYear = selectedYearVal ? String((q as any).year || "") === selectedYearVal : true;
        const matchesChapter = wantChapter ? norm((q as any).chapter_name).includes(wantChapter) : true;
        return matchesExam && matchesYear && matchesChapter;
      });
      setPyqQuestions(
        filtered.map((q) => ({
          id: q.id,
          exam_code: (q.exam_code as string | undefined) || selectedExamLabel,
          year: q.year,
          chapter_name: q.chapter_name,
          chemistry_type: q.chemistry_type ?? null,
          question_number: q.question_number,
          question_text: q.question_text,
          answer_type: q.answer_type,
          options: Array.isArray(q.options) ? q.options : [],
          correct_index:
            typeof q.correct_index === "number" ? q.correct_index : null,
          correct_answer:
            typeof q.correct_answer === "string" ? q.correct_answer : null,
          solution_text:
            typeof q.solution_text === "string" ? q.solution_text : null,
          question_image_urls: Array.isArray(q.question_image_urls) ? q.question_image_urls : [],
          option_image_urls: Array.isArray(q.option_image_urls) ? q.option_image_urls : [],
          solution_image_urls: Array.isArray(q.solution_image_urls) ? q.solution_image_urls : [],
        }))
      );
    } catch (err) {
      setPyqQuestions([]);
      setPyqEditingQuestion(null);
      setPyqMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load questions.",
      });
    } finally {
      setPyqQuestionsLoading(false);
    }
  };

  const loadMyNotes = async () => {
    try {
      if (userDashboardPanel !== "notes") return;

      setNotesListLoading(true);
      setNotesListError(null);

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setNotesList([]);
        setNotesListLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/admin/notes/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          (Array.isArray((json as any).detail)
            ? (json as any).detail
                .map((d: { msg?: string }) => d.msg)
                .join(" ")
            : (json as any).detail) || res.statusText;
        throw new Error(detail);
      }

      const list: any[] = Array.isArray((json as any).notes)
        ? (json as any).notes
        : [];
      setNotesList(
        list.map((n) => ({
          id: n.id,
          exam_id: n.exam_id,
          chemistry_type: n.chemistry_type ?? null,
          subject: n.subject ?? null,
          title: n.title,
          pdf_url: n.pdf_url,
          created_at: n.created_at,
        }))
      );
    } catch (err) {
      setNotesListError(
        err instanceof Error ? err.message : "Failed to load notes."
      );
      setNotesList([]);
    } finally {
      setNotesListLoading(false);
    }
  };

  // PYQ exam mode: standard (JEE/NEET chemistry) vs CBSE (Physics/Chemistry/Maths)
  const [pyqExamMode, setPyqExamMode] = useState<"standard" | "cbse">("standard");
  const [cbseSubject, setCbseSubject] = useState<"" | "Physics" | "Chemistry" | "Maths">("");
  type PyqUploadPanel = "select-exam-mode" | "jee-neet" | "cbse";
  const [pyqUploadPanel, setPyqUploadPanel] = useState<PyqUploadPanel>("select-exam-mode");

  // Manual PYQ (images)
  type ManualQuestionType = "MCQ" | "NUMERIC" | "MULTI";
  const [manualQuestionType, setManualQuestionType] = useState<ManualQuestionType>("MCQ");
  const [manualYear, setManualYear] = useState("");
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualOpt1, setManualOpt1] = useState("");
  const [manualOpt2, setManualOpt2] = useState("");
  const [manualOpt3, setManualOpt3] = useState("");
  const [manualOpt4, setManualOpt4] = useState("");
  const [manualCorrectIndex, setManualCorrectIndex] = useState(0);
  const [manualNumericAnswer, setManualNumericAnswer] = useState("");
  const [manualMultiCorrect, setManualMultiCorrect] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [manualSolution, setManualSolution] = useState("");
  const manualStemImagesRef = useRef<HTMLInputElement>(null);
  const manualOpt1ImageRef = useRef<HTMLInputElement>(null);
  const manualOpt2ImageRef = useRef<HTMLInputElement>(null);
  const manualOpt3ImageRef = useRef<HTMLInputElement>(null);
  const manualOpt4ImageRef = useRef<HTMLInputElement>(null);
  const manualSolutionImagesRef = useRef<HTMLInputElement>(null);
  const [manualPastedStemImages, setManualPastedStemImages] = useState<File[]>([]);
  const [manualPastedSolutionImages, setManualPastedSolutionImages] = useState<File[]>([]);
  const [manualPastedOptionImages, setManualPastedOptionImages] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const readClipboardImageFiles = async (): Promise<File[]> => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.read) {
      throw new Error("Clipboard image paste is not supported in this browser.");
    }
    const items = await navigator.clipboard.read();
    const files: File[] = [];
    for (const item of items) {
      for (const type of item.types) {
        if (!type.startsWith("image/")) continue;
        const blob = await item.getType(type);
        const ext = type.split("/")[1] || "png";
        files.push(new File([blob], `clipboard-${Date.now()}.${ext}`, { type }));
      }
    }
    return files;
  };

  const pasteClipboardImagesToTarget = async (
    target: "stem" | "solution" | "option",
    optionIndex?: number
  ) => {
    try {
      const files = await readClipboardImageFiles();
      if (!files.length) {
        setPyqMessage({ type: "error", text: "No image found in clipboard." });
        return;
      }

      if (target === "stem") {
        setManualPastedStemImages((prev) => [...prev, ...files]);
      } else if (target === "solution") {
        setManualPastedSolutionImages((prev) => [...prev, ...files]);
      } else {
        const idx = typeof optionIndex === "number" ? optionIndex : 0;
        setManualPastedOptionImages((prev) => {
          const next = [...prev];
          next[idx] = files[0] ?? null;
          return next;
        });
      }

      setPyqMessage({
        type: "success",
        text:
          target === "option"
            ? "Pasted option image from clipboard."
            : `Pasted ${files.length} image${files.length > 1 ? "s" : ""} from clipboard.`,
      });
    } catch (err) {
      setPyqMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Could not read image from clipboard.",
      });
    }
  };

  const pasteClipboardImageForQuestionEdit = async (args: {
    questionId: string;
    target: "stem" | "option" | "solution";
    optionIndex?: number;
    replaceIndex?: number;
  }) => {
    try {
      const files = await readClipboardImageFiles();
      const file = files[0];
      if (!file) {
        setPyqMessage({ type: "error", text: "No image found in clipboard." });
        return;
      }
      await uploadQuestionImage({ ...args, file });
      setPyqMessage({
        type: "success",
        text:
          args.target === "option"
            ? `Pasted screenshot and updated option ${
                (typeof args.optionIndex === "number" ? args.optionIndex : 0) + 1
              } image.`
            : "Pasted screenshot and updated image.",
      });
    } catch (err) {
      setPyqMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Could not read image from clipboard.",
      });
    }
  };

  // Restore draft inputs for PYQ add/edit flow (files cannot be restored by browser security rules)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(PYQ_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<PyqDraftState>;

      if (draft.pyqTextMode === "normal" || draft.pyqTextMode === "katex") {
        setPyqTextMode(draft.pyqTextMode);
      }

      if (draft.pyqAddMode === "pdf" || draft.pyqAddMode === "manual") {
        setPyqAddMode(draft.pyqAddMode);
      }
      if (draft.pyqExamMode === "standard" || draft.pyqExamMode === "cbse") {
        setPyqExamMode(draft.pyqExamMode);
      }
      if (
        draft.cbseSubject === "" ||
        draft.cbseSubject === "Physics" ||
        draft.cbseSubject === "Chemistry" ||
        draft.cbseSubject === "Maths"
      ) {
        setCbseSubject(draft.cbseSubject);
      }
      if (typeof draft.pyqExamType === "string") setPyqExamType(draft.pyqExamType);
      if (
        draft.pyqChemType === "" ||
        draft.pyqChemType === "Organic" ||
        draft.pyqChemType === "Inorganic" ||
        draft.pyqChemType === "Physical"
      ) {
        setPyqChemType(draft.pyqChemType);
      }
      if (typeof draft.pyqYear === "string") setPyqYear(draft.pyqYear);
      if (typeof draft.pyqChapterName === "string") setPyqChapterName(draft.pyqChapterName);
      if (
        draft.manualQuestionType === "MCQ" ||
        draft.manualQuestionType === "NUMERIC" ||
        draft.manualQuestionType === "MULTI"
      ) {
        setManualQuestionType(draft.manualQuestionType);
      }
      if (typeof draft.manualYear === "string") setManualYear(draft.manualYear);
      if (typeof draft.manualQuestion === "string") setManualQuestion(draft.manualQuestion);
      if (typeof draft.manualOpt1 === "string") setManualOpt1(draft.manualOpt1);
      if (typeof draft.manualOpt2 === "string") setManualOpt2(draft.manualOpt2);
      if (typeof draft.manualOpt3 === "string") setManualOpt3(draft.manualOpt3);
      if (typeof draft.manualOpt4 === "string") setManualOpt4(draft.manualOpt4);
      if (typeof draft.manualCorrectIndex === "number") setManualCorrectIndex(Math.max(0, Math.min(3, draft.manualCorrectIndex)));
      if (typeof draft.manualNumericAnswer === "string") setManualNumericAnswer(draft.manualNumericAnswer);
      if (Array.isArray(draft.manualMultiCorrect)) {
        const next = [false, false, false, false];
        for (let i = 0; i < 4; i += 1) {
          next[i] = Boolean(draft.manualMultiCorrect[i]);
        }
        setManualMultiCorrect(next);
      }
      if (typeof draft.manualSolution === "string") setManualSolution(draft.manualSolution);
    } catch {
      // ignore invalid draft payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft: PyqDraftState = {
      pyqTextMode,
      pyqAddMode,
      pyqExamMode,
      cbseSubject,
      pyqExamType,
      pyqChemType,
      pyqYear,
      pyqChapterName,
      manualQuestionType,
      manualYear,
      manualQuestion,
      manualOpt1,
      manualOpt2,
      manualOpt3,
      manualOpt4,
      manualCorrectIndex,
      manualNumericAnswer,
      manualMultiCorrect,
      manualSolution,
    };
    window.sessionStorage.setItem(PYQ_DRAFT_KEY, JSON.stringify(draft));
  }, [
    pyqTextMode,
    pyqAddMode,
    pyqExamMode,
    cbseSubject,
    pyqExamType,
    pyqChemType,
    pyqYear,
    pyqChapterName,
    manualQuestionType,
    manualYear,
    manualQuestion,
    manualOpt1,
    manualOpt2,
    manualOpt3,
    manualOpt4,
    manualCorrectIndex,
    manualNumericAnswer,
    manualMultiCorrect,
    manualSolution,
  ]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevRootBg = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#020617";
    document.body.style.backgroundColor = "#020617";
    return () => {
      document.documentElement.style.backgroundColor = prevRootBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  // Scroll targets for main admin sections
  const pyqSectionRef = useRef<HTMLDivElement | null>(null);
  const notesSectionRef = useRef<HTMLDivElement | null>(null);
  const bundleSectionRef = useRef<HTMLDivElement | null>(null);

  // Which detailed panel is currently visible in the UserDashboard admin view
  const [userDashboardPanel, setUserDashboardPanel] = useState<
    "none" | "pyq" | "notes" | "bundles"
  >("none");

  // Notes upload state
  const [notesTitle, setNotesTitle] = useState("");
  const [notesUploading, setNotesUploading] = useState(false);
  const [notesMessage, setNotesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const notesFileInputRef = useRef<HTMLInputElement>(null);
  const notesThumbnailInputRef = useRef<HTMLInputElement>(null);
  const [notesExamMode, setNotesExamMode] = useState<"standard" | "cbse">("standard");
  const [notesCbseSubject, setNotesCbseSubject] = useState<"" | "Physics" | "Chemistry" | "Maths">("");

  // Notes bundle maker state
  const [bundleSourceExamMode, setBundleSourceExamMode] = useState<"standard" | "cbse">("standard");
  const [bundleCbseSubject, setBundleCbseSubject] = useState<"" | "Physics" | "Chemistry" | "Maths">("");
  type NotesRecord = {
    id: string;
    exam_id: string;
    chemistry_type: string | null;
    subject: string | null;
    title: string;
    pdf_url: string;
    created_at: string;
  };
  const [notesList, setNotesList] = useState<NotesRecord[]>([]);
  const [notesListLoading, setNotesListLoading] = useState(false);
  const [notesListError, setNotesListError] = useState<string | null>(null);
  const [notesDeleteBusyId, setNotesDeleteBusyId] = useState<string | null>(null);
  const [bundleNotes, setBundleNotes] = useState<NotesRecord[]>([]);
  const [bundleNotesSearch, setBundleNotesSearch] = useState("");
  const [allBundleNotes, setAllBundleNotes] = useState<Record<string, NotesRecord>>({});
  const [bundleNotesLoading, setBundleNotesLoading] = useState(false);
  const [bundleNotesError, setBundleNotesError] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [bundleTargetExamSelections, setBundleTargetExamSelections] = useState<string[]>([]);
  const [bundleTitle, setBundleTitle] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState<string>("");
  const [bundleActualPrice, setBundleActualPrice] = useState<string>("");
  const [bundleMessage, setBundleMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [bundleSaving, setBundleSaving] = useState(false);
  const bundleThumbnailInputRef = useRef<HTMLInputElement>(null);
  type NotesBundleRecord = {
    id: string;
    exam_id: string | null;
    display_exam_label: string | null;
    title: string | null;
    description: string | null;
    price: number | null;
    actual_price: number | null;
    thumbnail_url: string | null;
    created_at: string | null;
  };
  const [notesBundles, setNotesBundles] = useState<NotesBundleRecord[]>([]);
  const [notesBundlesLoading, setNotesBundlesLoading] = useState(false);
  const [notesBundlesError, setNotesBundlesError] = useState<string | null>(null);
  const [editingBundle, setEditingBundle] = useState<NotesBundleRecord | null>(null);
  const [editingBundleNotes, setEditingBundleNotes] = useState<NotesRecord[]>([]);
  const [editingBundleNoteIds, setEditingBundleNoteIds] = useState<string[]>([]);
  const [editingBundleNotesLoading, setEditingBundleNotesLoading] = useState(false);

  const filteredBundleNotes = useMemo(() => {
    const query = bundleNotesSearch.trim().toLowerCase();
    if (!query) return bundleNotes;
    return bundleNotes.filter((note) => {
      const haystack = [
        note.title,
        note.chemistry_type ?? "",
        note.subject ?? "",
        note.exam_id ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [bundleNotes, bundleNotesSearch]);

  // Whenever we enter the UserDashboard admin section, start from the action cards view
  useEffect(() => {
    if (adminSection === "user-dashboard") {
      setUserDashboardPanel("none");
      setPyqUploadPanel("select-exam-mode");
      setPyqBrowseAll(false);
    }
  }, [adminSection]);

  // Whenever we open the PYQ uploads panel, start from JEE/NEET vs CBSE choice
  useEffect(() => {
    if (userDashboardPanel === "pyq") {
      if (pyqBrowseAll) {
        // "See uploaded PYQs" should jump directly into the main PYQ screen
        // (and auto-load all questions), not the exam-choice screen.
        setPyqUploadPanel("jee-neet");
        setPyqExamMode("standard");
      } else {
        setPyqUploadPanel("select-exam-mode");
        setPyqExamMode("standard");
        setCbseSubject("");
      }
    }
  }, [userDashboardPanel, pyqBrowseAll]);

  // Auto-load "My uploaded PYQs" whenever exam/year changes or after upload.
  useEffect(() => {
    if (userDashboardPanel !== "pyq") return;
    void loadMyPyqQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userDashboardPanel,
    pyqExamMode,
    pyqExamType,
    pyqYear,
    manualYear,
    pyqChapterName,
    pyqBrowseAll,
    pyqBrowseExam,
    pyqBrowseYear,
    pyqBrowseChapter,
    pyqAddMode,
  ]);

  useEffect(() => {
    const handler = () => {
      void loadMyPyqQuestions();
    };
    window.addEventListener("pyq-uploaded", handler as EventListener);
    return () => {
      window.removeEventListener("pyq-uploaded", handler as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDashboardPanel]);

  // Auto-load notes list whenever the notes panel is opened.
  useEffect(() => {
    if (userDashboardPanel !== "notes") return;
    void loadMyNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDashboardPanel]);

  // Refresh notes list after a successful upload via a custom event.
  useEffect(() => {
    const handler = () => {
      void loadMyNotes();
    };
    window.addEventListener("notes-uploaded", handler as EventListener);
    return () => {
      window.removeEventListener("notes-uploaded", handler as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch notes for bundle maker whenever filters change and bundles panel is open
  useEffect(() => {
    const loadNotesForBundle = async () => {
      if (userDashboardPanel !== "bundles") return;

      setBundleNotesLoading(true);
      setBundleNotesError(null);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setBundleNotesError("Not signed in.");
          setBundleNotesLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (bundleSourceExamMode === "cbse") {
          params.set("exam_type", "CBSE");
          if (bundleCbseSubject) {
            params.set("subject", bundleCbseSubject);
          }
        } else {
          if (bundleSourceExamType.trim()) {
            params.set("exam_type", bundleSourceExamType.trim());
          }
          if (bundleChemType) {
            params.set("chemistry_type", bundleChemType);
          }
        }

        const qs = params.toString();
        const url = qs
          ? `${API_BASE}/admin/notes/list?${qs}`
          : `${API_BASE}/admin/notes/list`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) {
          const detail = Array.isArray(json.detail)
            ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
            : json.detail;
          throw new Error(detail || res.statusText || "Failed to load notes.");
        }

        const fetched: NotesRecord[] = Array.isArray(json.notes) ? json.notes : [];
        setBundleNotes(fetched);
        // Merge into global map so selections survive when switching filters
        setAllBundleNotes((prev) => {
          const next = { ...prev };
          for (const n of fetched) {
            next[n.id] = n;
          }
          return next;
        });
      } catch (err) {
        setBundleNotesError(err instanceof Error ? err.message : "Failed to load notes.");
        setBundleNotes([]);
      } finally {
        setBundleNotesLoading(false);
      }
    };

    void loadNotesForBundle();
  }, [userDashboardPanel, bundleSourceExamMode, bundleSourceExamType, bundleChemType, bundleCbseSubject]);

  // Load existing notes bundles when bundle panel is open
  useEffect(() => {
    const loadBundles = async () => {
      if (userDashboardPanel !== "bundles") return;
      setNotesBundlesLoading(true);
      setNotesBundlesError(null);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setNotesBundlesError("Not signed in.");
          setNotesBundlesLoading(false);
          return;
        }
      const res = await fetch(`${API_BASE}/admin/notes/bundles/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) {
          const detail = Array.isArray(json.detail)
            ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
            : json.detail;
          throw new Error(detail || res.statusText || "Failed to load bundles.");
        }
        const list: NotesBundleRecord[] = Array.isArray(json.bundles)
          ? json.bundles
          : [];
        setNotesBundles(list);
      } catch (err) {
        setNotesBundlesError(err instanceof Error ? err.message : "Failed to load bundles.");
        setNotesBundles([]);
      } finally {
        setNotesBundlesLoading(false);
      }
    };

    void loadBundles();
  }, [userDashboardPanel]);

  const addExamType = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setExamTypes((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
  };

  // 1) If not logged in, trigger Google login with redirect back to /admin/anand
  useEffect(() => {
    if (loading) return;

    if (!user) {
      clearAdminVerifyCache();
      setStatus("redirecting_to_google");
      void signInWithGoogle("/admin/anand");
      return;
    }

    const userEmail = user.email ?? null;
    setEmail(userEmail);
    if (getFreshAdminVerifyCache(userEmail)) {
      setStatus("admin");
      return;
    }
    setStatus("calling_backend");
  }, [user, loading, signInWithGoogle]);

  // 2) When we have a user, call backend /admin/anand
  useEffect(() => {
    if (status !== "calling_backend") return;

    const checkBackend = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setStatus("checking_auth");
          return;
        }

        const res = await fetch(`${API_BASE}/admin/anand`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const json = await res.json();
          const verifiedEmail = json.email ?? email;
          setEmail(verifiedEmail);
          setAdminVerifyCache(verifiedEmail);
          setStatus("admin");
        } else if (res.status === 403) {
          clearAdminVerifyCache();
          setStatus("not_admin");
        } else {
          console.error("Unexpected response from /admin/anand:", res.status);
          clearAdminVerifyCache();
          setStatus("not_admin");
        }
      } catch (err) {
        console.error("Error calling /admin/anand:", err);
        clearAdminVerifyCache();
        setStatus("not_admin");
      }
    };

    void checkBackend();
  }, [status, email]);

  // 3) Loading / error states
  if (loading || status === "checking_auth") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300">Checking authentication…</p>
      </div>
    );
  }

  if (status === "redirecting_to_google") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300">
          Redirecting to Google for admin sign‑in…
        </p>
      </div>
    );
  }

  if (status === "calling_backend") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-300">Verifying admin access…</p>
      </div>
    );
  }

  if (status === "not_admin") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">404 — Page not found</h1>
          <p className="text-slate-300">
            This admin panel is only available to the owner account.
          </p>
        </div>
      </div>
    );
  }

  // 4) Admin dashboard UI (full screen, no navbar/footer)

  // Main view: two cards (HomePage, UserDashboard)
  if (adminSection === "main") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex items-start justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-2">
                Admin Panel
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-3">
                Dashboard
              </h1>
              <p className="text-slate-300 text-sm md:text-base">
                Logged in as{" "}
                <span className="font-semibold text-cyan-300">{email}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 rounded-lg border border-cyan-600/70 text-sm font-semibold text-cyan-100 hover:bg-cyan-600/10 transition"
              >
                Go to User Dashboard
              </button>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => setAdminSection("homepage")}
              className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-left transition-all hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30 transition-colors">
                  <Home className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-slate-50">
                  HomePage
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                Manage NEET, JEE Main & JEE Advanced content for the homepage.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAdminSection("user-dashboard")}
              className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-left transition-all hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30 transition-colors">
                  <LayoutDashboard className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-slate-50">
                  UserDashboard
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                Upload PYQs, notes, and create bundles for sale.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // HomePage view: 3 exam cards (NEET, JEE(mains), JEE(advanced))
  if (adminSection === "homepage") {
    const examCards = [
      { id: "neet", label: "NEET", path: "/neet" },
      { id: "jee-main", label: "JEE(Mains)", path: "/jee-main" },
      { id: "jee-advanced", label: "JEE(Advanced)", path: "/jee-advanced" },
      { id: "cbse", label: "CBSE (Chemistry)", path: "/cbse" },
    ];
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between gap-4 mb-12">
            <button
              type="button"
              onClick={() => setAdminSection("main")}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition"
            >
              Sign out
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-50 mb-2">
            HomePage — Exam Sections
          </h1>
          <p className="text-slate-400 text-sm mb-10">
            Manage content for each exam section on the homepage.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {examCards.map((exam) => (
              <button
                key={exam.id}
                type="button"
                onClick={async () => {
                  setSelectedExamId(exam.id);
                  setAdminSection("exam-weightage");
                  const res = await fetchExamWeightagePublic(exam.id);
                  const byYear = res.byYear || {};
                  const localByYear = getWeightage(exam.id);
                  const mergedByYear = { ...localByYear, ...byYear };
                  setWeightageByYear(mergedByYear);
                  setWeightage(exam.id, mergedByYear);
                  const years = Object.keys(byYear)
                    .map((y) => String(y))
                    .sort((a, b) => Number(b) - Number(a));
                  const mergedYears = Object.keys(mergedByYear)
                    .map((y) => String(y))
                    .sort((a, b) => Number(b) - Number(a));
                  const yearToShow = mergedYears[0] || years[0] || "2025";
                  setWeightageYear(yearToShow);
                  setWeightageValues((mergedByYear[yearToShow] as Record<string, number>) || {});
                  if (exam.id === "jee-main") {
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
                      chapterCounts: (s.chapter_counts || undefined) as
                        | Record<string, number>
                        | undefined,
                    }));
                    setShiftEntries(shifts.filter((s) => s.year === yearToShow));
                    setEditingShiftId(null);
                    setShiftMonth("Jan");
                    setShiftSlot("Shift 1");
                    setShiftDayLabel("");
                    setShiftQuestions("");
                    setShiftPhysical("");
                    setShiftInorganic("");
                    setShiftOrganic("");
                    setShiftChapterwiseNote("");
                  } else {
                    setShiftEntries([]);
                    setEditingShiftId(null);
                  }
                }}
                className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-left transition-all hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
              >
                <h2 className="text-lg font-semibold text-slate-50 group-hover:text-cyan-300 transition-colors">
                  {exam.label}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Set chapterwise questions per year
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Exam weightage editor (NEET / JEE Main / JEE Advanced)
  if (adminSection === "exam-weightage") {
    const chapters = EXAM_CHAPTERS[selectedExamId] || [];
    const examLabels: Record<string, string> = {
      neet: "NEET",
      "jee-main": "JEE(mains)",
      "jee-advanced": "JEE(advanced)",
      cbse: "CBSE (Chemistry)",
    };
    const yearsWithData = Object.keys(weightageByYear)
      .filter((y) => {
        const chapterData = weightageByYear[y];
        return chapterData && Object.keys(chapterData).length > 0;
      })
      .sort((a, b) => Number(b) - Number(a));
    const baseYears = yearsWithData.length > 0 ? yearsWithData : ["2025"];
    const allYears = baseYears.includes(weightageYear)
      ? baseYears
      : [...baseYears, weightageYear].sort((a, b) => Number(b) - Number(a));
    const currentYearData = weightageValues;

    const handleSave = async () => {
      const localSnapshot = {
        ...weightageByYear,
        [weightageYear]: { ...currentYearData },
      };
      setWeightageByYear(localSnapshot);
      setWeightage(selectedExamId, localSnapshot);

      // Persist year-wise chapter weightage to Supabase
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          throw new Error("Not signed in.");
        }
        await saveExamWeightageAdmin(
          selectedExamId,
          weightageYear,
          currentYearData,
          token
        );
      } catch {
        // fall back to local storage so admin can continue working
        const stored = getWeightage(selectedExamId);
        stored[weightageYear] = { ...currentYearData };
        setWeightage(selectedExamId, stored);
        setWeightageByYear(stored);
      }

      if (selectedExamId === "jee-main" && editingShiftId) {
        const allShifts = getShiftWeightageForJeeMain();
        const existingForYear = allShifts[weightageYear] || [];
        const updatedForYear = [...existingForYear];
        const idx = updatedForYear.findIndex((e) => e.id === editingShiftId);
        if (idx >= 0) {
          const totalQuestions = Object.values(currentYearData).reduce(
            (sum, v) => sum + (typeof v === "number" ? v : 0),
            0
          );

          let physicalTotal = 0;
          let inorganicTotal = 0;
          let organicTotal = 0;

          chapters.forEach((ch) => {
            const count = currentYearData[ch.id] || 0;
            if (ch.chemistryType === "Physical") physicalTotal += count;
            if (ch.chemistryType === "Inorganic") inorganicTotal += count;
            if (ch.chemistryType === "Organic") organicTotal += count;
          });

          const updated = {
            ...updatedForYear[idx],
            questions: totalQuestions,
            physical: physicalTotal,
            inorganic: inorganicTotal,
            organic: organicTotal,
            chapterwiseNote: shiftChapterwiseNote.trim() || undefined,
            chapterCounts: { ...currentYearData },
          };
          updatedForYear[idx] = updated;
          allShifts[weightageYear] = updatedForYear;
          setShiftEntries(updatedForYear);
          setShiftWeightageForJeeMain(allShifts);

          try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            if (token) {
              await saveJeeMainShiftAdmin(
                {
                  year: updated.year,
                  month: updated.month,
                  dayLabel: updated.dayLabel,
                  shift: updated.shift,
                  questions: updated.questions,
                  physical: updated.physical ?? 0,
                  inorganic: updated.inorganic ?? 0,
                  organic: updated.organic ?? 0,
                  chapterCounts: updated.chapterCounts,
                  chapterwiseNote: updated.chapterwiseNote,
                },
                token
              );
            }
          } catch {
            // ignore; local cache already updated
          }
        }
      }

      setWeightageSaved(true);
      setTimeout(() => setWeightageSaved(false), 2000);
    };

    const addNewYear = () => {
      const y = newYearInput.trim();
      if (!y) return;
      // Auto-save current year + (for JEE Main) current shift before switching
      handleSave();
      setWeightageYear(y);
      setWeightageValues(weightageByYear[y] || {});
      if (selectedExamId === "jee-main") {
        const shiftAll = getShiftWeightageForJeeMain();
        setShiftEntries(shiftAll[y] || []);
        setEditingShiftId(null);
        setShiftMonth("Jan");
        setShiftSlot("Shift 1");
        setShiftDayLabel("");
        setShiftQuestions("");
        setShiftPhysical("");
        setShiftInorganic("");
        setShiftOrganic("");
        setShiftChapterwiseNote("");
      } else {
        setShiftEntries([]);
        setEditingShiftId(null);
      }
      setNewYearInput("");
    };

    const grouped = chapters.reduce(
      (acc, ch) => {
        if (!acc[ch.chemistryType]) acc[ch.chemistryType] = [];
        acc[ch.chemistryType].push(ch);
        return acc;
      },
      {} as Record<string, typeof chapters>
    );
    const order: Array<keyof typeof grouped> = ["Physical", "Inorganic", "Organic"];

    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between gap-4 mb-8">
            <button
              type="button"
              onClick={() => setAdminSection("homepage")}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-slate-50">
              {examLabels[selectedExamId] ?? selectedExamId} — Chapterwise Weightage
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Year:</label>
              <select
                value={weightageYear}
                onChange={(e) => {
                  const y = e.target.value;
                  // Auto-save current year + (for JEE Main) current shift before switching
                  handleSave();
                  setWeightageYear(y);
                  setWeightageValues(weightageByYear[y] || {});

                  // When switching years, also load / reset JEE Main shift-wise data
                  if (selectedExamId === "jee-main") {
                    const shiftAll = getShiftWeightageForJeeMain();
                    setShiftEntries(shiftAll[y] || []);
                    setEditingShiftId(null);
                    setShiftMonth("Jan");
                    setShiftSlot("Shift 1");
                    setShiftDayLabel("");
                    setShiftQuestions("");
                    setShiftPhysical("");
                    setShiftInorganic("");
                    setShiftOrganic("");
                    setShiftChapterwiseNote("");
                  } else {
                    setShiftEntries([]);
                    setEditingShiftId(null);
                  }
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                {allYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {selectedExamId === "jee-main" && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Month:</label>
                  <select
                    value={shiftMonth}
                    onChange={(e) =>
                      setShiftMonth(e.target.value as "Jan" | "April")
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="Jan">Jan</option>
                    <option value="April">April</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Day / date:</label>
                  <input
                    type="text"
                    placeholder="e.g. 31 Jan 2025"
                    value={shiftDayLabel}
                    onChange={(e) => setShiftDayLabel(e.target.value)}
                    className="w-40 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Shift:</label>
                  <select
                    value={shiftSlot}
                    onChange={(e) =>
                      setShiftSlot(e.target.value as "Shift 1" | "Shift 2")
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="Shift 1">Shift 1</option>
                    <option value="Shift 2">Shift 2</option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New year (e.g. 2024)"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={addNewYear}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30"
              >
                <Plus className="h-4 w-4" />
                Add year
              </button>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="ml-auto px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400"
            >
              {weightageSaved ? "Saved!" : "Save"}
            </button>
          </div>

          {selectedExamId === "jee-main" && (
            <div className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    JEE Main shift-wise editor
                  </h2>
                  <p className="text-xs text-slate-400">
                    Create a specific shift for this year using month, day/date and shift. Then
                    enter chapterwise questions for that shift below and press Save.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // If we're already editing another shift, save its data first
                    if (editingShiftId) {
                      handleSave();
                    }

                    const trimmedDay = shiftDayLabel.trim();
                    if (!trimmedDay) return;

                    const allShifts = getShiftWeightageForJeeMain();
                    const existingForYear = allShifts[weightageYear] || [];
                    const updatedForYear = [...existingForYear];

                    const existing = updatedForYear.find(
                      (e) =>
                        e.month === shiftMonth &&
                        e.shift === shiftSlot &&
                        e.dayLabel === trimmedDay
                    );

                    let target = existing;
                    if (!target) {
                      const id = `${weightageYear}-${Date.now()}-${Math.random()
                        .toString(16)
                        .slice(2)}`;
                      target = {
                        id,
                        year: weightageYear,
                        month: shiftMonth,
                        dayLabel: trimmedDay,
                        shift: shiftSlot,
                        questions: 0,
                      };
                      updatedForYear.push(target);
                    }

                    allShifts[weightageYear] = updatedForYear;
                    setShiftEntries(updatedForYear);
                    setShiftWeightageForJeeMain(allShifts);

                    setEditingShiftId(target.id);
                    setWeightageValues(target.chapterCounts || {});
                    setShiftChapterwiseNote(target.chapterwiseNote || "");
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400"
                >
                  {editingShiftId
                    ? "Switch / update current shift"
                    : "Create shift & add data"}
                </button>
              </div>

              {shiftEntries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">
                    Existing shifts for {weightageYear}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {shiftEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          setEditingShiftId(entry.id);
                          setShiftMonth(entry.month as "Jan" | "April");
                          setShiftSlot(entry.shift as "Shift 1" | "Shift 2");
                          setShiftDayLabel(entry.dayLabel);
                          setWeightageValues(entry.chapterCounts || {});
                          setShiftChapterwiseNote(entry.chapterwiseNote || "");
                        }}
                        className={`px-3 py-1 rounded-full text-xs border transition ${
                          editingShiftId === entry.id
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                            : "bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400"
                        }`}
                      >
                        {entry.dayLabel
                          ? `${entry.dayLabel} · ${entry.month} · ${entry.shift}`
                          : `${entry.month} · ${entry.shift}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-slate-400 mb-6">
            Enter number of questions per chapter for year {weightageYear}. This data will show on the public {examLabels[selectedExamId]} weightage page.
          </p>

          <div className="space-y-10">
            {order.map((chemType) => {
              const list = grouped[chemType];
              if (!list?.length) return null;
              return (
                <section key={chemType} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
                  <h2 className="text-lg font-semibold text-slate-100 mb-4">
                    {chemType} Chemistry
                  </h2>
                  <div className="space-y-3">
                    {list.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex flex-wrap items-center gap-4 py-2 border-b border-slate-700/50 last:border-0"
                      >
                        <div className="flex-1 min-w-[200px] text-sm text-slate-200">
                          {ch.label}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Questions</label>
                          <input
                            type="number"
                            min={0}
                            value={currentYearData[ch.id] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value === "" ? undefined : Number(e.target.value);
                              setWeightageValues((prev) => {
                                const next = { ...prev };
                                if (v === undefined) delete next[ch.id];
                                else next[ch.id] = v;
                                return next;
                              });
                            }}
                            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // UserDashboard view: all settings (current admin UI)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAdminSection("main")}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-2">
                Admin Panel
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-3">
                UserDashboard — Uploads & Bundles
              </h1>
              <p className="text-slate-300 text-sm md:text-base">
                Logged in as{" "}
                <span className="font-semibold text-cyan-300">{email}</span>.
                Upload PYQs and notes, then create bundles for sale.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className="px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition"
          >
            Sign out
          </button>
        </div>

        {/* High-level action cards (first screen) */}
        {userDashboardPanel === "none" && (
          <section className="grid gap-6 md:grid-cols-4">
            {/* Upload PYQs card */}
            <button
              type="button"
              onClick={() => {
                setPyqBrowseAll(false);
                setUserDashboardPanel("pyq");
              }}
              className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-7 text-left transition-all hover:-translate-y-1 hover:border-cyan-400/80 hover:shadow-[0_18px_45px_rgba(8,47,73,0.9)]"
            >
              {/* entering upload flow should not force browse-all */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500/30 transition-colors">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-base md:text-lg font-semibold text-slate-50">
                    Upload PYQs
                  </p>
                  <p className="text-[11px] md:text-xs text-slate-400">
                    Add previous year questions from PDFs or manual entry with diagrams.
                  </p>
                </div>
              </div>
            </button>

            {/* See uploaded PYQs card */}
            <button
              type="button"
              onClick={() => {
                setUserDashboardPanel("pyq");
                setPyqUploadPanel("jee-neet");
                setPyqExamMode("standard");
                setPyqBrowseAll(true);
              }}
              className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-7 text-left transition-all hover:-translate-y-1 hover:border-sky-400/80 hover:shadow-[0_18px_45px_rgba(2,132,199,0.25)]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-500/20 text-sky-200 group-hover:bg-sky-500/30 transition-colors">
                  <FileSearch className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-base md:text-lg font-semibold text-slate-50">
                    See uploaded PYQs
                  </p>
                  <p className="text-[11px] md:text-xs text-slate-400">
                    View, edit or delete your uploaded questions by exam/year/chapter.
                  </p>
                </div>
              </div>
            </button>

            {/* Upload Notes card */}
            <button
              type="button"
              onClick={() => setUserDashboardPanel("notes")}
              className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-7 text-left transition-all hover:-translate-y-1 hover:border-emerald-400/80 hover:shadow-[0_18px_45px_rgba(6,78,59,0.85)]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30 transition-colors">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-base md:text-lg font-semibold text-slate-50">
                    Upload Notes
                  </p>
                  <p className="text-[11px] md:text-xs text-slate-400">
                    Add chapter-wise or topic-wise notes PDFs for different exams.
                  </p>
                </div>
              </div>
            </button>

            {/* Notes Bundle Maker card */}
            <button
              type="button"
              onClick={() => setUserDashboardPanel("bundles")}
              className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-7 text-left transition-all hover:-translate-y-1 hover:border-fuchsia-400/80 hover:shadow-[0_18px_45px_rgba(88,28,135,0.9)]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300 group-hover:bg-fuchsia-500/30 transition-colors">
                  <Package className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-base md:text-lg font-semibold text-slate-50">
                    Notes Bundle Maker
                  </p>
                  <p className="text-[11px] md:text-xs text-slate-400">
                    Combine individual notes into premium bundles for the student dashboard.
                  </p>
                </div>
              </div>
            </button>
          </section>
        )}

      {/* PYQ upload section (own view) */}
      {userDashboardPanel === "pyq" && (
        <section
          ref={pyqSectionRef}
          className="min-h-[70vh] bg-slate-900/80 border border-slate-700 rounded-2xl p-6 md:p-8"
        >
          <button
            type="button"
            onClick={() => setUserDashboardPanel("none")}
            className="mb-4 inline-flex items-center gap-2 text-[11px] text-slate-400 hover:text-cyan-300"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to actions
          </button>

          {pyqUploadPanel === "select-exam-mode" && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-50">
                Upload PYQ Papers
              </h2>
              <p className="text-sm text-slate-300">
                First choose which exam type you want to upload questions for.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setPyqUploadPanel("jee-neet");
                    setPyqExamMode("standard");
                    setPyqExamType("");
                    setPyqChemType("");
                  }}
                  className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-left transition-all hover:-translate-y-1 hover:border-cyan-400/80 hover:shadow-[0_18px_45px_rgba(8,47,73,0.9)]"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500/30 transition-colors">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-50">
                        JEE / NEET PYQs
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Upload chemistry PYQs for JEE Main, JEE Advanced and NEET.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPyqUploadPanel("cbse");
                    setPyqExamMode("cbse");
                    setPyqExamType("CBSE");
                    setCbseSubject("");
                  }}
                  className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-left transition-all hover:-translate-y-1 hover:border-emerald-400/80 hover:shadow-[0_18px_45px_rgba(6,78,59,0.85)]"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30 transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-50">
                        CBSE PYQs
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Upload Physics, Chemistry or Maths PYQs for CBSE board.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

        {pyqUploadPanel !== "select-exam-mode" && (
          <>
        {!pyqBrowseAll && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-50">
                {pyqExamMode === "standard"
                  ? "Upload JEE / NEET PYQ Papers"
                  : "Upload CBSE PYQ Papers"}
              </h2>
              <p className="text-sm text-slate-300">
                Choose how you want to add questions: upload a text-only PDF, or add a question manually with diagrams.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPyqUploadPanel("select-exam-mode");
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-400/70 hover:text-cyan-200"
            >
              <ArrowLeft className="h-3 w-3" />
              Change exam
            </button>
          </div>
        )}

        {/* Exam mode is chosen via cards above; no toggle here in upload mode */}

        {pyqBrowseAll && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-50">
                  Your uploaded PYQs
                </p>
                <p className="text-[11px] text-slate-400">
                  This view hides the upload form and shows your uploaded questions. Use filters below to narrow down, then edit/delete.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-cyan-400/70 hover:text-cyan-200"
                onClick={() => setPyqBrowseAll(false)}
              >
                Switch to upload mode
              </button>
            </div>

            {/* Filters: exam / chapter / year */}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Exam
                </label>
                <select
                  value={pyqBrowseExam}
                  onChange={(e) => setPyqBrowseExam(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">All</option>
                  <option value="NEET">NEET</option>
                  <option value="JEE MAIN">JEE Main</option>
                  <option value="JEE ADVANCED">JEE Advanced</option>
                  <option value="CBSE">CBSE</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Chapter
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alkyl Halides"
                  value={pyqBrowseChapter}
                  onChange={(e) => setPyqBrowseChapter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Year
                </label>
                <input
                  type="number"
                  placeholder="All"
                  value={pyqBrowseYear}
                  onChange={(e) => setPyqBrowseYear(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Uploaded questions list (shown in browse-all mode, and also in upload mode once filters are set) */}
        {pyqBrowseAll && (
          <div className="mb-6">
            {pyqQuestionsLoading ? (
              <p className="text-xs text-slate-400">Loading questions…</p>
            ) : pyqQuestions.length === 0 ? (
              <p className="text-xs text-slate-500">No uploaded questions found yet.</p>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-800">
                  {pyqQuestions.map((q, idx) => {
                    const num = q.question_number ?? idx + 1;
                    const metaParts: string[] = [];
                    if (q.year) metaParts.push(String(q.year));
                    if (q.exam_code) metaParts.push(String(q.exam_code));
                    if (q.chapter_name) metaParts.push(String(q.chapter_name));
                    const meta = metaParts.join(" · ");
                    const hasText = Boolean((q.question_text || "").trim());
                    const firstStemImage = (q.question_image_urls || [])[0];

                    return (
                      <div
                        key={q.id}
                        className="group px-3 py-3 md:px-4 md:py-3.5 hover:bg-slate-900/40"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-[11px] font-semibold text-slate-200">
                            {num}
                          </div>

                          <div className="flex-1 min-w-0">
                            {hasText ? (
                              <p className="text-slate-100 text-[13px] md:text-sm leading-snug line-clamp-2">
                                <ChemText text={q.question_text} />
                              </p>
                            ) : firstStemImage ? (
                              <a
                                href={firstStemImage}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={firstStemImage}
                                  alt={`Question ${num} image`}
                                  className="h-24 w-full max-w-sm rounded-lg border border-slate-700 bg-white p-1 object-contain hover:border-cyan-400/70"
                                  loading="lazy"
                                />
                              </a>
                            ) : (
                              <p className="text-slate-400 text-[13px] md:text-sm">(no text)</p>
                            )}
                            {meta && (
                              <p className="mt-1 text-[10px] text-slate-500 truncate">
                                {meta}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full border border-sky-500/70 px-2 py-0.5 text-[11px] text-sky-200 hover:bg-sky-500/20"
                              onClick={() => {
                                const baseOptions = Array.isArray(q.options)
                                  ? [...q.options]
                                  : [];
                                while (baseOptions.length < 4) {
                                  baseOptions.push("");
                                }
                                setPyqEditingQuestion({
                                  ...q,
                                  options: baseOptions.slice(0, 4),
                                });
                              }}
                            >
                              View / Edit
                            </button>

                            <button
                              type="button"
                              className="inline-flex items-center rounded-full border border-red-500/70 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                              disabled={pyqDeleteBusyId === q.id}
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    "Delete this question permanently? This cannot be undone."
                                  )
                                ) {
                                  return;
                                }
                                try {
                                  setPyqDeleteBusyId(q.id);
                                  const { data } = await supabase.auth.getSession();
                                  const token = data.session?.access_token;
                                  if (!token) {
                                    setPyqMessage({
                                      type: "error",
                                      text: "Not signed in.",
                                    });
                                    return;
                                  }
                                  const res = await fetch(
                                    `${API_BASE}/admin/pyq/questions/delete`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({ question_id: q.id }),
                                    }
                                  );
                                  const json = await res.json().catch(() => ({}));
                                  if (!res.ok) {
                                    const detail =
                                      (Array.isArray(json.detail)
                                        ? json.detail
                                            .map((d: { msg?: string }) => d.msg)
                                            .join(" ")
                                        : json.detail) || res.statusText;
                                    throw new Error(detail);
                                  }
                                  setPyqQuestions((prev) =>
                                    prev.filter((item) => item.id !== q.id)
                                  );
                                  if (pyqEditingQuestion?.id === q.id) {
                                    setPyqEditingQuestion(null);
                                  }
                                  setPyqMessage({
                                    type: "success",
                                    text: "Question deleted.",
                                  });
                                } catch (err) {
                                  setPyqMessage({
                                    type: "error",
                                    text:
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to delete question.",
                                  });
                                } finally {
                                  setPyqDeleteBusyId(null);
                                }
                              }}
                            >
                              {pyqDeleteBusyId === q.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pyqEditingQuestion && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">
                      Edit question
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Update the question text, options, correct answer and solution. Changes are saved only after you click &quot;Save changes&quot;.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                    onClick={() => setPyqEditingQuestion(null)}
                  >
                    Close
                  </button>
                </div>

                <PyqTextModeToggle mode={pyqTextMode} onChange={setPyqTextMode} compact />

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <label className="flex flex-col gap-1 text-xs text-slate-200">
                    <span className="font-semibold uppercase tracking-wide">Exam</span>
                    <input
                      type="text"
                      placeholder="e.g. NEET / JEE Main / CBSE"
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={pyqEditingQuestion.exam_code || ""}
                      onChange={(e) =>
                        setPyqEditingQuestion((prev) =>
                          prev ? { ...prev, exam_code: e.target.value } : prev
                        )
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-slate-200">
                    <span className="font-semibold uppercase tracking-wide">Year</span>
                    <input
                      type="number"
                      placeholder="e.g. 2024"
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={pyqEditingQuestion.year ?? ""}
                      onChange={(e) =>
                        setPyqEditingQuestion((prev) => {
                          if (!prev) return prev;
                          const value = e.target.value;
                          return {
                            ...prev,
                            year: value === "" ? undefined : Number(value),
                          };
                        })
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-slate-200">
                    <span className="font-semibold uppercase tracking-wide">Chapter</span>
                    <input
                      type="text"
                      placeholder="e.g. Haloalkanes"
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={pyqEditingQuestion.chapter_name || ""}
                      onChange={(e) =>
                        setPyqEditingQuestion((prev) =>
                          prev ? { ...prev, chapter_name: e.target.value } : prev
                        )
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-slate-200">
                    <span className="font-semibold uppercase tracking-wide">Chemistry type</span>
                    <select
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={pyqEditingQuestion.chemistry_type || ""}
                      onChange={(e) =>
                        setPyqEditingQuestion((prev) =>
                          prev
                            ? {
                                ...prev,
                                chemistry_type: e.target.value || null,
                              }
                            : prev
                        )
                      }
                    >
                      <option value="">Not set</option>
                      <option value="Organic">Organic</option>
                      <option value="Inorganic">Inorganic</option>
                      <option value="Physical">Physical</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-slate-200">
                    <span className="font-semibold uppercase tracking-wide">Question no.</span>
                    <input
                      type="number"
                      min={1}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={pyqEditingQuestion.question_number ?? ""}
                      onChange={(e) =>
                        setPyqEditingQuestion((prev) => {
                          if (!prev) return prev;
                          const value = e.target.value;
                          return {
                            ...prev,
                            question_number: value === "" ? undefined : Number(value),
                          };
                        })
                      }
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="flex flex-col gap-1 text-xs text-slate-200">
                    <span className="font-semibold uppercase tracking-wide">
                      Full question
                    </span>
                    <ChemTextTextarea
                      mode={pyqTextMode}
                      className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={pyqEditingQuestion.question_text}
                      onValueChange={(value) =>
                        setPyqEditingQuestion((prev) =>
                          prev
                            ? { ...prev, question_text: value }
                            : prev
                        )
                      }
                    />
                  </label>

                  {/* Stem images */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Question images
                      </p>
                      <div className="inline-flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 text-[11px] text-slate-300 hover:text-cyan-200 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (!f) return;
                              await uploadQuestionImage({
                                questionId: pyqEditingQuestion.id,
                                target: "stem",
                                file: f,
                                replaceIndex:
                                  (pyqEditingQuestion.question_image_urls || []).length > 0
                                    ? 0
                                    : undefined,
                              });
                            }}
                          />
                          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
                            {pyqImageUploading?.target === "stem"
                              ? "Uploading…"
                              : (pyqEditingQuestion.question_image_urls || []).length > 0
                                ? "Replace first image"
                                : "Upload image"}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            void pasteClipboardImageForQuestionEdit({
                              questionId: pyqEditingQuestion.id,
                              target: "stem",
                              replaceIndex:
                                (pyqEditingQuestion.question_image_urls || []).length > 0
                                  ? 0
                                  : undefined,
                            })
                          }
                          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
                        >
                          {(pyqEditingQuestion.question_image_urls || []).length > 0
                            ? "Paste to replace"
                            : "Paste screenshot"}
                        </button>
                      </div>
                    </div>
                    {(pyqEditingQuestion.question_image_urls || []).length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        No question images.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(pyqEditingQuestion.question_image_urls || []).map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            className="group relative"
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              <img
                                src={url}
                                alt={`stem-${i}`}
                                className="h-20 w-20 rounded-lg border border-slate-700 object-cover hover:border-cyan-400/70"
                                loading="lazy"
                              />
                            </a>
                            <button
                              type="button"
                              title="Remove image"
                              onClick={() =>
                                void deleteQuestionImage({
                                  questionId: pyqEditingQuestion.id,
                                  target: "stem",
                                  removeIndex: i,
                                })
                              }
                              className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/60 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                            >
                              ×
                            </button>
                            <label className="absolute bottom-1 left-1 inline-flex cursor-pointer items-center rounded-full border border-slate-700 bg-slate-950/90 px-2 py-0.5 text-[10px] text-slate-200 hover:border-cyan-400/70 hover:text-cyan-200">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  if (!f) return;
                                  await uploadQuestionImage({
                                    questionId: pyqEditingQuestion.id,
                                    target: "stem",
                                    file: f,
                                    replaceIndex: i,
                                  });
                                }}
                              />
                              Replace
                            </label>
                            {pyqImageDeleting?.target === "stem" &&
                              pyqImageDeleting?.removeIndex === i && (
                                <div className="pointer-events-none absolute inset-0 rounded-lg bg-slate-950/70" />
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-xs text-slate-200">
                      <span className="font-semibold uppercase tracking-wide">
                        Answer type
                      </span>
                      <select
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={pyqEditingQuestion.answer_type || "MCQ"}
                        onChange={(e) =>
                          setPyqEditingQuestion((prev) =>
                            prev
                              ? { ...prev, answer_type: e.target.value }
                              : prev
                          )
                        }
                      >
                        <option value="MCQ">MCQ (single correct)</option>
                        <option value="NUMERIC">Numeric answer</option>
                        <option value="MULTI">Multiple correct</option>
                      </select>
                    </label>

                    {pyqEditingQuestion.answer_type === "NUMERIC" ? (
                      <label className="flex flex-col gap-1 text-xs text-slate-200">
                        <span className="font-semibold uppercase tracking-wide">
                          Correct numeric answer
                        </span>
                        <input
                          type="text"
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          value={pyqEditingQuestion.correct_answer || ""}
                          onChange={(e) =>
                            setPyqEditingQuestion((prev) =>
                              prev
                                ? { ...prev, correct_answer: e.target.value }
                                : prev
                            )
                          }
                        />
                      </label>
                    ) : pyqEditingQuestion.answer_type === "MULTI" ? (
                      <label className="flex flex-col gap-1 text-xs text-slate-200">
                        <span className="font-semibold uppercase tracking-wide">
                          Correct options (MULTI)
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. 1,3"
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          value={pyqEditingQuestion.correct_answer || ""}
                          onChange={(e) =>
                            setPyqEditingQuestion((prev) =>
                              prev
                                ? { ...prev, correct_answer: e.target.value }
                                : prev
                            )
                          }
                        />
                        <p className="text-[10px] text-slate-500">
                          Use option numbers 1–4 (example: <span className="text-slate-300">1,3</span>)
                        </p>
                      </label>
                    ) : (
                      <label className="flex flex-col gap-1 text-xs text-slate-200">
                        <span className="font-semibold uppercase tracking-wide">
                          Correct option
                        </span>
                        <div className="flex items-center gap-2">
                          {["A", "B", "C", "D"].map((label, idx) => {
                            const checked =
                              (typeof pyqEditingQuestion.correct_index ===
                                "number"
                                ? pyqEditingQuestion.correct_index
                                : 0) === idx;
                            return (
                              <label
                                key={label}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] cursor-pointer ${
                                  checked
                                    ? "border-emerald-400/80 bg-emerald-500/15 text-emerald-100"
                                    : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-cyan-400/60"
                                }`}
                              >
                                <input
                                  type="radio"
                                  className="accent-emerald-400"
                                  checked={checked}
                                  onChange={() =>
                                    setPyqEditingQuestion((prev) =>
                                      prev ? { ...prev, correct_index: idx } : prev
                                    )
                                  }
                                />
                                {label}
                              </label>
                            );
                          })}
                        </div>
                      </label>
                    )}
                  </div>

                  {pyqEditingQuestion.answer_type !== "NUMERIC" && (
                    <div className="grid md:grid-cols-2 gap-3">
                      {(pyqEditingQuestion.options || []).map((opt, i) => (
                        <label
                          key={i}
                          className="flex flex-col gap-1 text-xs text-slate-200"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold uppercase tracking-wide">
                              Option {i + 1}
                            </span>
                            <div className="inline-flex items-center gap-2">
                              <label className="inline-flex items-center gap-2 text-[11px] text-slate-300 hover:text-cyan-200 cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    e.target.value = "";
                                    if (!f) return;
                                    await uploadQuestionImage({
                                      questionId: pyqEditingQuestion.id,
                                      target: "option",
                                      optionIndex: i,
                                      file: f,
                                    });
                                  }}
                                />
                                <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">
                                  {pyqImageUploading?.target === "option" &&
                                  pyqImageUploading?.optionIndex === i
                                    ? "Uploading…"
                                    : (pyqEditingQuestion.option_image_urls || [])[i]
                                      ? "Replace image"
                                      : "Upload image"}
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  void pasteClipboardImageForQuestionEdit({
                                    questionId: pyqEditingQuestion.id,
                                    target: "option",
                                    optionIndex: i,
                                  })
                                }
                                className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
                              >
                                {(pyqEditingQuestion.option_image_urls || [])[i]
                                  ? "Paste replace"
                                  : "Paste"}
                              </button>
                            </div>
                          </div>
                          <ChemTextTextarea
                            mode={pyqTextMode}
                            className="min-h-[48px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            value={opt || ""}
                            onValueChange={(value) =>
                              setPyqEditingQuestion((prev) => {
                                if (!prev) return prev;
                                const nextOpts = [...(prev.options || [])];
                                while (nextOpts.length < 4) {
                                  nextOpts.push("");
                                }
                                nextOpts[i] = value;
                                return { ...prev, options: nextOpts };
                              })
                            }
                          />
                          {!!(pyqEditingQuestion.option_image_urls || [])[i] && (
                            <div className="group relative mt-2 inline-block">
                              <a
                                href={(pyqEditingQuestion.option_image_urls || [])[i]}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={(pyqEditingQuestion.option_image_urls || [])[i]}
                                  alt={`opt-${i}`}
                                  className="h-20 w-20 rounded-lg border border-slate-700 object-cover hover:border-cyan-400/70"
                                  loading="lazy"
                                />
                              </a>
                              <button
                                type="button"
                                title="Remove image"
                                onClick={() =>
                                  void deleteQuestionImage({
                                    questionId: pyqEditingQuestion.id,
                                    target: "option",
                                    optionIndex: i,
                                  })
                                }
                                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/60 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                              >
                                ×
                              </button>
                              {pyqImageDeleting?.target === "option" &&
                                pyqImageDeleting?.optionIndex === i && (
                                  <div className="pointer-events-none absolute inset-0 rounded-lg bg-slate-950/70" />
                                )}
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  <label className="flex flex-col gap-1 text-xs text-slate-200">
                    <span className="font-semibold uppercase tracking-wide">
                      Solution (text)
                    </span>
                    <ChemTextTextarea
                      mode={pyqTextMode}
                      className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={pyqEditingQuestion.solution_text || ""}
                      onValueChange={(value) =>
                        setPyqEditingQuestion((prev) =>
                          prev
                            ? { ...prev, solution_text: value }
                            : prev
                        )
                      }
                    />
                  </label>

                  {/* Solution images */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Solution images
                      </p>
                      <div className="inline-flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 text-[11px] text-slate-300 hover:text-cyan-200 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (!f) return;
                              await uploadQuestionImage({
                                questionId: pyqEditingQuestion.id,
                                target: "solution",
                                file: f,
                                replaceIndex:
                                  (pyqEditingQuestion.solution_image_urls || []).length > 0
                                    ? 0
                                    : undefined,
                              });
                            }}
                          />
                          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
                            {pyqImageUploading?.target === "solution"
                              ? "Uploading…"
                              : (pyqEditingQuestion.solution_image_urls || []).length > 0
                                ? "Replace first image"
                                : "Upload image"}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            void pasteClipboardImageForQuestionEdit({
                              questionId: pyqEditingQuestion.id,
                              target: "solution",
                              replaceIndex:
                                (pyqEditingQuestion.solution_image_urls || []).length > 0
                                  ? 0
                                  : undefined,
                            })
                          }
                          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200"
                        >
                          {(pyqEditingQuestion.solution_image_urls || []).length > 0
                            ? "Paste to replace"
                            : "Paste screenshot"}
                        </button>
                      </div>
                    </div>
                    {(pyqEditingQuestion.solution_image_urls || []).length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        No solution images.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(pyqEditingQuestion.solution_image_urls || []).map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            className="group relative"
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              <img
                                src={url}
                                alt={`sol-${i}`}
                                className="h-20 w-20 rounded-lg border border-slate-700 object-cover hover:border-cyan-400/70"
                                loading="lazy"
                              />
                            </a>
                            <button
                              type="button"
                              title="Remove image"
                              onClick={() =>
                                void deleteQuestionImage({
                                  questionId: pyqEditingQuestion.id,
                                  target: "solution",
                                  removeIndex: i,
                                })
                              }
                              className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/60 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                            >
                              ×
                            </button>
                            <label className="absolute bottom-1 left-1 inline-flex cursor-pointer items-center rounded-full border border-slate-700 bg-slate-950/90 px-2 py-0.5 text-[10px] text-slate-200 hover:border-cyan-400/70 hover:text-cyan-200">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  if (!f) return;
                                  await uploadQuestionImage({
                                    questionId: pyqEditingQuestion.id,
                                    target: "solution",
                                    file: f,
                                    replaceIndex: i,
                                  });
                                }}
                              />
                              Replace
                            </label>
                            {pyqImageDeleting?.target === "solution" &&
                              pyqImageDeleting?.removeIndex === i && (
                                <div className="pointer-events-none absolute inset-0 rounded-lg bg-slate-950/70" />
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-slate-400">
                    Question ID: {pyqEditingQuestion.id}
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-emerald-500/80 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-60"
                    disabled={pyqEditSaving}
                    onClick={async () => {
                      if (!pyqEditingQuestion) return;
                      try {
                        setPyqEditSaving(true);
                        const { data } = await supabase.auth.getSession();
                        const token = data.session?.access_token;
                        if (!token) {
                          setPyqMessage({
                            type: "error",
                            text: "Not signed in.",
                          });
                          return;
                        }

                        const payload: any = {
                          question_id: pyqEditingQuestion.id,
                          question_text: pyqEditingQuestion.question_text,
                          answer_type: pyqEditingQuestion.answer_type || "MCQ",
                          solution_text: pyqEditingQuestion.solution_text || null,
                          exam_code: pyqEditingQuestion.exam_code || "",
                          chapter_name: pyqEditingQuestion.chapter_name || "",
                          chemistry_type: pyqEditingQuestion.chemistry_type || null,
                        };

                        if (typeof pyqEditingQuestion.year === "number") {
                          payload.year = pyqEditingQuestion.year;
                        }

                        if (typeof pyqEditingQuestion.question_number === "number") {
                          payload.question_number = pyqEditingQuestion.question_number;
                        }

                        if (pyqEditingQuestion.answer_type === "NUMERIC") {
                          payload.correct_answer = (pyqEditingQuestion.correct_answer || "").trim();
                          payload.correct_index = null;
                        } else if (pyqEditingQuestion.answer_type === "MULTI") {
                          payload.correct_answer = (pyqEditingQuestion.correct_answer || "").trim();
                          payload.correct_index =
                            typeof pyqEditingQuestion.correct_index === "number"
                              ? pyqEditingQuestion.correct_index
                              : 0;
                        } else {
                          payload.correct_index =
                            typeof pyqEditingQuestion.correct_index === "number"
                              ? pyqEditingQuestion.correct_index
                              : 0;
                          payload.correct_answer = null;
                        }

                        if (
                          pyqEditingQuestion.answer_type !== "NUMERIC" &&
                          pyqEditingQuestion.options
                        ) {
                          payload.options = pyqEditingQuestion.options;
                        }

                        const res = await fetch(
                          `${API_BASE}/admin/pyq/questions/update`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(payload),
                          }
                        );
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          const detail =
                            (Array.isArray(json.detail)
                              ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
                              : json.detail) || res.statusText;
                          throw new Error(detail);
                        }

                        setPyqQuestions((prev) =>
                          prev.map((q) =>
                            q.id === pyqEditingQuestion.id ? pyqEditingQuestion : q
                          )
                        );
                        setPyqMessage({
                          type: "success",
                          text: "Question updated successfully.",
                        });
                      } catch (err) {
                        setPyqMessage({
                          type: "error",
                          text:
                            err instanceof Error
                              ? err.message
                              : "Failed to update question.",
                        });
                      } finally {
                        setPyqEditSaving(false);
                      }
                    }}
                  >
                    {pyqEditSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload UI should be hidden when browsing uploaded PYQs */}
        {!pyqBrowseAll && (
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setPyqAddMode("pdf")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              pyqAddMode === "pdf"
                ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-cyan-400/60"
            }`}
          >
            Add with PDF (text only)
          </button>
          <button
            type="button"
            onClick={() => setPyqAddMode("manual")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              pyqAddMode === "manual"
                ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-cyan-400/60"
            }`}
          >
            Add manually (with images)
          </button>
        </div>
        )}

        {!pyqBrowseAll && (
          <div className="mb-6">
            <PyqTextModeToggle mode={pyqTextMode} onChange={setPyqTextMode} />
            <p className="mt-2 text-[11px] text-slate-500">
              {pyqTextMode === "katex"
                ? "KaTeX mode is on. You can write full formulas, reactions, and chemistry notation."
                : "Normal text mode is on. Fields behave like standard text inputs without KaTeX helpers."}
            </p>
          </div>
        )}

        {!pyqBrowseAll && (
        <div className="grid md:grid-cols-6 gap-4 mb-6">
          {/* Exam type (free text with suggestions, locked to CBSE in CBSE mode) */}
          {pyqExamMode === "cbse" ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Exam Type
              </label>
              <input
                type="text"
                value="CBSE"
                readOnly
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 opacity-80"
              />
              <p className="text-[10px] text-slate-500">
                CBSE exam code is fixed. Use subject below to pick Physics, Chemistry or Maths.
              </p>
            </div>
          ) : (
            <ExamTypeInput
              label="Exam Type"
              value={pyqExamType}
              onChange={setPyqExamType}
              suggestions={examTypes}
            />
          )}

          {/* Chemistry type (only for JEE / NEET chemistry mode) */}
          {pyqExamMode === "standard" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Chemistry Type
              </label>
              <select
                value={pyqChemType}
                onChange={(e) => setPyqChemType(e.target.value as ChemistryType)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select</option>
                {CHEMISTRY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CBSE subject (only in CBSE mode) */}
          {pyqExamMode === "cbse" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                CBSE Subject
              </label>
              <select
                value={cbseSubject}
                onChange={(e) => setCbseSubject(e.target.value as typeof cbseSubject)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Maths">Maths</option>
              </select>
            </div>
          )}

          {/* Year (optional for PDF; required for manual) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Year {pyqAddMode === "manual" ? "" : "(optional)"}
            </label>
            <input
              type="number"
              placeholder={pyqAddMode === "manual" ? "e.g. 2025" : "Detected from PDF"}
              value={pyqAddMode === "manual" ? manualYear : pyqYear}
              onChange={(e) =>
                pyqAddMode === "manual"
                  ? setManualYear(e.target.value)
                  : setPyqYear(e.target.value)
              }
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Max questions (PDF only) */}
          {pyqAddMode === "pdf" ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Max questions (optional)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0 = all (use 1 for single-question PDF)"
                value={pyqMaxQuestions}
                onChange={(e) => setPyqMaxQuestions(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Question type
              </label>
              <select
                value={manualQuestionType}
                onChange={(e) => setManualQuestionType(e.target.value as ManualQuestionType)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="MCQ">Single correct (MCQ)</option>
                <option value="NUMERIC">Integer / Numeric</option>
                <option value="MULTI">Multiple correct</option>
              </select>
            </div>
          )}

          {/* Chapter name */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              {pyqExamMode === "cbse" ? "Chapter / Topic Name" : "Chapter Name"}
            </label>
            <input
              type="text"
              placeholder="e.g. Alkyl Halides"
              value={pyqChapterName}
              onChange={(e) => setPyqChapterName(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        )}

        {!pyqBrowseAll ? (
          pyqAddMode === "pdf" ? (
          <>
            {/* PDF input + button */}
            <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  PYQ PDF (text-only)
                </label>
                <input
                  ref={pyqFileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"
                />
              </div>
              <button
                className="mt-1 px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 text-slate-950 font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:pointer-events-none"
                type="button"
                disabled={pyqUploading}
                onClick={async () => {
                  addExamType(pyqExamType || (pyqExamMode === "cbse" ? "CBSE" : ""));
                  const fileInput = pyqFileInputRef.current;
                  const file = fileInput?.files?.[0];
                  if (!file) {
                    setPyqMessage({ type: "error", text: "Please select a PDF file." });
                    return;
                  }
                  if (pyqExamMode === "standard" && !pyqExamType.trim()) {
                    setPyqMessage({ type: "error", text: "Please enter exam type (e.g. NEET, JEE Main)." });
                    return;
                  }
                  if (pyqExamMode === "cbse" && !cbseSubject) {
                    setPyqMessage({ type: "error", text: "Please select CBSE subject (Physics, Chemistry or Maths)." });
                    return;
                  }
                  setPyqMessage(null);
                  setPyqUploading(true);
                  try {
                    const { data: session } = await supabase.auth.getSession();
                    const token = session.session?.access_token;
                    if (!token) {
                      setPyqMessage({ type: "error", text: "Not signed in." });
                      setPyqUploading(false);
                      return;
                    }
                    const formData = new FormData();
                    formData.append("file", file);
                    const examTypeToSend =
                      pyqExamMode === "cbse" ? "CBSE" : pyqExamType.trim();
                    const chemistryTypeToSend =
                      pyqExamMode === "cbse" ? "" : pyqChemType || "";
                    const chapterNameBase = pyqChapterName.trim();
                    const chapterNameToSend = chapterNameBase;
                    formData.append("exam_type", examTypeToSend);
                    formData.append("chemistry_type", chemistryTypeToSend);
                    formData.append("chapter_name", chapterNameToSend);
                    const maxQ = parseInt(pyqMaxQuestions, 10);
                    if (maxQ > 0) formData.append("max_questions", String(maxQ));
                    const res = await fetch(`${API_BASE}/admin/pyq/upload`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      const detail = Array.isArray(json.detail)
                        ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
                        : json.detail;
                      setPyqMessage({
                        type: "error",
                        text: detail || res.statusText || "Upload failed.",
                      });
                      setPyqUploading(false);
                      return;
                    }
                    setPyqMessage({
                      type: "success",
                      text:
                        json.message ??
                        `Saved ${json.questions_count ?? 0} questions for year ${json.year ?? "—"}.`,
                    });
                    window.dispatchEvent(new CustomEvent("pyq-uploaded"));
                    if (fileInput) fileInput.value = "";
                  } catch (err) {
                    setPyqMessage({
                      type: "error",
                      text: err instanceof Error ? err.message : "Upload failed.",
                    });
                  } finally {
                    setPyqUploading(false);
                  }
                }}
              >
                {pyqUploading ? "Uploading…" : "Upload with PDF"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4">
              {manualQuestionType === "MCQ" ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Correct option
                  </label>
                  <select
                    value={manualCorrectIndex}
                    onChange={(e) => setManualCorrectIndex(parseInt(e.target.value, 10))}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                </div>
              ) : manualQuestionType === "NUMERIC" ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Correct numeric answer
                  </label>
                  <input
                    value={manualNumericAnswer}
                    onChange={(e) => setManualNumericAnswer(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g. 101 or 101.00"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Correct options (multi)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(["A", "B", "C", "D"] as const).map((label, idx) => (
                      <label
                        key={label}
                        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                      >
                        <input
                          type="checkbox"
                          checked={manualMultiCorrect[idx]}
                          onChange={(e) => {
                            setManualMultiCorrect((prev) => {
                              const next = [...prev];
                              next[idx] = e.target.checked;
                              return next;
                            });
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Question
                </label>
                <ChemTextTextarea
                  mode={pyqTextMode}
                  value={manualQuestion}
                  onValueChange={setManualQuestion}
                  rows={4}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Type the question statement…"
                />
                <p className="text-[11px] text-slate-400">
                  {pyqTextMode === "katex"
                    ? "Use the toolbar for superscript, fractions, KaTeX math, or chemistry reactions like $\\ce{H2 + Cl2 -> 2HCl}$."
                    : "Normal text mode is active. Type the question exactly as plain text without KaTeX syntax."}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Add image(s) in question (optional)
                </label>
                <div className="mb-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void pasteClipboardImagesToTarget("stem")}
                    className="rounded-md border border-emerald-700/70 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                  >
                    Paste from clipboard
                  </button>
                  <span className="text-[10px] text-slate-500">Copy screenshot, then click paste</span>
                </div>
                <input
                  ref={manualStemImagesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"
                />
                {manualPastedStemImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {manualPastedStemImages.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group relative"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                          alt={file.name}
                          className="h-16 w-16 rounded-lg border border-slate-700 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setManualPastedStemImages((prev) => prev.filter((_, idx) => idx !== index))
                          }
                          className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/70 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {manualQuestionType === "NUMERIC" ? null : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Option 1 (A) text
                    </label>
                    <ChemTextInput
                      mode={pyqTextMode}
                      value={manualOpt1}
                      onValueChange={setManualOpt1}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Option A text…"
                    />
                  </div>
                  <input
                    ref={manualOpt1ImageRef}
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void pasteClipboardImagesToTarget("option", 0)}
                      className="rounded-md border border-emerald-700/70 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                    >
                      Paste image
                    </button>
                  </div>
                  {manualPastedOptionImages[0] && (
                    <div className="group relative mt-2">
                      <img
                        src={URL.createObjectURL(manualPastedOptionImages[0])}
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        alt={manualPastedOptionImages[0]?.name}
                        className="h-16 w-16 rounded-lg border border-slate-700 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setManualPastedOptionImages((prev) => {
                            const next = [...prev];
                            next[0] = null;
                            return next;
                          })
                        }
                        className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/70 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                        title="Remove image"
                      >
                        ×
                      </button>
                      <span className="text-[11px] text-slate-400 truncate block mt-1">
                        {manualPastedOptionImages[0]?.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Option 2 (B) text
                    </label>
                    <ChemTextInput
                      mode={pyqTextMode}
                      value={manualOpt2}
                      onValueChange={setManualOpt2}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Option B text…"
                    />
                  </div>
                  <input
                    ref={manualOpt2ImageRef}
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void pasteClipboardImagesToTarget("option", 1)}
                      className="rounded-md border border-emerald-700/70 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                    >
                      Paste image
                    </button>
                  </div>
                  {manualPastedOptionImages[1] && (
                    <div className="group relative mt-2">
                      <img
                        src={URL.createObjectURL(manualPastedOptionImages[1])}
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        alt={manualPastedOptionImages[1]?.name}
                        className="h-16 w-16 rounded-lg border border-slate-700 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setManualPastedOptionImages((prev) => {
                            const next = [...prev];
                            next[1] = null;
                            return next;
                          })
                        }
                        className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/70 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                        title="Remove image"
                      >
                        ×
                      </button>
                      <span className="text-[11px] text-slate-400 truncate block mt-1">
                        {manualPastedOptionImages[1]?.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Option 3 (C) text
                    </label>
                    <ChemTextInput
                      mode={pyqTextMode}
                      value={manualOpt3}
                      onValueChange={setManualOpt3}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Option C text…"
                    />
                  </div>
                  <input
                    ref={manualOpt3ImageRef}
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void pasteClipboardImagesToTarget("option", 2)}
                      className="rounded-md border border-emerald-700/70 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                    >
                      Paste image
                    </button>
                  </div>
                  {manualPastedOptionImages[2] && (
                    <div className="group relative mt-2">
                      <img
                        src={URL.createObjectURL(manualPastedOptionImages[2])}
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        alt={manualPastedOptionImages[2]?.name}
                        className="h-16 w-16 rounded-lg border border-slate-700 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setManualPastedOptionImages((prev) => {
                            const next = [...prev];
                            next[2] = null;
                            return next;
                          })
                        }
                        className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/70 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                        title="Remove image"
                      >
                        ×
                      </button>
                      <span className="text-[11px] text-slate-400 truncate block mt-1">
                        {manualPastedOptionImages[2]?.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Option 4 (D) text
                    </label>
                    <ChemTextInput
                      mode={pyqTextMode}
                      value={manualOpt4}
                      onValueChange={setManualOpt4}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Option D text…"
                    />
                  </div>
                  <input
                    ref={manualOpt4ImageRef}
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void pasteClipboardImagesToTarget("option", 3)}
                      className="rounded-md border border-emerald-700/70 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                    >
                      Paste image
                    </button>
                  </div>
                  {manualPastedOptionImages[3] && (
                    <div className="group relative mt-2">
                      <img
                        src={URL.createObjectURL(manualPastedOptionImages[3])}
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        alt={manualPastedOptionImages[3]?.name}
                        className="h-16 w-16 rounded-lg border border-slate-700 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setManualPastedOptionImages((prev) => {
                            const next = [...prev];
                            next[3] = null;
                            return next;
                          })
                        }
                        className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/70 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                        title="Remove image"
                      >
                        ×
                      </button>
                      <span className="text-[11px] text-slate-400 truncate block mt-1">
                        {manualPastedOptionImages[3]?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Solution (optional)
                </label>
                <ChemTextTextarea
                  mode={pyqTextMode}
                  value={manualSolution}
                  onValueChange={setManualSolution}
                  rows={3}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Solution text…"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Add image(s) in solution (optional)
                </label>
                <div className="mb-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void pasteClipboardImagesToTarget("solution")}
                    className="rounded-md border border-emerald-700/70 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                  >
                    Paste from clipboard
                  </button>
                  <span className="text-[10px] text-slate-500">Supports multiple screenshots</span>
                </div>
                <input
                  ref={manualSolutionImagesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"
                />
                {manualPastedSolutionImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {manualPastedSolutionImages.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group relative"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                          alt={file.name}
                          className="h-16 w-16 rounded-lg border border-slate-700 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setManualPastedSolutionImages((prev) => prev.filter((_, idx) => idx !== index))
                          }
                          className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/70 bg-slate-950/90 text-xs text-rose-200 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="mt-2 w-fit px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 text-slate-950 font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:pointer-events-none"
                type="button"
                disabled={pyqUploading}
                onClick={async () => {
                  addExamType(pyqExamType || (pyqExamMode === "cbse" ? "CBSE" : ""));
                  if (pyqExamMode === "standard" && !pyqExamType.trim()) {
                    setPyqMessage({ type: "error", text: "Please enter exam type (e.g. NEET, JEE Main)." });
                    return;
                  }
                  if (pyqExamMode === "cbse" && !cbseSubject) {
                    setPyqMessage({ type: "error", text: "Please select CBSE subject (Physics, Chemistry or Maths)." });
                    return;
                  }
                  if (!manualYear.trim()) {
                    setPyqMessage({ type: "error", text: "Please enter year." });
                    return;
                  }
                  setPyqMessage(null);
                  setPyqUploading(true);
                  try {
                    const { data: session } = await supabase.auth.getSession();
                    const token = session.session?.access_token;
                    if (!token) {
                      setPyqMessage({ type: "error", text: "Not signed in." });
                      setPyqUploading(false);
                      return;
                    }
                    const formData = new FormData();
                    const examTypeToSend =
                      pyqExamMode === "cbse" ? "CBSE" : pyqExamType.trim();
                    const chemistryTypeToSend =
                      pyqExamMode === "cbse" ? "" : pyqChemType || "";
                    const chapterNameBase = pyqChapterName.trim();
                    const chapterNameToSend = chapterNameBase;
                    formData.append("exam_type", examTypeToSend);
                    formData.append("chemistry_type", chemistryTypeToSend);
                    formData.append("chapter_name", chapterNameToSend);
                    formData.append("year", manualYear.trim());
                    formData.append("answer_type", manualQuestionType);
                    formData.append("question_text", manualQuestion);
                    formData.append("option1_text", manualOpt1);
                    formData.append("option2_text", manualOpt2);
                    formData.append("option3_text", manualOpt3);
                    formData.append("option4_text", manualOpt4);
                    if (manualQuestionType === "MCQ") {
                      formData.append("correct_index", String(manualCorrectIndex));
                    } else if (manualQuestionType === "NUMERIC") {
                      formData.append("correct_answer", manualNumericAnswer.trim());
                    } else {
                      const nums = manualMultiCorrect
                        .map((v, idx) => (v ? String(idx + 1) : null))
                        .filter(Boolean)
                        .join(",");
                      formData.append("correct_answer", nums);
                    }
                    formData.append("solution_text", manualSolution);

                    const stemFiles = manualStemImagesRef.current?.files;
                    if (stemFiles && stemFiles.length) {
                      Array.from(stemFiles).forEach((f) => formData.append("question_images", f));
                    }
                    manualPastedStemImages.forEach((f) => formData.append("question_images", f));
                    const solFiles = manualSolutionImagesRef.current?.files;
                    if (solFiles && solFiles.length) {
                      Array.from(solFiles).forEach((f) => formData.append("solution_images", f));
                    }
                    manualPastedSolutionImages.forEach((f) => formData.append("solution_images", f));
                    if (manualQuestionType !== "NUMERIC") {
                      const o1 = manualOpt1ImageRef.current?.files?.[0];
                      const o2 = manualOpt2ImageRef.current?.files?.[0];
                      const o3 = manualOpt3ImageRef.current?.files?.[0];
                      const o4 = manualOpt4ImageRef.current?.files?.[0];
                      const p1 = manualPastedOptionImages[0];
                      const p2 = manualPastedOptionImages[1];
                      const p3 = manualPastedOptionImages[2];
                      const p4 = manualPastedOptionImages[3];
                      if (o1 || p1) formData.append("option1_image", o1 || p1!);
                      if (o2 || p2) formData.append("option2_image", o2 || p2!);
                      if (o3 || p3) formData.append("option3_image", o3 || p3!);
                      if (o4 || p4) formData.append("option4_image", o4 || p4!);
                    }

                    const res = await fetch(`${API_BASE}/admin/pyq/manual`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      const detail = Array.isArray(json.detail)
                        ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
                        : json.detail;
                      setPyqMessage({ type: "error", text: detail || res.statusText || "Save failed." });
                      setPyqUploading(false);
                      return;
                    }
                    setPyqMessage({ type: "success", text: json.message || "Saved manual question." });
                    window.dispatchEvent(new CustomEvent("pyq-uploaded"));
                    setManualQuestion("");
                    setManualOpt1("");
                    setManualOpt2("");
                    setManualOpt3("");
                    setManualOpt4("");
                    setManualSolution("");
                    setManualCorrectIndex(0);
                    setManualNumericAnswer("");
                    setManualMultiCorrect([false, false, false, false]);
                    if (manualStemImagesRef.current) manualStemImagesRef.current.value = "";
                    if (manualSolutionImagesRef.current) manualSolutionImagesRef.current.value = "";
                    if (manualOpt1ImageRef.current) manualOpt1ImageRef.current.value = "";
                    if (manualOpt2ImageRef.current) manualOpt2ImageRef.current.value = "";
                    if (manualOpt3ImageRef.current) manualOpt3ImageRef.current.value = "";
                    if (manualOpt4ImageRef.current) manualOpt4ImageRef.current.value = "";
                    setManualPastedStemImages([]);
                    setManualPastedSolutionImages([]);
                    setManualPastedOptionImages([null, null, null, null]);
                  } catch (err) {
                    setPyqMessage({ type: "error", text: err instanceof Error ? err.message : "Save failed." });
                  } finally {
                    setPyqUploading(false);
                  }
                }}
              >
                {pyqUploading ? "Saving…" : "Save manual question"}
              </button>
            </div>
          </>
        )) : null}
        {pyqMessage && (
          <p
            className={`mt-3 text-sm ${pyqMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}
          >
            {pyqMessage.text}
          </p>
        )}
        
          </>
        )}
        </section>
      )}

      {/* Notes upload section (own view) */}
      {userDashboardPanel === "notes" && (
      <section
        ref={notesSectionRef}
        className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 md:p-8"
      >
        <button
          type="button"
          onClick={() => setUserDashboardPanel("none")}
          className="mb-4 inline-flex items-center gap-2 text-[11px] text-slate-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to actions
        </button>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-50 mb-2">
          Upload Notes
        </h2>
        <p className="text-sm text-slate-300 mb-4">
          Upload chapter-wise or topic-wise notes for each exam.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] uppercase tracking-wide text-slate-400 mr-1">
            Exam mode
          </span>
          <button
            type="button"
            onClick={() => {
              setNotesExamMode("standard");
              setNotesCbseSubject("");
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
              notesExamMode === "standard"
                ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-cyan-400/60"
            }`}
          >
            JEE / NEET Chemistry
          </button>
          <button
            type="button"
            onClick={() => {
              setNotesExamMode("cbse");
              setNotesExamType("CBSE");
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
              notesExamMode === "cbse"
                ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-emerald-400/60"
            }`}
          >
            CBSE (Physics / Chemistry / Maths)
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {/* Exam type */}
          {notesExamMode === "cbse" ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Exam Type
              </label>
              <input
                type="text"
                value="CBSE"
                readOnly
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 opacity-80"
              />
              <p className="text-[10px] text-slate-500">
                CBSE exam is fixed. Use subject below to pick Physics, Chemistry or Maths.
              </p>
            </div>
          ) : (
            <ExamTypeInput
              label="Exam Type"
              value={notesExamType}
              onChange={setNotesExamType}
              suggestions={examTypes}
            />
          )}

          {/* Chemistry type (only for JEE / NEET chemistry mode) */}
          {notesExamMode === "standard" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Chemistry Type
              </label>
              <select
                value={notesChemType}
                onChange={(e) => setNotesChemType(e.target.value as ChemistryType)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select</option>
                {CHEMISTRY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CBSE subject (only in CBSE mode) */}
          {notesExamMode === "cbse" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                CBSE Subject
              </label>
              <select
                value={notesCbseSubject}
                onChange={(e) =>
                  setNotesCbseSubject(e.target.value as typeof notesCbseSubject)
                }
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Maths">Maths</option>
              </select>
            </div>
          )}

          {/* Notes title */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Notes Title / Topic
            </label>
            <input
              type="text"
              placeholder="e.g. Atomic Structure - Short Notes"
              value={notesTitle}
              onChange={(e) => setNotesTitle(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* PDF + thumbnail input + button */}
        <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Notes PDF
            </label>
            <input
              ref={notesFileInputRef}
              type="file"
              accept="application/pdf"
              className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Thumbnail (optional)
            </label>
            <input
              ref={notesThumbnailInputRef}
              type="file"
              accept="image/*"
              className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:text-emerald-300 hover:file:bg-emerald-500/20"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Upload a small cover image for this notes PDF (PNG/JPG/WEBP).
            </p>
          </div>
          <button
            className="mt-1 px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 text-slate-950 font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:pointer-events-none"
            type="button"
            disabled={notesUploading}
            onClick={async () => {
              addExamType(notesExamType || (notesExamMode === "cbse" ? "CBSE" : ""));
              const file = notesFileInputRef.current?.files?.[0];
              if (!file) {
                setNotesMessage({ type: "error", text: "Please select a PDF file." });
                return;
              }
              if (notesExamMode === "standard" && !notesExamType.trim()) {
                setNotesMessage({
                  type: "error",
                  text: "Please enter exam type (e.g. NEET, JEE Main).",
                });
                return;
              }
              if (notesExamMode === "standard" && !notesChemType) {
                setNotesMessage({
                  type: "error",
                  text: "Please select chemistry type.",
                });
                return;
              }
              if (notesExamMode === "cbse" && !notesCbseSubject) {
                setNotesMessage({
                  type: "error",
                  text: "Please select CBSE subject (Physics, Chemistry or Maths).",
                });
                return;
              }
              if (!notesTitle.trim()) {
                setNotesMessage({
                  type: "error",
                  text: "Please enter notes title / topic.",
                });
                return;
              }

              setNotesMessage(null);
              setNotesUploading(true);
              try {
                const { data: session } = await supabase.auth.getSession();
                const token = session.session?.access_token;
                if (!token) {
                  setNotesMessage({ type: "error", text: "Not signed in." });
                  setNotesUploading(false);
                  return;
                }

                const formData = new FormData();
                formData.append("file", file);
                const thumbFile = notesThumbnailInputRef.current?.files?.[0];
                if (thumbFile) {
                  formData.append("thumbnail", thumbFile);
                }
                const examTypeToSend =
                  notesExamMode === "cbse" ? "CBSE" : notesExamType.trim();
                const chemTypeToSend =
                  notesExamMode === "cbse" ? "" : notesChemType || "";

                formData.append("exam_type", examTypeToSend);
                formData.append("chemistry_type", chemTypeToSend);
                formData.append(
                  "subject",
                  notesExamMode === "cbse" ? notesCbseSubject : ""
                );
                formData.append("title", notesTitle.trim());

                const res = await fetch(`${API_BASE}/admin/notes/upload`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: formData,
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                  const detail = Array.isArray(json.detail)
                    ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
                    : json.detail;
                  setNotesMessage({
                    type: "error",
                    text: detail || res.statusText || "Upload failed.",
                  });
                  setNotesUploading(false);
                  return;
                }

                setNotesMessage({
                  type: "success",
                  text: json.message || "Notes PDF uploaded.",
                });
                setNotesTitle("");
                setNotesChemType("");
                setNotesCbseSubject("");
                if (notesFileInputRef.current) {
                  notesFileInputRef.current.value = "";
                }
                if (notesThumbnailInputRef.current) {
                  notesThumbnailInputRef.current.value = "";
                }
              window.dispatchEvent(new CustomEvent("notes-uploaded"));
              } catch (err) {
                setNotesMessage({
                  type: "error",
                  text: err instanceof Error ? err.message : "Upload failed.",
                });
              } finally {
                setNotesUploading(false);
              }
            }}
          >
            {notesUploading ? "Uploading…" : "Upload Notes"}
          </button>
        </div>
        {notesMessage && (
          <p
            className={`mt-3 text-sm ${
              notesMessage.type === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {notesMessage.text}
          </p>
        )}
        <div className="mt-6 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Your uploaded notes
              </h3>
              <p className="text-[11px] text-slate-400">
                Recently uploaded notes PDFs. You can open or delete them here.
              </p>
            </div>
          </div>
          {notesListLoading ? (
            <p className="text-xs text-slate-400">Loading notes…</p>
          ) : notesListError ? (
            <p className="text-xs text-red-400">{notesListError}</p>
          ) : notesList.length === 0 ? (
            <p className="text-xs text-slate-500">
              No notes uploaded yet.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800">
              {notesList.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 md:px-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-100 truncate">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {n.chemistry_type || n.subject || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={n.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-sky-500/70 px-2 py-0.5 text-[11px] text-sky-200 hover:bg-sky-500/20"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-red-500/70 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                      disabled={notesDeleteBusyId === n.id}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "Delete this note PDF permanently? This cannot be undone and will remove it from any bundles."
                          )
                        ) {
                          return;
                        }
                        try {
                          setNotesDeleteBusyId(n.id);
                          const { data } = await supabase.auth.getSession();
                          const token = data.session?.access_token;
                          if (!token) {
                            setNotesListError("Not signed in.");
                            return;
                          }
                          const res = await fetch(
                            `${API_BASE}/admin/notes/delete`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ note_id: n.id }),
                            }
                          );
                          const json = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            const detail =
                              (Array.isArray((json as any).detail)
                                ? (json as any).detail
                                    .map((d: { msg?: string }) => d.msg)
                                    .join(" ")
                                : (json as any).detail) || res.statusText;
                            throw new Error(detail);
                          }
                          setNotesList((prev) =>
                            prev.filter((item) => item.id !== n.id)
                          );
                        } catch (err) {
                          setNotesListError(
                            err instanceof Error
                              ? err.message
                              : "Failed to delete note."
                          );
                        } finally {
                          setNotesDeleteBusyId(null);
                        }
                      }}
                    >
                      {notesDeleteBusyId === n.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* Notes bundle maker (own view) */}
      {userDashboardPanel === "bundles" && (
      <section
        ref={bundleSectionRef}
        className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 md:p-8"
      >
        <button
          type="button"
          onClick={() => setUserDashboardPanel("none")}
          className="mb-4 inline-flex items-center gap-2 text-[11px] text-slate-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to actions
        </button>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-50 mb-2">
          Notes Bundle Maker
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          Combine individual notes into a paid bundle for a specific exam. You’ll
          later connect this to the user dashboard so students can purchase it.
          Exam types here are the same dynamic list based on what you’ve used
          before.
        </p>

        {/* Exam type selectors (used for filtering) */}
        <div className="grid md:grid-cols-1 gap-4 mb-6">
          <div className="flex flex-col gap-3">
            {/* Exam mode toggle for source notes */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setBundleSourceExamMode("standard");
                  setBundleCbseSubject("");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  bundleSourceExamMode === "standard"
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-100"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/50"
                }`}
              >
                JEE / NEET Chemistry notes
              </button>
              <button
                type="button"
                onClick={() => {
                  setBundleSourceExamMode("cbse");
                  setBundleSourceExamType("CBSE");
                  setBundleChemType("");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  bundleSourceExamMode === "cbse"
                    ? "bg-emerald-500/15 border-emerald-400 text-emerald-100"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500/50"
                }`}
              >
                CBSE notes (Physics / Chemistry / Maths)
              </button>
            </div>

            {/* Source exam type input (for JEE/NEET) */}
            {bundleSourceExamMode === "standard" && (
              <ExamTypeInput
                label="Source Exam Type (filter notes)"
                value={bundleSourceExamType}
                onChange={setBundleSourceExamType}
                suggestions={examTypes}
              />
            )}

            {/* Chemistry type for bundle filter (JEE/NEET mode) */}
            {bundleSourceExamMode === "standard" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Bundle Chemistry Type
                </label>
                <select
                  value={bundleChemType}
                  onChange={(e) =>
                    setBundleChemType(e.target.value as ChemistryType)
                  }
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select</option>
                  {CHEMISTRY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CBSE subject filter */}
            {bundleSourceExamMode === "cbse" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  CBSE Subject (for filtering)
                </label>
                <select
                  value={bundleCbseSubject}
                  onChange={(e) =>
                    setBundleCbseSubject(e.target.value as typeof bundleCbseSubject)
                  }
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">All subjects</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Maths">Maths</option>
                </select>
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              Use these filters to pull notes from JEE/NEET or CBSE (or both, by switching modes) into your bundle.
            </p>
          </div>
        </div>

        {/* Notes list + bundle details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Notes multi-select (loaded from uploaded notes) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Select Notes
              {selectedNoteIds.length > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/60 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                  {selectedNoteIds.length} selected
                </span>
              )}
            </label>
            <input
              type="text"
              value={bundleNotesSearch}
              onChange={(e) => setBundleNotesSearch(e.target.value)}
              placeholder="Search notes by title / type / subject"
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 text-sm text-slate-200">
              {bundleNotesLoading && (
                <p className="text-[11px] text-slate-400">Loading notes…</p>
              )}
              {!bundleNotesLoading && bundleNotesError && (
                <p className="text-[11px] text-red-400">{bundleNotesError}</p>
              )}
              {!bundleNotesLoading && !bundleNotesError && filteredBundleNotes.length === 0 && (
                <p className="text-[11px] text-slate-400">
                  {bundleNotes.length === 0
                    ? "No notes found for this filter yet. Upload some notes first."
                    : "No notes match your search."}
                </p>
              )}
              {!bundleNotesLoading &&
                !bundleNotesError &&
                filteredBundleNotes.map((note) => {
                  const checked = selectedNoteIds.includes(note.id);
                  const subtitleParts: string[] = [];
                  if (note.chemistry_type) subtitleParts.push(note.chemistry_type);
                  if (note.subject) subtitleParts.push(note.subject);
                  return (
                    <label
                      key={note.id}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="accent-cyan-500"
                        checked={checked}
                        onChange={() => {
                          setSelectedNoteIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== note.id)
                              : [...prev, note.id]
                          );
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="whitespace-normal break-words">{note.title}</span>
                        {subtitleParts.length > 0 && (
                          <span className="text-[10px] text-slate-500 whitespace-normal break-words">
                            {subtitleParts.join(" · ")}
                          </span>
                        )}
                      </div>

        {/* Existing questions list (for both standard and CBSE) */}
        <div className="mt-4">
          {pyqQuestionsLoading ? (
            <p className="text-xs text-slate-400">Loading questions…</p>
          ) : pyqQuestions.length === 0 ? (
            <p className="text-xs text-slate-500">
              {pyqBrowseAll
                ? "No uploaded questions found yet."
                : ""}
            </p>
          ) : (
            <>
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-800">
                  {pyqQuestions.map((q, idx) => {
                    const num = q.question_number ?? idx + 1;
                    const metaParts: string[] = [];
                    if (q.year) metaParts.push(String(q.year));
                    if (q.exam_code) metaParts.push(String(q.exam_code));
                    if (q.chapter_name) metaParts.push(String(q.chapter_name));
                    const meta = metaParts.join(" · ");
                    const hasText = Boolean((q.question_text || "").trim());
                    const firstStemImage = (q.question_image_urls || [])[0];

                    return (
                      <div
                        key={q.id}
                        className="group px-3 py-3 md:px-4 md:py-3.5 hover:bg-slate-900/40"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-[11px] font-semibold text-slate-200">
                            {num}
                          </div>

                          <div className="flex-1 min-w-0">
                            {hasText ? (
                              <p className="text-slate-100 text-[13px] md:text-sm leading-snug line-clamp-2">
                                <ChemText text={q.question_text} />
                              </p>
                            ) : firstStemImage ? (
                              <a
                                href={firstStemImage}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={firstStemImage}
                                  alt={`Question ${num} image`}
                                  className="h-24 w-full max-w-sm rounded-lg border border-slate-700 bg-white p-1 object-contain hover:border-cyan-400/70"
                                  loading="lazy"
                                />
                              </a>
                            ) : (
                              <p className="text-slate-400 text-[13px] md:text-sm">(no text)</p>
                            )}
                            {meta && (
                              <p className="mt-1 text-[10px] text-slate-500 truncate">
                                {meta}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full border border-sky-500/70 px-2 py-0.5 text-[11px] text-sky-200 hover:bg-sky-500/20"
                              onClick={() => {
                                const baseOptions = Array.isArray(q.options)
                                  ? [...q.options]
                                  : [];
                                while (baseOptions.length < 4) {
                                  baseOptions.push("");
                                }
                                setPyqEditingQuestion({
                                  ...q,
                                  options: baseOptions.slice(0, 4),
                                });
                              }}
                            >
                              View / Edit
                            </button>

                            <button
                              type="button"
                              className="inline-flex items-center rounded-full border border-red-500/70 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                              disabled={pyqDeleteBusyId === q.id}
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    "Delete this question permanently? This cannot be undone."
                                  )
                                ) {
                                  return;
                                }
                                try {
                                  setPyqDeleteBusyId(q.id);
                                  const { data } = await supabase.auth.getSession();
                                  const token = data.session?.access_token;
                                  if (!token) {
                                    setPyqMessage({
                                      type: "error",
                                      text: "Not signed in.",
                                    });
                                    return;
                                  }
                                  const res = await fetch(
                                    `${API_BASE}/admin/pyq/questions/delete`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({ question_id: q.id }),
                                    }
                                  );
                                  const json = await res.json().catch(() => ({}));
                                  if (!res.ok) {
                                    const detail =
                                      (Array.isArray(json.detail)
                                        ? json.detail
                                            .map((d: { msg?: string }) => d.msg)
                                            .join(" ")
                                        : json.detail) || res.statusText;
                                    throw new Error(detail);
                                  }
                                  setPyqQuestions((prev) =>
                                    prev.filter((item) => item.id !== q.id)
                                  );
                                  if (pyqEditingQuestion?.id === q.id) {
                                    setPyqEditingQuestion(null);
                                  }
                                  setPyqMessage({
                                    type: "success",
                                    text: "Question deleted.",
                                  });
                                } catch (err) {
                                  setPyqMessage({
                                    type: "error",
                                    text:
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to delete question.",
                                  });
                                } finally {
                                  setPyqDeleteBusyId(null);
                                }
                              }}
                            >
                              {pyqDeleteBusyId === q.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {pyqEditingQuestion && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-50">
                        Edit question
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Update the question text, options, correct answer and solution. Changes are saved only after you click &quot;Save changes&quot;.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setPyqEditingQuestion(null)}
                    >
                      Close
                    </button>
                  </div>

                  <PyqTextModeToggle mode={pyqTextMode} onChange={setPyqTextMode} compact />

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <label className="flex flex-col gap-1 text-xs text-slate-200">
                      <span className="font-semibold uppercase tracking-wide">Exam</span>
                      <input
                        type="text"
                        placeholder="e.g. NEET / JEE Main / CBSE"
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={pyqEditingQuestion.exam_code || ""}
                        onChange={(e) =>
                          setPyqEditingQuestion((prev) =>
                            prev ? { ...prev, exam_code: e.target.value } : prev
                          )
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-slate-200">
                      <span className="font-semibold uppercase tracking-wide">Year</span>
                      <input
                        type="number"
                        placeholder="e.g. 2024"
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={pyqEditingQuestion.year ?? ""}
                        onChange={(e) =>
                          setPyqEditingQuestion((prev) => {
                            if (!prev) return prev;
                            const value = e.target.value;
                            return {
                              ...prev,
                              year: value === "" ? undefined : Number(value),
                            };
                          })
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-slate-200">
                      <span className="font-semibold uppercase tracking-wide">Chapter</span>
                      <input
                        type="text"
                        placeholder="e.g. Haloalkanes"
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={pyqEditingQuestion.chapter_name || ""}
                        onChange={(e) =>
                          setPyqEditingQuestion((prev) =>
                            prev ? { ...prev, chapter_name: e.target.value } : prev
                          )
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-slate-200">
                      <span className="font-semibold uppercase tracking-wide">Chemistry type</span>
                      <select
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={pyqEditingQuestion.chemistry_type || ""}
                        onChange={(e) =>
                          setPyqEditingQuestion((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  chemistry_type: e.target.value || null,
                                }
                              : prev
                          )
                        }
                      >
                        <option value="">Not set</option>
                        <option value="Organic">Organic</option>
                        <option value="Inorganic">Inorganic</option>
                        <option value="Physical">Physical</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-slate-200">
                      <span className="font-semibold uppercase tracking-wide">Question no.</span>
                      <input
                        type="number"
                        min={1}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={pyqEditingQuestion.question_number ?? ""}
                        onChange={(e) =>
                          setPyqEditingQuestion((prev) => {
                            if (!prev) return prev;
                            const value = e.target.value;
                            return {
                              ...prev,
                              question_number: value === "" ? undefined : Number(value),
                            };
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="flex flex-col gap-1 text-xs text-slate-200">
                      <span className="font-semibold uppercase tracking-wide">
                        Full question
                      </span>
                      <ChemTextTextarea
                        mode={pyqTextMode}
                        className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={pyqEditingQuestion.question_text}
                        onValueChange={(value) =>
                          setPyqEditingQuestion((prev) =>
                            prev
                              ? { ...prev, question_text: value }
                              : prev
                          )
                        }
                      />
                    </label>

                    <div className="grid md:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-xs text-slate-200">
                        <span className="font-semibold uppercase tracking-wide">
                          Answer type
                        </span>
                        <select
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          value={pyqEditingQuestion.answer_type || "MCQ"}
                          onChange={(e) =>
                            setPyqEditingQuestion((prev) =>
                              prev
                                ? { ...prev, answer_type: e.target.value }
                                : prev
                            )
                          }
                        >
                          <option value="MCQ">MCQ (single correct)</option>
                          <option value="NUMERIC">Numeric answer</option>
                          <option value="MULTI">Multiple correct</option>
                        </select>
                      </label>

                      {pyqEditingQuestion.answer_type === "NUMERIC" ? (
                        <label className="flex flex-col gap-1 text-xs text-slate-200">
                          <span className="font-semibold uppercase tracking-wide">
                            Correct numeric answer
                          </span>
                          <input
                            type="text"
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            value={pyqEditingQuestion.correct_answer || ""}
                            onChange={(e) =>
                              setPyqEditingQuestion((prev) =>
                                prev
                                  ? { ...prev, correct_answer: e.target.value }
                                  : prev
                              )
                            }
                          />
                        </label>
                      ) : (
                        <label className="flex flex-col gap-1 text-xs text-slate-200">
                          <span className="font-semibold uppercase tracking-wide">
                            Correct option (0–3)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={3}
                            className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            value={
                              typeof pyqEditingQuestion.correct_index === "number"
                                ? pyqEditingQuestion.correct_index
                                : 0
                            }
                            onChange={(e) =>
                              setPyqEditingQuestion((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      correct_index: Number(e.target.value) || 0,
                                    }
                                  : prev
                              )
                            }
                          />
                        </label>
                      )}
                    </div>

                    {pyqEditingQuestion.answer_type !== "NUMERIC" && (
                      <div className="grid md:grid-cols-2 gap-3">
                        {(pyqEditingQuestion.options || []).map((opt, i) => (
                          <label
                            key={i}
                            className="flex flex-col gap-1 text-xs text-slate-200"
                          >
                            <span className="font-semibold uppercase tracking-wide">
                              Option {i + 1}
                            </span>
                            <ChemTextTextarea
                              mode={pyqTextMode}
                              className="min-h-[48px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              value={opt || ""}
                              onValueChange={(value) =>
                                setPyqEditingQuestion((prev) => {
                                  if (!prev) return prev;
                                  const nextOpts = [...(prev.options || [])];
                                  while (nextOpts.length < 4) {
                                    nextOpts.push("");
                                  }
                                  nextOpts[i] = value;
                                  return { ...prev, options: nextOpts };
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                    )}

                    <label className="flex flex-col gap-1 text-xs text-slate-200">
                      <span className="font-semibold uppercase tracking-wide">
                        Solution (text)
                      </span>
                      <ChemTextTextarea
                        mode={pyqTextMode}
                        className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={pyqEditingQuestion.solution_text || ""}
                        onValueChange={(value) =>
                          setPyqEditingQuestion((prev) =>
                            prev
                              ? { ...prev, solution_text: value }
                              : prev
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <p className="text-[11px] text-slate-400">
                      Question ID: {pyqEditingQuestion.id}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-emerald-500/80 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-60"
                      disabled={pyqEditSaving}
                      onClick={async () => {
                        if (!pyqEditingQuestion) return;
                        try {
                          setPyqEditSaving(true);
                          const { data } = await supabase.auth.getSession();
                          const token = data.session?.access_token;
                          if (!token) {
                            setPyqMessage({
                              type: "error",
                              text: "Not signed in.",
                            });
                            return;
                          }

                          const payload: any = {
                            question_id: pyqEditingQuestion.id,
                            question_text: pyqEditingQuestion.question_text,
                            answer_type: pyqEditingQuestion.answer_type || "MCQ",
                            solution_text:
                              pyqEditingQuestion.solution_text || null,
                            exam_code: pyqEditingQuestion.exam_code || "",
                            chapter_name: pyqEditingQuestion.chapter_name || "",
                            chemistry_type: pyqEditingQuestion.chemistry_type || null,
                          };

                          if (typeof pyqEditingQuestion.year === "number") {
                            payload.year = pyqEditingQuestion.year;
                          }

                          if (typeof pyqEditingQuestion.question_number === "number") {
                            payload.question_number = pyqEditingQuestion.question_number;
                          }

                          if (
                            pyqEditingQuestion.answer_type === "NUMERIC" &&
                            (pyqEditingQuestion.correct_answer || "").trim()
                          ) {
                            payload.correct_answer =
                              pyqEditingQuestion.correct_answer;
                            payload.correct_index = null;
                          } else {
                            payload.correct_index =
                              typeof pyqEditingQuestion.correct_index ===
                              "number"
                                ? pyqEditingQuestion.correct_index
                                : 0;
                            payload.correct_answer =
                              pyqEditingQuestion.correct_answer || null;
                          }

                          if (
                            pyqEditingQuestion.answer_type !== "NUMERIC" &&
                            pyqEditingQuestion.options
                          ) {
                            payload.options = pyqEditingQuestion.options;
                          }

                          const res = await fetch(
                            `${API_BASE}/admin/pyq/questions/update`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify(payload),
                            }
                          );
                          const json = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            const detail =
                              (Array.isArray(json.detail)
                                ? json.detail
                                    .map((d: { msg?: string }) => d.msg)
                                    .join(" ")
                                : json.detail) || res.statusText;
                            throw new Error(detail);
                          }

                          setPyqQuestions((prev) =>
                            prev.map((q) =>
                              q.id === pyqEditingQuestion.id ? pyqEditingQuestion : q
                            )
                          );
                          setPyqMessage({
                            type: "success",
                            text: "Question updated successfully.",
                          });
                        } catch (err) {
                          setPyqMessage({
                            type: "error",
                            text:
                              err instanceof Error
                                ? err.message
                                : "Failed to update question.",
                          });
                        } finally {
                          setPyqEditSaving(false);
                        }
                      }}
                    >
                      {pyqEditSaving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
                    </label>
                  );
                })}
            </div>
            <p className="text-[11px] text-slate-500">
              This lists the PDFs you have uploaded in the Notes section, filtered by the controls above.
            </p>

            {/* Summary of currently selected notes across all filters (JEE/NEET + CBSE) */}
            {selectedNoteIds.length > 0 && (
              <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/80 p-2 space-y-1">
                <p className="text-[11px] text-slate-400">
                  Notes added to this bundle (across JEE/NEET and CBSE):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNoteIds.map((id) => {
                    const note = allBundleNotes[id];
                    const label = note?.title ?? id;
                    const meta: string[] = [];
                    if (note?.chemistry_type) meta.push(note.chemistry_type);
                    if (note?.subject) meta.push(note.subject);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-600 px-2 py-0.5 text-[10px] text-slate-100 max-w-full"
                      >
                        <span className="whitespace-normal break-words">{label}</span>
                        {meta.length > 0 && (
                          <span className="text-[9px] text-slate-400 whitespace-normal break-words">
                            {meta.join(" · ")}
                          </span>
                        )}
                        <button
                          type="button"
                          className="ml-1 text-slate-400 hover:text-red-300"
                          onClick={() => {
                            setSelectedNoteIds((prev) => prev.filter((nid) => nid !== id));
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bundle meta: bundle exam type + title + category + price */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Bundle Exam Type (where students will see it)
              </label>
              <input
                type="text"
                value={bundleTargetExamType}
                readOnly
                placeholder="Select exams from the dropdown below"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
              />
              {examTypes.length > 0 && (
                <div className="mt-2 space-y-2">
                  {/* Simple selector that adds exams to the bundle label */}
                  <select
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    defaultValue=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      setBundleTargetExamSelections((prev) => {
                        if (prev.includes(val)) return prev;
                        const next = [...prev, val];
                        setBundleTargetExamType(next.join(" + "));
                        return next;
                      });
                      e.target.value = "";
                    }}
                  >
                    <option value="">Add exam from list…</option>
                    {examTypes.map((exam) => (
                      <option key={exam} value={exam}>
                        {exam}
                      </option>
                    ))}
                  </select>

                  {/* Show currently selected exams as chips */}
                  {bundleTargetExamSelections.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bundleTargetExamSelections.map((exam) => (
                        <span
                          key={exam}
                          className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-400/70 px-2 py-0.5 text-[10px] text-cyan-50"
                        >
                          {exam}
                          <button
                            type="button"
                            className="text-cyan-100/80 hover:text-red-200"
                            onClick={() => {
                              setBundleTargetExamSelections((prev) => {
                                const next = prev.filter((e) => e !== exam);
                                setBundleTargetExamType(next.join(" + "));
                                return next;
                              });
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                This decides in which exam sections the bundle appears in the user
                dashboard. Use the chips above to quickly add all relevant exams.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Bundle Title
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Organic Chemistry Notes Bundle"
                value={bundleTitle}
                onChange={(e) => setBundleTitle(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Bundle Description (shown under title)
              </label>
              <textarea
                placeholder="Short description students will see under the bundle title."
                value={bundleDescription}
                onChange={(e) => setBundleDescription(e.target.value)}
                rows={3}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
              <p className="text-[11px] text-slate-500">
                Keep this 1–2 lines. For example: &quot;Complete Organic Chemistry notes +
                PYQs with handwritten solutions.&quot;
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Actual Price (₹)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="999"
                value={bundleActualPrice}
                onChange={(e) => setBundleActualPrice(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[10px] text-slate-500">
                Original price before discount. Optional; leave empty for no discount display.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Discounted Price (₹)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="499"
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[10px] text-slate-500">
                Selling price. Must be ≤ Actual price if both are set.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Bundle Thumbnail (optional)
              </label>
              <input
                ref={bundleThumbnailInputRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-slate-200 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:text-emerald-300 hover:file:bg-emerald-500/20"
              />
              <p className="text-[10px] text-slate-500">
                Small cover image for this bundle (shown in Notes Library later).
              </p>
            </div>

            <button
              type="button"
              className="mt-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 text-slate-950 font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:pointer-events-none"
              disabled={bundleSaving}
              onClick={async () => {
                setBundleMessage(null);

                if (bundleTargetExamSelections.length === 0) {
                  setBundleMessage({
                    type: "error",
                    text: "Please select at least one exam for this bundle.",
                  });
                  return;
                }
                if (!bundleTitle.trim()) {
                  setBundleMessage({
                    type: "error",
                    text: "Please enter a bundle title.",
                  });
                  return;
                }
                if (!bundlePrice.trim()) {
                  setBundleMessage({
                    type: "error",
                    text: "Please enter a discounted price for the bundle.",
                  });
                  return;
                }
                const priceNumber = Number(bundlePrice);
                if (Number.isNaN(priceNumber) || priceNumber < 0) {
                  setBundleMessage({
                    type: "error",
                    text: "Discounted price must be a non‑negative number.",
                  });
                  return;
                }
                let actualPriceNum: number | null = null;
                if (bundleActualPrice.trim()) {
                  actualPriceNum = Number(bundleActualPrice);
                  if (Number.isNaN(actualPriceNum) || actualPriceNum < 0) {
                    setBundleMessage({
                      type: "error",
                      text: "Actual price must be a non‑negative number.",
                    });
                    return;
                  }
                  if (actualPriceNum < priceNumber) {
                    setBundleMessage({
                      type: "error",
                      text: "Actual price must be greater than or equal to discounted price.",
                    });
                    return;
                  }
                }
                if (selectedNoteIds.length === 0) {
                  setBundleMessage({
                    type: "error",
                    text: "Please select at least one note to include in the bundle.",
                  });
                  return;
                }

                try {
                  setBundleSaving(true);

                  const { data } = await supabase.auth.getSession();
                  const token = data.session?.access_token;
                  if (!token) {
                    setBundleMessage({ type: "error", text: "Not signed in." });
                    setBundleSaving(false);
                    return;
                  }

                  const examsLabel =
                    bundleTargetExamSelections.join(" + ") ||
                    bundleTargetExamType.trim();

                  const formData = new FormData();
                  formData.append("exam_type", examsLabel);
                  formData.append("chemistry_type", "");
                  formData.append("subject", "");
                  formData.append("title", bundleTitle.trim());
                  formData.append("description", bundleDescription.trim());
                  formData.append("price", String(priceNumber));
                  if (actualPriceNum != null) {
                    formData.append("actual_price", String(actualPriceNum));
                  }
                  formData.append("note_ids", JSON.stringify(selectedNoteIds));
                  const thumb = bundleThumbnailInputRef.current?.files?.[0];
                  if (thumb) {
                    formData.append("thumbnail", thumb);
                  }

                  const res = await fetch(`${API_BASE}/admin/notes/bundles/create`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    const detail = Array.isArray(json.detail)
                      ? json.detail.map((d: { msg?: string }) => d.msg).join(" ")
                      : json.detail;
                    setBundleMessage({
                      type: "error",
                      text: detail || res.statusText || "Failed to create bundle.",
                    });
                    setBundleSaving(false);
                    return;
                  }

                  addExamType(bundleSourceExamType);
                  addExamType(bundleTargetExamType);

                  setBundleMessage({
                    type: "success",
                    text: json.message || "Notes bundle created.",
                  });
                  setBundleTitle("");
                  setBundleDescription("");
                  setBundlePrice("");
                  setBundleActualPrice("");
                  setSelectedNoteIds([]);
                  if (bundleThumbnailInputRef.current) {
                    bundleThumbnailInputRef.current.value = "";
                  }
                } catch (err) {
                  setBundleMessage({
                    type: "error",
                    text: err instanceof Error ? err.message : "Failed to create bundle.",
                  });
                } finally {
                  setBundleSaving(false);
                }
              }}
            >
              {bundleSaving ? "Creating Bundle…" : "Create Bundle"}
            </button>

            {bundleMessage && (
              <p
                className={`mt-2 text-sm ${
                  bundleMessage.type === "success" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {bundleMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* Existing bundles list for manage/edit/delete */}
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">
            Existing bundles
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">
            These are the notes bundles you have created. Use the actions on the right to edit the title/price or delete a bundle.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            {notesBundlesLoading ? (
              <p className="text-xs text-slate-400">Loading bundles…</p>
            ) : notesBundlesError ? (
              <p className="text-xs text-red-400">{notesBundlesError}</p>
            ) : notesBundles.length === 0 ? (
              <p className="text-xs text-slate-500">
                No bundles created yet. Create your first bundle above.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                {notesBundles.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-100 truncate">
                        {b.title || "(untitled bundle)"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                        <span>{(b.display_exam_label || "").trim() || "—"}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-300">
                            ₹{b.price != null ? b.price.toString() : "0"}
                          </span>
                          {b.actual_price != null && b.actual_price > (b.price ?? 0) && (
                            <>
                              <span className="text-slate-500 line-through text-[10px]">
                                ₹{b.actual_price}
                              </span>
                              <span className="rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.5 text-[10px] font-semibold">
                                {Math.round((1 - (b.price ?? 0) / b.actual_price) * 100)}% OFF
                              </span>
                            </>
                          )}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-sky-500/70 px-2 py-0.5 text-[11px] text-sky-200 hover:bg-sky-500/20"
                        onClick={async () => {
                          setEditingBundle(b);
                          setEditingBundleNotes([]);
                          setEditingBundleNoteIds([]);
                          setEditingBundleNotesLoading(true);
                          try {
                            const { data } = await supabase.auth.getSession();
                            const token = data.session?.access_token;
                            if (!token) {
                              setNotesBundlesError("Not signed in.");
                              setEditingBundleNotesLoading(false);
                              return;
                            }
                            const res = await fetch(
                              `${API_BASE}/admin/notes/bundles/notes?bundle_id=${encodeURIComponent(
                                b.id
                              )}`,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              }
                            );
                            const json = await res.json();
                            if (!res.ok) {
                              const detail = Array.isArray(json.detail)
                                ? json.detail
                                    .map((d: { msg?: string }) => d.msg)
                                    .join(" ")
                                : json.detail;
                              throw new Error(detail || res.statusText);
                            }
                            const list: NotesRecord[] = Array.isArray(json.notes)
                              ? json.notes
                              : [];
                            setEditingBundleNotes(list);
                            setEditingBundleNoteIds(list.map((n) => n.id));
                          } catch (err) {
                            setNotesBundlesError(
                              err instanceof Error
                                ? err.message
                                : "Failed to load bundle notes."
                            );
                          } finally {
                            setEditingBundleNotesLoading(false);
                          }
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-red-500/70 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-500/20"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              "Delete this bundle? This does not delete the underlying notes."
                            )
                          ) {
                            return;
                          }
                          try {
                            const { data } = await supabase.auth.getSession();
                            const token = data.session?.access_token;
                            if (!token) {
                              setNotesBundlesError("Not signed in.");
                              return;
                            }
                            const res = await fetch(
                              `${API_BASE}/admin/notes/bundles/delete`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ bundle_id: b.id }),
                              }
                            );
                            const json = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              const detail =
                                (Array.isArray(json.detail)
                                  ? json.detail
                                      .map((d: { msg?: string }) => d.msg)
                                      .join(" ")
                                  : json.detail) || res.statusText;
                              throw new Error(detail);
                            }
                            setNotesBundles((prev) =>
                              prev.filter((x) => x.id !== b.id)
                            );
                            if (editingBundle?.id === b.id) {
                              setEditingBundle(null);
                            }
                          } catch (err) {
                            setNotesBundlesError(
                              err instanceof Error
                                ? err.message
                                : "Failed to delete bundle."
                            );
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingBundle && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-50">
                    Edit bundle
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Update the exam label, title, description or price for this bundle.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                  onClick={() => setEditingBundle(null)}
                >
                  Close
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-slate-200">
                  <span className="font-semibold uppercase tracking-wide">
                    Exam label
                  </span>
                  <input
                    type="text"
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={editingBundle.display_exam_label || ""}
                    onChange={(e) =>
                      setEditingBundle((prev) =>
                        prev ? { ...prev, display_exam_label: e.target.value } : prev
                      )
                    }
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs text-slate-200">
                  <span className="font-semibold uppercase tracking-wide">
                    Actual Price (₹)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={editingBundle.actual_price != null ? editingBundle.actual_price : ""}
                    placeholder="Optional"
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setEditingBundle((prev) =>
                        prev
                          ? { ...prev, actual_price: v === "" ? null : Number(v) || null }
                          : prev
                      );
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-200">
                  <span className="font-semibold uppercase tracking-wide">
                    Discounted Price (₹)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={editingBundle.price != null ? editingBundle.price : 0}
                    onChange={(e) =>
                      setEditingBundle((prev) =>
                        prev
                          ? { ...prev, price: Number(e.target.value) || 0 }
                          : prev
                      )
                    }
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs text-slate-200">
                <span className="font-semibold uppercase tracking-wide">
                  Title
                </span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={editingBundle.title || ""}
                  onChange={(e) =>
                    setEditingBundle((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev
                    )
                  }
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-slate-200">
                <span className="font-semibold uppercase tracking-wide">
                  Description
                </span>
                <textarea
                  className="min-h-[60px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={editingBundle.description || ""}
                  onChange={(e) =>
                    setEditingBundle((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                />
              </label>

              {/* Notes inside this bundle */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Notes in this bundle
                </p>
                <p className="text-[11px] text-slate-500">
                  Tick notes to keep them in this bundle. Untick to remove.
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                  {editingBundleNotesLoading ? (
                    <p className="text-[11px] text-slate-400">Loading bundle notes…</p>
                  ) : editingBundleNotes.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No notes linked yet. Create a new bundle above to attach notes.
                    </p>
                  ) : (
                    editingBundleNotes.map((n) => {
                      const checked = editingBundleNoteIds.includes(n.id);
                      const meta: string[] = [];
                      if (n.chemistry_type) meta.push(n.chemistry_type);
                      if (n.subject) meta.push(n.subject);
                      return (
                        <label
                          key={n.id}
                          className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer text-[11px]"
                        >
                          <input
                            type="checkbox"
                            className="accent-cyan-500"
                            checked={checked}
                            onChange={() =>
                              setEditingBundleNoteIds((prev) =>
                                checked
                                  ? prev.filter((id) => id !== n.id)
                                  : [...prev, n.id]
                              )
                            }
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="whitespace-normal break-words text-slate-100">
                              {n.title}
                            </span>
                            {meta.length > 0 && (
                              <span className="text-[10px] text-slate-500 whitespace-normal break-words">
                                {meta.join(" · ")}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add more notes from current filters */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Add more notes (from filters above)
                </p>
                <p className="text-[11px] text-slate-500">
                  Use the filters at the top of the page to load notes, then tick any additional notes you want to add to this bundle.
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                  {bundleNotesLoading ? (
                    <p className="text-[11px] text-slate-400">Loading notes…</p>
                  ) : bundleNotes.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No notes found for the current filter.
                    </p>
                  ) : (
                    bundleNotes
                      .filter((n) => !editingBundleNoteIds.includes(n.id))
                      .map((n) => {
                        const meta: string[] = [];
                        if (n.chemistry_type) meta.push(n.chemistry_type);
                        if (n.subject) meta.push(n.subject);
                        return (
                          <label
                            key={n.id}
                            className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer text-[11px]"
                          >
                            <input
                              type="checkbox"
                              className="accent-emerald-500"
                              checked={editingBundleNoteIds.includes(n.id)}
                              onChange={() => {
                                setEditingBundleNoteIds((prev) =>
                                  prev.includes(n.id) ? prev : [...prev, n.id]
                                );
                                setEditingBundleNotes((prev) =>
                                  prev.some((p) => p.id === n.id)
                                    ? prev
                                    : [...prev, n]
                                );
                              }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="whitespace-normal break-words text-slate-100">
                                {n.title}
                              </span>
                              {meta.length > 0 && (
                                <span className="text-[10px] text-slate-500 whitespace-normal break-words">
                                  {meta.join(" · ")}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-500">
                  Bundle ID: {editingBundle.id}
                </p>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-emerald-500/80 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25"
                  onClick={async () => {
                    if (!editingBundle) return;
                    try {
                      const { data } = await supabase.auth.getSession();
                      const token = data.session?.access_token;
                      if (!token) {
                        setNotesBundlesError("Not signed in.");
                        return;
                      }
                      const payload = {
                        bundle_id: editingBundle.id,
                        display_exam_label: editingBundle.display_exam_label ?? "",
                        title: editingBundle.title ?? "",
                        description: editingBundle.description ?? "",
                        price:
                          typeof editingBundle.price === "number"
                            ? editingBundle.price
                            : 0,
                        actual_price:
                          typeof editingBundle.actual_price === "number"
                            ? editingBundle.actual_price
                            : null,
                      };
                      const res = await fetch(
                        `${API_BASE}/admin/notes/bundles/update`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(payload),
                        }
                      );
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        const detail =
                          (Array.isArray(json.detail)
                            ? json.detail
                                .map((d: { msg?: string }) => d.msg)
                                .join(" ")
                            : json.detail) || res.statusText;
                        throw new Error(detail);
                      }
                      setNotesBundles((prev) =>
                        prev.map((b) => (b.id === editingBundle.id ? editingBundle : b))
                      );

                      // Also persist updated note membership
                      try {
                        const resNotes = await fetch(
                          `${API_BASE}/admin/notes/bundles/notes/update`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              bundle_id: editingBundle.id,
                              note_ids: editingBundleNoteIds,
                            }),
                          }
                        );
                        const jsonNotes = await resNotes.json().catch(() => ({}));
                        if (!resNotes.ok) {
                          const detailNotes =
                            (Array.isArray(jsonNotes.detail)
                              ? jsonNotes.detail
                                  .map((d: { msg?: string }) => d.msg)
                                  .join(" ")
                              : jsonNotes.detail) || resNotes.statusText;
                          throw new Error(detailNotes);
                        }
                      } catch (err) {
                        setNotesBundlesError(
                          err instanceof Error
                            ? err.message
                            : "Bundle saved, but failed to update its notes."
                        );
                      }

                      setEditingBundle(null);
                    } catch (err) {
                      setNotesBundlesError(
                        err instanceof Error
                          ? err.message
                          : "Failed to update bundle."
                      );
                    }
                  }}
                >
                  Save changes
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      )}
      </div>
    </div>
  );
}