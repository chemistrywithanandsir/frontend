import { supabase } from "../../lib/supabaseClient";

function todayDateString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function logQuestionAttempt(params: {
  userId: string;
  questionId: string;
  source: string;
  chosenIndex: number | null;
  correctIndex: number | null;
}): Promise<void> {
  const { userId, questionId, source, chosenIndex, correctIndex } = params;

  const isCorrect =
    chosenIndex == null || correctIndex == null
      ? null
      : chosenIndex === correctIndex;

  const { error } = await supabase.from("user_question_attempts").insert({
    user_id: userId,
    question_id: questionId,
    source,
    chosen_index: chosenIndex,
    correct_index: correctIndex,
    is_correct: isCorrect,
  });

  if (error) {
    console.warn("logQuestionAttempt insert error", error);
  }

  // Update daily stats row
  const day = todayDateString();
  const incAttempt = 1;
  const incCorrect =
    typeof isCorrect === "boolean" && isCorrect ? 1 : 0;

  const { data, error: fetchErr } = await supabase
    .from("user_daily_stats")
    .select(
      "questions_attempted, questions_correct, personal_tests_completed, minutes_spent"
    )
    .eq("user_id", userId)
    .eq("day", day)
    .limit(1);

  if (fetchErr) {
    console.warn("daily stats fetch failed", fetchErr);
    return;
  }

  const existing = data?.[0];

  const payload = existing
    ? {
        user_id: userId,
        day,
        questions_attempted:
          (existing.questions_attempted as number) + incAttempt,
        questions_correct:
          (existing.questions_correct as number) + incCorrect,
        personal_tests_completed:
          (existing.personal_tests_completed as number) ?? 0,
        minutes_spent: (existing.minutes_spent as number) ?? 0,
      }
    : {
        user_id: userId,
        day,
        questions_attempted: incAttempt,
        questions_correct: incCorrect,
        personal_tests_completed: 0,
        minutes_spent: 0,
      };

  const { error: upErr } = await supabase
    .from("user_daily_stats")
    .upsert(payload, { onConflict: "user_id,day" });

  if (upErr) {
    console.warn("daily stats upsert failed", upErr);
  }
}

export async function incrementPersonalTestsCompleted(params: {
  userId: string;
  timeMinutes: number;
}): Promise<void> {
  const day = todayDateString();
  const minutes = params.timeMinutes ?? 0;

  const { data, error } = await supabase
    .from("user_daily_stats")
    .select(
      "questions_attempted, questions_correct, personal_tests_completed, minutes_spent"
    )
    .eq("user_id", params.userId)
    .eq("day", day)
    .limit(1);

  if (error) {
    console.warn("daily stats fetch failed", error);
    return;
  }

  const existing = data?.[0];

  const payload = existing
    ? {
        user_id: params.userId,
        day,
        questions_attempted:
          (existing.questions_attempted as number) ?? 0,
        questions_correct:
          (existing.questions_correct as number) ?? 0,
        personal_tests_completed:
          (existing.personal_tests_completed as number) + 1,
        minutes_spent:
          (existing.minutes_spent as number) + minutes,
      }
    : {
        user_id: params.userId,
        day,
        questions_attempted: 0,
        questions_correct: 0,
        personal_tests_completed: 1,
        minutes_spent: minutes,
      };

  const { error: upErr } = await supabase
    .from("user_daily_stats")
    .upsert(payload, { onConflict: "user_id,day" });

  if (upErr) {
    console.warn("daily stats upsert failed", upErr);
  }
}

export async function fetchTodaySolvedCount(userId: string): Promise<number> {
  const day = todayDateString();
  const { data, error } = await supabase
    .from("user_daily_stats")
    .select("questions_correct")
    .eq("user_id", userId)
    .eq("day", day)
    .limit(1);

  if (error) {
    console.warn("fetchTodaySolvedCount error", error);
    return 0;
  }

  if (!data || data.length === 0) return 0;
  const row = data[0];
  return Number(row.questions_correct ?? 0);
}

export type WeeklyActivityPoint = {
  week: string;
  questions: number;
  correct: number;
};

export async function fetchWeeklyActivity(
  userId: string
): Promise<WeeklyActivityPoint[]> {
  // look back ~6 weeks (42 days)
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - 42);
  const pastStr = past.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("user_daily_stats")
    .select("day, questions_attempted, questions_correct")
    .eq("user_id", userId)
    .gte("day", pastStr)
    .order("day", { ascending: true });

  if (error) {
    console.warn("fetchWeeklyActivity error", error);
    return [];
  }

  // Bucket by ISO week (Monday-based) for last 6 weeks
  const points: WeeklyActivityPoint[] = [];
  const weeksMap = new Map<string, { questions: number; correct: number }>();

  (data ?? []).forEach((row) => {
    const dayStr = row.day as string;
    const d = new Date(dayStr);
    const tmp = new Date(d);
    const dayOffset = (tmp.getDay() + 6) % 7; // 0=Mon
    tmp.setDate(tmp.getDate() - dayOffset);
    const key = tmp.toISOString().slice(0, 10);

    const entry = weeksMap.get(key) ?? { questions: 0, correct: 0 };
    entry.questions += Number(row.questions_attempted ?? 0);
    entry.correct += Number(row.questions_correct ?? 0);
    weeksMap.set(key, entry);
  });

  const sortedKeys = Array.from(weeksMap.keys()).sort();
  const lastSix = sortedKeys.slice(-6);

  lastSix.forEach((key, idx) => {
    const entry = weeksMap.get(key)!;
    const d = new Date(key);
    const label =
      idx === lastSix.length - 1
        ? "This week"
        : `${d.getDate()}/${d.getMonth() + 1}`;
    points.push({
      week: label,
      questions: entry.questions,
      correct: entry.correct,
    });
  });

  return points;
}

