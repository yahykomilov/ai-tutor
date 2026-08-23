/** Простой in-memory token-bucket по ключу (IP). Защита от флуда/абьюза. */
interface Bucket {
  tokens: number;
  updated: number;
}

const ENV_CAPACITY = Number(process.env.RATE_CAPACITY) || 20;
const ENV_REFILL = Number(process.env.RATE_REFILL) || 0.5; // токенов/сек

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private sweeper: ReturnType<typeof setInterval> | null = null;

  constructor(
    private capacity = ENV_CAPACITY,
    private refillPerSec = ENV_REFILL,
    /** Бакеты без активности дольше этого — удаляются (иначе Map растёт вечно). */
    private staleMs = 60 * 60 * 1000,
  ) {
    // Чистка раз в 10 минут: защита от memory-DoS через миллионы поддельных IP.
    if (this.sweeper === null && typeof setInterval === "function") {
      this.sweeper = setInterval(() => this.sweep(), 10 * 60 * 1000);
      if (typeof this.sweeper === "object" && "unref" in this.sweeper) this.sweeper.unref();
    }
  }

  private sweep(now = Date.now()): void {
    for (const [key, b] of this.buckets) {
      if (now - b.updated > this.staleMs) this.buckets.delete(key);
    }
  }

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
