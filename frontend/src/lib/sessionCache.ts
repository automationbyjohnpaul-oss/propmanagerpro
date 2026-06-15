const sessionCache = new Map<string, any>();

export function getCache(key: string) {
  return sessionCache.get(key);
}

export function setCache(key: string, value: any) {
  sessionCache.set(key, value);
}

export function clearCache() {
  sessionCache.clear();
}
