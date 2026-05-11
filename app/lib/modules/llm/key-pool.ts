import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('KeyPool');

const COOLDOWN_MS = 60_000;
const MAX_ERRORS_BEFORE_COOLDOWN = 2;

interface KeyHealth {
  errorCount: number;
  lastError: number;
  totalRequests: number;
  totalErrors: number;
}

export class KeyPool {
  private keys: string[];
  private health: Map<string, KeyHealth> = new Map();
  private robin = 0;

  constructor(keys: string[]) {
    this.keys = keys.filter(Boolean);

    if (this.keys.length === 0) {
      throw new Error('KeyPool requires at least one key');
    }

    logger.info(`KeyPool initialized with ${this.keys.length} key(s)`);
  }

  /**
   * Returns the next healthy key using round-robin, skipping keys on cooldown.
   * Falls back to the least-recently-errored key if all are in cooldown.
   */
  getBestKey(): string {
    const now = Date.now();
    const healthy: string[] = [];
    const cooldown: Array<{ key: string; lastError: number }> = [];

    for (const key of this.keys) {
      const h = this.health.get(key);

      if (!h || h.errorCount < MAX_ERRORS_BEFORE_COOLDOWN || now - h.lastError > COOLDOWN_MS) {
        healthy.push(key);
      } else {
        cooldown.push({ key, lastError: h.lastError });
      }
    }

    if (healthy.length > 0) {
      const idx = this.robin % healthy.length;
      this.robin = (this.robin + 1) % healthy.length;

      return healthy[idx];
    }

    logger.warn('All keys are on cooldown — using least-recently-errored key as fallback');
    cooldown.sort((a, b) => a.lastError - b.lastError);

    return cooldown[0].key;
  }

  /**
   * Returns all keys in order so callers can try each one in sequence.
   */
  getAll(): string[] {
    return [...this.keys];
  }

  reportError(key: string, statusCode?: number) {
    const h = this.health.get(key) ?? { errorCount: 0, lastError: 0, totalRequests: 0, totalErrors: 0 };
    h.errorCount += 1;
    h.lastError = Date.now();
    h.totalErrors += 1;
    this.health.set(key, h);
    logger.warn(`Key ...${key.slice(-6)} reported error (status=${statusCode ?? '?'}, consecutive=${h.errorCount})`);
  }

  reportSuccess(key: string) {
    const h = this.health.get(key);

    if (h) {
      h.errorCount = 0;
      h.totalRequests += 1;
      this.health.set(key, h);
    }
  }

  get size() {
    return this.keys.length;
  }
}

/**
 * Parse a semicolon-separated list of API keys from an env string.
 * Trims whitespace and removes empty entries.
 */
export function parseKeyList(raw: string): string[] {
  return raw
    .split(';')
    .map((k) => k.trim())
    .filter(Boolean);
}
