const DEFAULT_TTL_MS = 60_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();
let cacheEpoch = 0;

export function cachedClientRequest<T>(
  key: string,
  load: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  if (typeof window === "undefined") return load();

  const cached = responseCache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value);
  }
  if (cached) responseCache.delete(key);

  const pending = pendingRequests.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const requestEpoch = cacheEpoch;
  let request: Promise<T>;
  request = load()
    .then((value) => {
      if (requestEpoch === cacheEpoch) {
        responseCache.set(key, {
          value,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return value;
    })
    .finally(() => {
      if (pendingRequests.get(key) === request) pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
}

export function clearClientResponseCache(): void {
  cacheEpoch += 1;
  responseCache.clear();
  pendingRequests.clear();
}
