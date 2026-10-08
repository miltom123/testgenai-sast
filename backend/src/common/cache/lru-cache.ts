// ==============================================================================
// Common: High-Performance In-Memory LRU Cache (Mejora 65)
// Caché en memoria con desalojo Least-Recently-Used y caducidad TTL.
// ==============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LruCache<T> {
  private readonly capacity: number;
  private readonly defaultTtlMs: number;
  private readonly cache: Map<string, CacheEntry<T>>;

  constructor(capacity = 500, defaultTtlSeconds = 300) {
    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    this.cache = new Map();
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Mover al final para marcar como recientemente usado (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  public set(key: string, value: T, ttlSeconds?: number): void {
    const ttlMs = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtlMs;

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Desalojar el elemento más antiguo (primer elemento del iterador)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

// Instancia global para plantillas y métricas frecuentes
export const appLruCache = new LruCache<unknown>(1000, 600);
