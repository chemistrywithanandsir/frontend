import type { Chapter, NoteBundle } from "../../data/notesData";
import { readClientCache, withClientCache } from "../utils/clientCache";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const NOTES_CACHE_TTL_MS = 1000 * 60 * 10;
const NOTES_CACHE_PREFIX = "notes_api_v1:";

function toBundle(raw: any): NoteBundle {
  const chapters: Chapter[] = Array.isArray(raw?.chapters)
    ? raw.chapters.map((ch: any) => ({
        id: String(ch?.id ?? ""),
        title: String(ch?.title ?? ""),
        chemistryType: (ch?.chemistryType ?? "Physical") as Chapter["chemistryType"],
        pageCount: Number(ch?.pageCount ?? 0),
        pdfUrl: ch?.pdfUrl ?? undefined,
        thumbnailUrl: ch?.thumbnailUrl ?? undefined,
      }))
    : [];

  return {
    id: String(raw?.id ?? ""),
    title: String(raw?.title ?? ""),
    examCode: String(raw?.examCode ?? ""),
    description: String(raw?.description ?? ""),
    priceInRupees: Number(raw?.priceInRupees ?? 0),
    originalPriceInRupees:
      raw?.actualPriceInRupees != null ? Number(raw.actualPriceInRupees) : undefined,
    thumbnailUrl: raw?.thumbnailUrl ?? undefined,
    chapters,
  };
}

export function getCachedPublicBundles(examCode?: string): NoteBundle[] | null {
  const normalized = (examCode ?? "").trim().toLowerCase();
  const key = `${NOTES_CACHE_PREFIX}bundles:${normalized || "all"}`;
  return readClientCache<NoteBundle[]>(key, NOTES_CACHE_TTL_MS);
}

export function getCachedPublicBundleDetail(bundleId: string): NoteBundle | null {
  const id = (bundleId || "").trim();
  if (!id) return null;
  const key = `${NOTES_CACHE_PREFIX}bundle:${id}`;
  return readClientCache<NoteBundle | null>(key, NOTES_CACHE_TTL_MS);
}

export async function fetchPublicBundles(
  options?: { examCode?: string; forceRefresh?: boolean }
): Promise<NoteBundle[]> {
  const examCode = (options?.examCode ?? "").trim().toLowerCase();
  const key = `${NOTES_CACHE_PREFIX}bundles:${examCode || "all"}`;

  return withClientCache<NoteBundle[]>({
    key,
    ttlMs: NOTES_CACHE_TTL_MS,
    forceRefresh: options?.forceRefresh,
    loader: async () => {
      const url = examCode
        ? `${API_BASE}/notes/bundles?exam_code=${encodeURIComponent(examCode)}`
        : `${API_BASE}/notes/bundles`;
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = Array.isArray((json as any).detail)
          ? (json as any).detail.map((d: { msg?: string }) => d.msg).join(" ")
          : (json as any).detail;
        throw new Error(detail || res.statusText || "Failed to load bundles.");
      }
      const rows = Array.isArray((json as any).bundles) ? (json as any).bundles : [];
      return rows.map(toBundle);
    },
  });
}

export async function fetchPublicBundleDetail(
  bundleId: string,
  options?: { forceRefresh?: boolean }
): Promise<NoteBundle | null> {
  const id = (bundleId || "").trim();
  if (!id) return null;

  const key = `${NOTES_CACHE_PREFIX}bundle:${id}`;
  return withClientCache<NoteBundle | null>({
    key,
    ttlMs: NOTES_CACHE_TTL_MS,
    forceRefresh: options?.forceRefresh,
    loader: async () => {
      const res = await fetch(`${API_BASE}/notes/bundles/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const json = await res.json().catch(() => ({}));
      const raw = (json as any).bundle;
      if (!raw) return null;
      return toBundle(raw);
    },
  });
}
