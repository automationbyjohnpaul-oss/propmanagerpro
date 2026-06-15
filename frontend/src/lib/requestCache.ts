const cache = new Map<string, { data: any; time: number }>();
const inFlight = new Map<string, Promise<any>>();
const TTL = 5 * 60 * 1000;

export async function cachedRequest<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();

  const existing = cache.get(key);
  if (existing && now - existing.time < TTL) {
    return existing.data;
  }

  if (inFlight.has(key)) {
    return inFlight.get(key)!;
  }

  const promise = fn().then((data) => {
    cache.set(key, { data, time: Date.now() });
    inFlight.delete(key);
    return data;
  });

  inFlight.set(key, promise);

  return promise;
}

export function invalidateCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.includes(prefix)) cache.delete(key);
  }
}
