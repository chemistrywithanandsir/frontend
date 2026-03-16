/**
 * PYQ data from Supabase: exams, chapters, papers, questions.
 * Maps DB shape to frontend PyqQuestion / ExamBank.
 */
import { supabase } from "../../lib/supabaseClient";

export type ChemistryType = "Organic" | "Inorganic" | "Physical";

export type PyqQuestion = {
  id: string;
  year: number;
  shift: string;
  chapter: string;
  stem: string;
  questionImageUrls?: string[];
  options: string[];
  optionImageUrls?: string[];
  correctIndex: number;
  solution: string;
  chemistryType: ChemistryType;
  attemptStatus?: "unattempted" | "correct" | "wrong";
  answerType?: "MCQ" | "NUMERIC" | "MULTI";
  correctAnswer?: string;
  solutionImageUrls?: string[];
};

export type ExamInfo = { id: string; name: string; code: string };

export type ChapterInfo = { id: string; name: string; chemistryType: ChemistryType; code: string };

export type ExamBank = {
  exam: ExamInfo;
  questions: PyqQuestion[];
  chapters: ChapterInfo[];
};

const EXAM_BANK_CACHE_PREFIX = "pyq_exam_bank_v1:";
const EXAM_BANK_CACHE_TTL_MS = 1000 * 60 * 10;

type ExamBankCacheEntry = {
  savedAt: number;
  data: ExamBank;
};

const examBankMemoryCache = new Map<string, ExamBankCacheEntry>();

const EXAM_CODES: Record<string, ExamInfo> = {
  neet: { id: "neet", name: "NEET", code: "NEET" },
  "jee-main": { id: "jee-main", name: "JEE Main", code: "JEE MAIN" },
  "jee-advanced": { id: "jee-advanced", name: "JEE Advanced", code: "JEE ADVANCED" },
  cbse: { id: "cbse", name: "CBSE", code: "CBSE" },
};

function readExamBankCache(examCode: string): ExamBank | null {
  const now = Date.now();
  const mem = examBankMemoryCache.get(examCode);
  if (mem && now - mem.savedAt <= EXAM_BANK_CACHE_TTL_MS) {
    return mem.data;
  }

  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${EXAM_BANK_CACHE_PREFIX}${examCode}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ExamBankCacheEntry>;
    if (typeof parsed.savedAt !== "number" || !parsed.data) return null;
    if (now - parsed.savedAt > EXAM_BANK_CACHE_TTL_MS) return null;
    const entry: ExamBankCacheEntry = { savedAt: parsed.savedAt, data: parsed.data as ExamBank };
    examBankMemoryCache.set(examCode, entry);
    return entry.data;
  } catch {
    return null;
  }
}

function writeExamBankCache(examCode: string, data: ExamBank) {
  const entry: ExamBankCacheEntry = { savedAt: Date.now(), data };
  examBankMemoryCache.set(examCode, entry);

  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `${EXAM_BANK_CACHE_PREFIX}${examCode}`,
      JSON.stringify(entry)
    );
  } catch {
    // ignore cache write failures
  }
}

export function getCachedExamBank(examCode: string): ExamBank | null {
  return readExamBankCache(examCode);
}

/** Collapse vertical PDF line-breaks so formulas don't render as stacked fragments. */
function normalizeStemForDisplay(stem: string): string {
  if (!stem || !stem.trim()) return stem;
  return stem
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapRowToPyqQuestion(
  row: {
    id: string;
    question_text: string;
    question_image_urls?: string[] | null;
    options: string[] | null;
    option_image_urls?: string[] | null;
    correct_index: number | null;
    correct_answer: string | null;
    solution_text: string | null;
    solution_image_urls?: string[] | null;
    chemistry_type: string | null;
    answer_type?: string | null;
    paper?: { year: number; shift: string | null } | null;
    chapter?: { name: string } | null;
  }
): PyqQuestion {
  const paper = row.paper ?? {};
  const year = typeof paper.year === "number" ? paper.year : 0;
  const shift = paper.shift ?? "";
  const chapterName = row.chapter?.name ?? "";
  const rawOptions = Array.isArray(row.options) ? row.options : [];
  const options = rawOptions.length >= 4
    ? rawOptions.slice(0, 4)
    : [...rawOptions, ...Array(4 - rawOptions.length).fill("")];
  const chemistryType = (row.chemistry_type as ChemistryType) ?? "Physical";
  const solution = row.solution_text ?? "";
  const questionImageUrls = Array.isArray(row.question_image_urls) ? row.question_image_urls : [];
  const optionImageUrls = Array.isArray(row.option_image_urls) ? row.option_image_urls : [];
  const solutionImageUrls = Array.isArray(row.solution_image_urls) ? row.solution_image_urls : [];

  return {
    id: row.id,
    year,
    shift,
    chapter: chapterName,
    stem: normalizeStemForDisplay(row.question_text ?? ""),
    questionImageUrls: questionImageUrls.length ? questionImageUrls : undefined,
    options,
    optionImageUrls: optionImageUrls.length ? optionImageUrls : undefined,
    correctIndex: row.correct_index != null ? Math.max(0, Math.min(3, row.correct_index)) : 0,
    solution,
    chemistryType,
    solutionImageUrls: solutionImageUrls.length ? solutionImageUrls : undefined,
    answerType: (row.answer_type as PyqQuestion["answerType"]) ?? "MCQ",
    correctAnswer: row.correct_answer ?? undefined,
  };
}

/** Get exam UUID from Supabase by code (neet, jee-main, jee-advanced). */
export async function getExamIdByCode(code: string): Promise<string | null> {
  // DBs vary: `exams.code` might be stored as "jee-main" or "JEE MAIN" (or similar).
  // Fetch once and match by a normalized code to avoid brittle equals comparisons.
  const { data, error } = await supabase.from("exams").select("id, code");
  if (error) {
    throw new Error(`Failed to load exams: ${error.message}`);
  }
  const rows = (data ?? []) as Array<{ id: string; code: string }>;

  const candidates = [code, EXAM_CODES[code]?.code].filter(Boolean) as string[];
  const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const want = new Set(candidates.map(norm));

  const match = rows.find((r) => want.has(norm(r.code)));
  return match?.id ?? null;
}

/** Get chapters for an exam (by exam UUID). */
export async function getChaptersForExam(examId: string): Promise<ChapterInfo[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select("id, name, chemistry_type, code")
    .eq("exam_id", examId)
    .order("sequence", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    chemistryType: (r.chemistry_type as ChemistryType) ?? "Physical",
    code: r.code ?? "",
  }));
}

/** Load full exam bank: questions for this exam, with paper + chapter. */
export async function getExamBank(
  examCode: string,
  options?: { forceRefresh?: boolean }
): Promise<ExamBank | null> {
  const forceRefresh = options?.forceRefresh === true;

  if (!forceRefresh) {
    const cached = readExamBankCache(examCode);
    if (cached) return cached;
  }

  const examInfo = EXAM_CODES[examCode];
  if (!examInfo) return null;

  const examUuid = await getExamIdByCode(examCode);
  if (!examUuid) return null;

  const [chaptersRes, papersRes] = await Promise.all([
    supabase.from("chapters").select("id, name, chemistry_type, code").eq("exam_id", examUuid).order("sequence", { ascending: true }),
    supabase.from("papers").select("id").eq("exam_id", examUuid),
  ]);

  const chapters: ChapterInfo[] = (chaptersRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    chemistryType: (r.chemistry_type as ChemistryType) ?? "Physical",
    code: r.code ?? "",
  }));

  const paperIds = (papersRes.data ?? []).map((p) => p.id).filter(Boolean);
  if (paperIds.length === 0) {
    const emptyBank = { exam: examInfo, questions: [], chapters };
    writeExamBankCache(examCode, emptyBank);
    return emptyBank;
  }

  const { data: questionRows, error } = await supabase
    .from("questions")
    .select(`
      id, question_text, question_image_urls, options, option_image_urls, correct_index, correct_answer, solution_text, solution_image_urls, chemistry_type, answer_type,
      paper:papers(year, shift),
      chapter:chapters(name)
    `)
    .in("paper_id", paperIds)
    .order("question_number", { ascending: true });

  if (error) {
    return { exam: examInfo, questions: [], chapters };
  }

  const questions: PyqQuestion[] = (questionRows ?? []).map((r) => mapRowToPyqQuestion(r as Parameters<typeof mapRowToPyqQuestion>[0]));
  const bank = { exam: examInfo, questions, chapters };
  writeExamBankCache(examCode, bank);
  return bank;
}

/** Get unique chapter names for selected exams (for personal test chapter list). */
export async function getChaptersFromExams(examCodes: string[]): Promise<ChapterInfo[]> {
  const all: ChapterInfo[] = [];
  for (const code of examCodes) {
    const examUuid = await getExamIdByCode(code);
    if (!examUuid) continue;
    const chapters = await getChaptersForExam(examUuid);
    for (const ch of chapters) {
      if (!all.some((c) => c.name === ch.name && c.chemistryType === ch.chemistryType)) {
        all.push(ch);
      }
    }
  }
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

/** Sample questions from DB for given exam codes and chapter names (for personal test). */
export async function sampleQuestions(
  examCodes: string[],
  chapterNames: string[],
  count: number
): Promise<PyqQuestion[]> {
  const examUuids: string[] = [];
  for (const code of examCodes) {
    const id = await getExamIdByCode(code);
    if (id) examUuids.push(id);
  }
  if (examUuids.length === 0) return [];

  const { data: papers } = await supabase.from("papers").select("id, chapter_id").in("exam_id", examUuids);
  const paperIds = (papers ?? []).map((p) => p.id);
  if (paperIds.length === 0) return [];

  const { data: chapterRows } = await supabase.from("chapters").select("id, name").in("exam_id", examUuids);
  const allChapterIds = (chapterRows ?? []).map((c) => c.id);
  const chapterIds =
    chapterNames.length === 0
      ? allChapterIds
      : (chapterRows ?? [])
          .filter((c) => c.name && chapterNames.some((n) => c.name === n || (typeof c.name === "string" && c.name.toLowerCase().includes(n.toLowerCase()))))
          .map((c) => c.id);

  let query = supabase
    .from("questions")
    .select(`
      id, question_text, question_image_urls, options, option_image_urls, correct_index, correct_answer, solution_text, solution_image_urls, chemistry_type, answer_type,
      paper:papers(year, shift),
      chapter:chapters(name)
    `)
    .in("paper_id", paperIds);

  if (chapterIds.length > 0) {
    query = query.in("chapter_id", chapterIds);
  }

  const { data: rows } = await query.limit(500);

  const questions: PyqQuestion[] = (rows ?? []).map((r) => mapRowToPyqQuestion(r as Parameters<typeof mapRowToPyqQuestion>[0]));
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
