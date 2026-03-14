// Local storage for shift-wise question counts per year (JEE Main only for now)

export type ShiftEntry = {
  id: string;
  year: string;
  month: string; // e.g. "Jan" or "April"
  dayLabel: string; // free-form date text like "31 Jan 2025"
  shift: string; // e.g. "Shift 1" or "Shift 2"
  questions: number;
  physical?: number;
  inorganic?: number;
  organic?: number;
  chapterwiseNote?: string;
  // Optional per-chapter question counts for this shift, keyed by chapter id
  chapterCounts?: Record<string, number>;
};

export type ShiftWeightageByYear = Record<string, ShiftEntry[]>;

const STORAGE_KEY = "weightage_shifts_jee-main";

export function getShiftWeightageForJeeMain(): ShiftWeightageByYear {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);

    // Migration: older structure per year looked like { janShift1, janShift2, ... }.
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      const maybeFirstYear = Object.values(parsed)[0] as any;
      if (
        maybeFirstYear &&
        typeof maybeFirstYear === "object" &&
        ("janShift1" in maybeFirstYear || "aprShift1" in maybeFirstYear)
      ) {
        const migrated: ShiftWeightageByYear = {};
        Object.entries(parsed as Record<string, any>).forEach(([year, v]) => {
          const old = v as any;
          const entries: ShiftEntry[] = [];
          if (old.janShift1 != null) {
            entries.push({
              id: `${year}-jan-1`,
              year,
              month: "Jan",
              dayLabel: old.janShift1Date || "",
              shift: "Shift 1",
              questions: Number(old.janShift1) || 0,
            });
          }
          if (old.janShift2 != null) {
            entries.push({
              id: `${year}-jan-2`,
              year,
              month: "Jan",
              dayLabel: old.janShift2Date || "",
              shift: "Shift 2",
              questions: Number(old.janShift2) || 0,
            });
          }
          if (old.aprShift1 != null) {
            entries.push({
              id: `${year}-apr-1`,
              year,
              month: "April",
              dayLabel: old.aprShift1Date || "",
              shift: "Shift 1",
              questions: Number(old.aprShift1) || 0,
            });
          }
          if (old.aprShift2 != null) {
            entries.push({
              id: `${year}-apr-2`,
              year,
              month: "April",
              dayLabel: old.aprShift2Date || "",
              shift: "Shift 2",
              questions: Number(old.aprShift2) || 0,
            });
          }
          if (entries.length > 0) {
            migrated[year] = entries;
          }
        });
        return migrated;
      }
    }

    return parsed as ShiftWeightageByYear;
  } catch {
    return {};
  }
}

export function setShiftWeightageForJeeMain(data: ShiftWeightageByYear): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

