// Storage for Personal Test results (localStorage)

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
  }>;
  responses: Record<string, number>;
  timeMinutes: number;
  elapsedSeconds: number;
  markedForReview: number[];
};

const STORAGE_KEY = "personalTestResults";

function getStorageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY}:${userId}` : `${STORAGE_KEY}:anonymous`;
}

export function getStoredTestResults(userId?: string | null): StoredPersonalTestResult[] {
  try {
    const key = getStorageKey(userId);
    let raw = localStorage.getItem(key);

    // Backward compatibility: migrate legacy, unscoped data (single browser history)
    if (!raw) {
      const legacyRaw = localStorage.getItem(STORAGE_KEY);
      if (!legacyRaw) return [];
      const legacyParsed = JSON.parse(legacyRaw);
      const legacyArray = Array.isArray(legacyParsed) ? legacyParsed : [];
      // Store under user-scoped key for future reads
      localStorage.setItem(key, JSON.stringify(legacyArray));
      return legacyArray;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTestResult(
  result: Omit<StoredPersonalTestResult, "id">,
  userId?: string | null
): string {
  const key = getStorageKey(userId);
  const results = getStoredTestResults(userId);
  const id = `pt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const toSave: StoredPersonalTestResult = { ...result, id };
  results.unshift(toSave);
  localStorage.setItem(key, JSON.stringify(results));
  return id;
}

export function getTestResultById(id: string, userId?: string | null): StoredPersonalTestResult | null {
  const results = getStoredTestResults(userId);
  return results.find((r) => r.id === id) ?? null;
}
