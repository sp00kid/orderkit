import { describe, it, expect } from "vitest";
import {
  sanitizeLevels,
  aggregateLevels,
  processLevels,
  createMaxTotalSmoother,
  defaultFormatSize,
} from "./utils";

describe("sanitizeLevels", () => {
  it("filters zero-size levels", () => {
    const result = sanitizeLevels([
      { price: 0.65, size: 100 },
      { price: 0.64, size: 0 },
      { price: 0.63, size: 50 },
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((l) => l.price)).toEqual([0.65, 0.63]);
  });

  it("filters negative sizes and prices", () => {
    const result = sanitizeLevels([
      { price: -1, size: 100 },
      { price: 0.65, size: -50 },
      { price: 0.64, size: 100 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(0.64);
  });

  it("filters NaN and Infinity", () => {
    const result = sanitizeLevels([
      { price: NaN, size: 100 },
      { price: 0.65, size: Infinity },
      { price: 0.64, size: 100 },
    ]);
    expect(result).toHaveLength(1);
  });

  it("merges duplicate prices", () => {
    const result = sanitizeLevels([
      { price: 0.65, size: 100 },
      { price: 0.65, size: 200 },
      { price: 0.64, size: 50 },
    ]);
    expect(result).toHaveLength(2);
    const merged = result.find((l) => l.price === 0.65);
    expect(merged?.size).toBe(300);
  });

  it("handles floating point dust", () => {
    const result = sanitizeLevels([
      { price: 0.1 + 0.2, size: 100 }, // 0.30000000000000004
      { price: 0.3, size: 200 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].size).toBe(300);
  });

  it("returns empty array for empty input", () => {
    expect(sanitizeLevels([])).toEqual([]);
  });

  it("returns empty array for all-invalid input", () => {
    const result = sanitizeLevels([
      { price: 0, size: 0 },
      { price: -1, size: -1 },
      { price: NaN, size: NaN },
    ]);
    expect(result).toEqual([]);
  });
});

describe("aggregateLevels", () => {
  it("returns levels unchanged when no grouping", () => {
    const levels = [
      { price: 0.65, size: 100 },
      { price: 0.64, size: 200 },
    ];
    expect(aggregateLevels(levels, undefined)).toBe(levels);
    expect(aggregateLevels(levels, 0)).toBe(levels);
  });

  it("groups by tick size", () => {
    const levels = [
      { price: 0.651, size: 100 },
      { price: 0.654, size: 200 },
      { price: 0.659, size: 50 },
      { price: 0.641, size: 300 },
    ];
    const result = aggregateLevels(levels, 0.01);
    // 0.651 and 0.654 round to 0.65, 0.659 rounds to 0.66
    const at65 = result.find((l) => Math.abs(l.price - 0.65) < 0.001);
    expect(at65?.size).toBe(300);
  });
});

describe("processLevels", () => {
  it("computes cumulative totals", () => {
    const levels = [
      { price: 0.65, size: 100 },
      { price: 0.64, size: 200 },
      { price: 0.63, size: 300 },
    ];
    const result = processLevels(levels, "bid", 10);
    expect(result.map((l) => l.total)).toEqual([100, 300, 600]);
  });

  it("computes depth as ratio of total to max", () => {
    const levels = [
      { price: 0.65, size: 100 },
      { price: 0.64, size: 100 },
    ];
    const result = processLevels(levels, "bid", 10);
    expect(result[0].depth).toBeCloseTo(0.5);
    expect(result[1].depth).toBeCloseTo(1.0);
  });

  it("slices to maxDepth", () => {
    const levels = Array.from({ length: 20 }, (_, i) => ({
      price: 0.65 - i * 0.01,
      size: 100,
    }));
    const result = processLevels(levels, "bid", 5);
    expect(result).toHaveLength(5);
  });

  it("handles empty input", () => {
    expect(processLevels([], "bid", 10)).toEqual([]);
  });

  it("handles single level", () => {
    const result = processLevels([{ price: 0.65, size: 500 }], "bid", 10);
    expect(result).toHaveLength(1);
    expect(result[0].depth).toBe(1);
    expect(result[0].total).toBe(500);
  });
});

describe("createMaxTotalSmoother", () => {
  it("returns raw value on first call", () => {
    const smooth = createMaxTotalSmoother();
    expect(smooth(1000)).toBe(1000);
  });

  it("smoothly approaches target", () => {
    const smooth = createMaxTotalSmoother();
    smooth(1000);
    const v = smooth(2000);
    // Should be between 1000 and 2000 (rises fast, alpha=0.5 for rises)
    expect(v).toBeGreaterThan(1000);
    expect(v).toBeLessThan(2000);
  });

  it("falls slowly", () => {
    const smooth = createMaxTotalSmoother(0.3);
    smooth(1000);
    const v = smooth(500);
    // Should be between 500 and 1000, closer to 1000 (alpha=0.3 for falls)
    expect(v).toBeGreaterThan(700);
    expect(v).toBeLessThan(1000);
  });

  it("resets on 10x scale change", () => {
    const smooth = createMaxTotalSmoother();
    smooth(100);
    // Jump to 10000 (100x) — should reset, not smooth
    expect(smooth(10000)).toBe(10000);
  });

  it("resets on 0.1x scale change", () => {
    const smooth = createMaxTotalSmoother();
    smooth(10000);
    // Drop to 100 (0.01x) — should reset
    expect(smooth(100)).toBe(100);
  });

  it("resets when raw is 0", () => {
    const smooth = createMaxTotalSmoother();
    smooth(1000);
    expect(smooth(0)).toBe(0);
  });
});

describe("defaultFormatSize", () => {
  it("formats millions", () => {
    expect(defaultFormatSize(5_000_000)).toBe("5.0M");
    expect(defaultFormatSize(99_999_999)).toBe("100.0M");
  });

  it("formats thousands", () => {
    expect(defaultFormatSize(5_000)).toBe("5.0K");
    expect(defaultFormatSize(1_500)).toBe("1.5K");
  });

  it("formats small numbers", () => {
    expect(defaultFormatSize(999)).toBe("999");
    expect(defaultFormatSize(1)).toBe("1");
  });
});
