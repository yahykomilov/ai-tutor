/** Простой in-memory token-bucket по ключу (IP). Защита от флуда/абьюза. */
interface Bucket {
  tokens: number;
  updated: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  constructor(
    private capacity = 20,
    private refillPerSec = 0.5, // ~30 запросов/мин установившимся темпом
  ) {}

  /** true — можно, false — превышен лимит. */
  take(key: string, now = Date.now()): boolean {
    const b = this.buckets.get(key) ?? { tokens: this.capacity, updated: now };
    const elapsed = (now - b.updated) / 1000;
    b.tokens = Math.min(this.capacity, b.tokens + elapsed * this.refillPerSec);
    b.updated = now;
    if (b.tokens < 1) {
      this.buckets.set(key, b);
      return false;
    }
    b.tokens -= 1;
    this.buckets.set(key, b);
    return true;
  }
}
