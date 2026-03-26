import { useRef } from "react";

type FlashDirection = "up" | "down" | null;

/**
 * Tracks previous sizes at each price level and returns
 * the flash direction for a given price.
 * Cleans up stale entries each cycle.
 */
export function useFlash(enabled: boolean) {
  const prevSizes = useRef(new Map<number, number>());
  const seenThisCycle = useRef(new Set<number>());
  const cycleCounter = useRef(0);

  function startCycle() {
    cycleCounter.current++;
    seenThisCycle.current.clear();
  }

  function endCycle() {
    // Remove prices not seen this cycle (levels that disappeared)
    for (const price of prevSizes.current.keys()) {
      if (!seenThisCycle.current.has(price)) {
        prevSizes.current.delete(price);
      }
    }
  }

  function getFlash(price: number, size: number): FlashDirection {
    seenThisCycle.current.add(price);

    if (!enabled) return null;

    const prev = prevSizes.current.get(price);
    prevSizes.current.set(price, size);

    if (prev === undefined) return null;
    if (size > prev) return "up";
    if (size < prev) return "down";
    return null;
  }

  return { getFlash, startCycle, endCycle };
}
