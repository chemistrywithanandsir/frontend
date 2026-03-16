type CacheEntry<T> = {
  savedAt: number;
  value: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getSessionStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function readClientCache<T>(key: string, ttlMs: number): T | null {
  const now = Date.now();
  const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (mem && now - mem.savedAt <= ttlMs) {
    return mem.value;
  }

  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry<T>>;
    if (typeof parsed.savedAt !== "number") return null;
    if (now - parsed.savedAt > ttlMs) return null;
    if (!("value" in parsed)) return null;
    const entry: CacheEntry<T> = {
      savedAt: parsed.savedAt,
      value: parsed.value as T,
    };
    memoryCache.set(key, entry as CacheEntry<unknown>);
    return entry.value;
  } catch {
    return null;
  }
}

export function writeClientCache<T>(key: string, value: T): void {
  const entry: CacheEntry<T> = { savedAt: Date.now(), value };
  memoryCache.set(key, entry as CacheEntry<unknown>);

  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore storage quota/serialization errors
  }
}

export function removeClientCache(key: string): void {
  memoryCache.delete(key);
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

export function removeClientCacheByPrefix(prefix: string): void {
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  const storage = getSessionStorage();
  if (!storage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => storage.removeItem(key));
  } catch {
    // ignore
  }
}

export async function withClientCache<T>(args: {
  key: string;
  ttlMs: number;
  loader: () => Promise<T>;
  forceRefresh?: boolean;
}): Promise<T> {
  const { key, ttlMs, loader, forceRefresh } = args;

  if (!forceRefresh) {
    const cached = readClientCache<T>(key, ttlMs);
    if (cached !== null) {
      return cached;
    }
  }

  const fresh = await loader();
  writeClientCache(key, fresh);
  return fresh;
}
