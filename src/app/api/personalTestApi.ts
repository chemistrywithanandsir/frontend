import { supabase } from "../../lib/supabaseClient";
import type { PyqQuestion } from "./pyqApi";

export type StoredPersonalTestResult = {
  id: string;
  examName: string;
  completedAt: string;
  questions: Array<{
    id: string;
    year: number;
    shift: string;
    chapter: string;
    stem: string;
    options: string[];
    correctIndex: number;
    solution: string;
    chemistryType: string;
    solutionImageUrls?: string[];
    answerType?: "MCQ" | "NUMERIC" | "MULTI";
    correctAnswer?: string;
  }>;
  responses: Record<string, number | string>;
  timeMinutes: number;
  elapsedSeconds: number;
  markedForReview: number[];
};

type DbPersonalTestRow = {
  id: string;
  user_id: string;
  exam_name: string;
  time_minutes: number;
  elapsed_seconds: number;
  question_count: number;
  score: number;
  questions_snapshot: unknown;
  responses_snapshot: unknown;
  marked_for_review: number[] | null;
  completed_at: string;
};

function mapRowToStoredResult(row: DbPersonalTestRow): StoredPersonalTestResult {
  const questions = (row.questions_snapshot as StoredPersonalTestResult["questions"]) ?? [];
  const responses =
    (row.responses_snapshot as StoredPersonalTestResult["responses"]) ?? {};

  return {
    id: row.id,
    examName: row.exam_name,
    completedAt: row.completed_at,
    questions,
    responses,
    timeMinutes: row.time_minutes,
    elapsedSeconds: row.elapsed_seconds,
    markedForReview: row.marked_for_review ?? [],
  };
}

export async function listPersonalTestsForUser(
  userId: string
): Promise<StoredPersonalTestResult[]> {
  const { data, error } = await supabase
    .from("user_personal_tests")
    .select(
      "id, user_id, exam_name, time_minutes, elapsed_seconds, question_count, score, questions_snapshot, responses_snapshot, marked_for_review, completed_at"
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("listPersonalTestsForUser error", error);
    return [];
  }

  return (data as DbPersonalTestRow[]).map(mapRowToStoredResult);
}

/** Compare two numeric answers (e.g. "101" and "101.00") as numbers. */
export function numericAnswersEqual(
  a: string | number | undefined,
  b: string | number | undefined
): boolean {
  const sa = String(a ?? "").trim();
  const sb = String(b ?? "").trim();
  if (sa === "" || sb === "") return false;
  const na = parseFloat(sa);
  const nb = parseFloat(sb);
  if (Number.isNaN(na) || Number.isNaN(nb)) return sa === sb;
  return na === nb;
}

export async function savePersonalTestToDb(
  params: {
    userId: string;
    examName: string;
    timeMinutes: number;
    elapsedSeconds: number;
    questions: PyqQuestion[];
    responses: Record<number, number | string>;
    markedForReview: number[];
  }
): Promise<string> {
  const {
    userId,
    examName,
    timeMinutes,
    elapsedSeconds,
    questions,
    responses,
    markedForReview,
  } = params;

  const snapshotQuestions: StoredPersonalTestResult["questions"] = questions.map((q) => ({
    id: q.id,
    year: q.year,
    shift: q.shift,
    chapter: q.chapter,
    stem: q.stem,
    options: q.options,
    correctIndex: q.correctIndex,
    solution: q.solution,
    chemistryType: q.chemistryType,
    solutionImageUrls: q.solutionImageUrls,
    answerType: q.answerType,
    correctAnswer: q.correctAnswer,
  }));

  const snapshotResponses: StoredPersonalTestResult["responses"] = {};
  Object.entries(responses).forEach(([k, v]) => {
    snapshotResponses[k] = v;
  });

  const correctCount = Object.entries(snapshotResponses).filter(([idxStr, ans]) => {
    const q = snapshotQuestions[Number(idxStr)];
    if (!q) return false;
    if (q.answerType === "NUMERIC") {
      return numericAnswersEqual(ans, q.correctAnswer);
    }
    return q.correctIndex === ans;
  }).length;
  const attemptedCount = Object.keys(snapshotResponses).length;
  const score = correctCount * 4 - (attemptedCount - correctCount);

  const completedAt = new Date().toISOString();

  const payload = {
    user_id: userId,
    exam_name: examName,
    time_minutes: timeMinutes,
    elapsed_seconds: elapsedSeconds,
    question_count: snapshotQuestions.length,
    score,
    questions_snapshot: snapshotQuestions,
    responses_snapshot: snapshotResponses,
    marked_for_review: markedForReview,
    completed_at: completedAt,
  };

  const { data, error } = await supabase
    .from("user_personal_tests")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("savePersonalTestToDb error", error);
    throw new Error(error?.message ?? "Failed to save test");
  }

  return data.id as string;
}

export async function getPersonalTestById(
  userId: string,
  testId: string
): Promise<StoredPersonalTestResult | null> {
  const { data, error } = await supabase
    .from("user_personal_tests")
    .select(
      "id, user_id, exam_name, time_minutes, elapsed_seconds, question_count, score, questions_snapshot, responses_snapshot, marked_for_review, completed_at"
    )
    .eq("id", testId)
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("getPersonalTestById error", error);
    return null;
  }

  if (!data || data.length === 0) return null;
  return mapRowToStoredResult(data[0] as DbPersonalTestRow);
}

