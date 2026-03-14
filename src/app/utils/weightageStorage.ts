// localStorage for admin-edited weightage (questions per chapter per year)

export type WeightageByYear = Record<string, Record<string, number>>;
// e.g. { "2025": { "neet-p-1": 3, "neet-p-2": 2 }, "2024": { ... } }

const STORAGE_PREFIX = "weightage_";

export function getWeightage(examId: string): WeightageByYear {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + examId);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function setWeightage(examId: string, data: WeightageByYear): void {
  localStorage.setItem(STORAGE_PREFIX + examId, JSON.stringify(data));
}

export function getYearsWithData(examId: string): string[] {
  const data = getWeightage(examId);
  const years = Object.keys(data).filter((y) => {
    const chapterData = data[y];
    return chapterData && Object.keys(chapterData).length > 0;
  });
  return years.sort((a, b) => Number(b) - Number(a));
}
