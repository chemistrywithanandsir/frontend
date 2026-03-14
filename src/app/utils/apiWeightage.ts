const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export type WeightageByYear = Record<string, Record<string, number>>;

export type ShiftEntryApi = {
  id: string;
  year: number;
  month: string;
  day_label: string;
  shift: string;
  questions: number;
  physical?: number;
  inorganic?: number;
  organic?: number;
  chapterwise_note?: string | null;
  chapter_counts?: Record<string, number> | null;
};

export async function fetchExamWeightagePublic(examId: string): Promise<{
  byYear: WeightageByYear;
  shifts: ShiftEntryApi[];
}> {
  const res = await fetch(`${API_BASE}/public/weightage/${examId}`);
  if (!res.ok) {
    return { byYear: {}, shifts: [] };
  }
  const json = (await res.json()) as {
    byYear?: Record<string, Record<string, number>>;
    shifts?: ShiftEntryApi[];
  };
  return {
    byYear: json.byYear || {},
    shifts: json.shifts || [],
  };
}

export async function saveExamWeightageAdmin(
  examId: string,
  year: string,
  chapterCounts: Record<string, number>,
  token: string
): Promise<void> {
  await fetch(`${API_BASE}/admin/weightage/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      exam_code: examId,
      year: Number(year),
      chapter_counts: chapterCounts,
    }),
  });
}

export async function saveJeeMainShiftAdmin(
  payload: {
    year: string;
    month: string;
    dayLabel: string;
    shift: string;
    questions: number;
    physical: number;
    inorganic: number;
    organic: number;
    chapterCounts?: Record<string, number>;
    chapterwiseNote?: string;
  },
  token: string
): Promise<void> {
  await fetch(`${API_BASE}/admin/weightage/jee-main/shift/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      year: Number(payload.year),
      month: payload.month,
      day_label: payload.dayLabel,
      shift: payload.shift,
      questions: payload.questions,
      physical: payload.physical,
      inorganic: payload.inorganic,
      organic: payload.organic,
      chapter_counts: payload.chapterCounts || {},
      chapterwise_note: payload.chapterwiseNote || null,
    }),
  });
}

