import type { OrderbookLevel, ProcessedLevel } from "./types";

export function defaultFormatPrice(price: number): string {
  return price.toFixed(2);
}

export function defaultFormatSize(size: number): string {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
  return size.toLocaleString();
}

/**
 * Sanitize raw levels: filter invalid entries, merge duplicate prices.
 * This runs before any processing so the component never sees bad data.
 */
export function sanitizeLevels(levels: OrderbookLevel[]): OrderbookLevel[] {
  const merged = new Map<number, number>();

  for (const { price, size } of levels) {
    if (!isFinite(price) || !isFinite(size) || price <= 0 || size <= 0) continue;
    // Round to 8 decimal places to collapse floating point dust
    // (e.g., 0.30000000000000004 → 0.3)
    const key = Math.round(price * 1e8) / 1e8;
    merged.set(key, (merged.get(key) ?? 0) + size);
  }

  return Array.from(merged.entries()).map(([price, size]) => ({ price, size }));
}

export function aggregateLevels(
  levels: OrderbookLevel[],
  grouping: number | undefined
): OrderbookLevel[] {
  if (!grouping || grouping <= 0) return levels;

  const grouped = new Map<number, number>();

  for (const { price, size } of levels) {
    const key = Math.round(price / grouping) * grouping;
    grouped.set(key, (grouped.get(key) ?? 0) + size);
  }

  return Array.from(grouped.entries())
    .map(([price, size]) => ({ price, size }))
    .sort((a, b) => b.price - a.price);
}

export function processLevels(
  levels: OrderbookLevel[],
  side: "bid" | "ask",
  maxDepth: number
): ProcessedLevel[] {
  const sliced = levels.slice(0, maxDepth);
  let cumulative = 0;
  const withTotals = sliced.map((level) => {
    cumulative += level.size;
    return { ...level, total: cumulative, side, depth: 0 };
  });

  const maxTotal = cumulative;
  for (const level of withTotals) {
    level.depth = maxTotal > 0 ? level.total / maxTotal : 0;
  }

  return withTotals;
}

/**
 * Smooths a maxTotal value over time to prevent depth bar jitter.
 * Approaches the target with exponential easing — rises fast, falls slow.
 */
export function createMaxTotalSmoother(alpha = 0.3) {
  let smoothed = 0;

  return function smooth(raw: number): number {
    if (smoothed === 0 || raw === 0) {
      smoothed = raw;
      return raw;
    }
    // If scale changed by more than 10x, reset — we switched markets
    const ratio = raw / smoothed;
    if (ratio > 10 || ratio < 0.1) {
      smoothed = raw;
      return raw;
    }
    // Rise fast (follow large orders quickly), fall slow (don't collapse when they leave)
    const a = raw > smoothed ? 0.5 : alpha;
    smoothed = smoothed + a * (raw - smoothed);
    return smoothed;
  };
}
