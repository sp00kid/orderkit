import { useMemo, useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import type { OrderbookProps, ProcessedLevel } from "./types";
import { OrderbookRow } from "./OrderbookRow";
import { Skeleton } from "./Skeleton";
import { useFlash } from "./useFlash";
import {
  defaultFormatPrice,
  defaultFormatSize,
  sanitizeLevels,
  aggregateLevels,
  processLevels,
  createMaxTotalSmoother,
} from "./utils";

function applyDepthMode(
  levels: ProcessedLevel[],
  mode: "cumulative" | "level",
  smoother: (raw: number) => number
): ProcessedLevel[] {
  if (levels.length === 0) return [];

  if (mode === "level") {
    const maxSize = Math.max(...levels.map((l) => l.size));
    const smoothMax = smoother(maxSize);
    return levels.map((level) => ({
      ...level,
      depth: smoothMax > 0 ? Math.min(1, level.size / smoothMax) : 0,
    }));
  }

  const rawMax = levels[levels.length - 1]?.total ?? 0;
  const smoothMax = smoother(rawMax);
  return levels.map((level) => ({
    ...level,
    depth: smoothMax > 0 ? Math.min(1, level.total / smoothMax) : 0,
  }));
}

export function Orderbook({
  bids,
  asks,
  theme = "dark",
  depth = 10,
  showSpread = true,
  showHeaders = true,
  grouping,
  highlightChanges = true,
  depthMode = "cumulative",
  layout = "vertical",
  scrollLock: scrollLockProp = true,
  lastPrice,
  onPriceClick,
  formatPrice = defaultFormatPrice,
  formatSize = defaultFormatSize,
  className,
  style,
}: OrderbookProps) {
  const flash = useFlash(highlightChanges);
  const askSmootherRef = useRef(createMaxTotalSmoother());
  const bidSmootherRef = useRef(createMaxTotalSmoother());

  // Scroll lock state
  const scrollRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const isAdjustingRef = useRef(false);
  const [locked, setLocked] = useState(scrollLockProp);

  // Sync prop changes
  useEffect(() => {
    setLocked(scrollLockProp);
  }, [scrollLockProp]);

  flash.startCycle();

  // In scroll lock mode, process ALL levels (no depth cap)
  // In normal mode, cap at depth
  const maxLevels = scrollLockProp ? Infinity : depth;

  const processedAsks = useMemo(() => {
    const clean = sanitizeLevels(asks);
    const aggregated = aggregateLevels(clean, grouping);
    const sorted = [...aggregated].sort((a, b) => a.price - b.price);
    return processLevels(sorted, "ask", maxLevels);
  }, [asks, grouping, maxLevels]);

  const smoothedAsks = useMemo(() => {
    const withDepth = applyDepthMode(processedAsks, depthMode, askSmootherRef.current);
    return withDepth.reverse();
  }, [processedAsks, depthMode]);

  const processedBids = useMemo(() => {
    const clean = sanitizeLevels(bids);
    const aggregated = aggregateLevels(clean, grouping);
    const sorted = [...aggregated].sort((a, b) => b.price - a.price);
    return processLevels(sorted, "bid", maxLevels);
  }, [bids, grouping, maxLevels]);

  const smoothedBids = useMemo(() => {
    return applyDepthMode(processedBids, depthMode, bidSmootherRef.current);
  }, [processedBids, depthMode]);

  // Track last price direction
  const prevLastPriceRef = useRef<number | undefined>(undefined);
  const priceDirection = useMemo((): "up" | "down" | null => {
    if (lastPrice === undefined || prevLastPriceRef.current === undefined) return null;
    if (lastPrice > prevLastPriceRef.current) return "up";
    if (lastPrice < prevLastPriceRef.current) return "down";
    return null;
  }, [lastPrice]);

  useEffect(() => {
    prevLastPriceRef.current = lastPrice;
  }, [lastPrice]);

  const spread = useMemo((): { value: number; percent: number; mid: number } | "empty" | "crossed" | null => {
    if (!showSpread) return null;

    if (smoothedAsks.length === 0 || smoothedBids.length === 0) return "empty";

    const lowestAsk = smoothedAsks[smoothedAsks.length - 1]?.price ?? 0;
    const highestBid = smoothedBids[0]?.price ?? 0;
    const value = lowestAsk - highestBid;

    if (value <= 0) return "crossed";

    const mid = (lowestAsk + highestBid) / 2;
    const percent = mid > 0 ? (value / mid) * 100 : 0;

    return { value, percent, mid };
  }, [smoothedAsks, smoothedBids, showSpread]);

  useEffect(() => {
    flash.endCycle();
  });

  // ── Scroll lock: center spread before paint ──
  // Runs on EVERY render when locked. No dependency array.
  // Uses getBoundingClientRect for robust positioning.
  useLayoutEffect(() => {
    if (!scrollLockProp || !locked) return;

    const container = scrollRef.current;
    const spreadEl = spreadRef.current;
    if (!container || !spreadEl) return;
    if (container.scrollHeight <= container.clientHeight) return;

    const spreadOffsetInContent =
      spreadEl.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;

    const target =
      spreadOffsetInContent -
      container.clientHeight / 2 +
      spreadEl.clientHeight / 2;

    isAdjustingRef.current = true;
    container.scrollTop = target;
    requestAnimationFrame(() => {
      isAdjustingRef.current = false;
    });
  });

  // ── Scroll handler: detect user scroll to unlock ──
  const handleScroll = useCallback(() => {
    if (isAdjustingRef.current) return; // programmatic scroll, ignore
    if (!scrollLockProp) return;
    // User scrolled — unlock
    setLocked(false);
  }, [scrollLockProp]);

  // Re-lock function
  const handleRelock = useCallback(() => {
    setLocked(true);
  }, []);

  const isEmpty = smoothedAsks.length === 0 && smoothedBids.length === 0;
  const isHorizontal = layout === "horizontal";
  const ROW_HEIGHT = 24;

  // Shared spread row content
  const spreadContent = spread === null ? null : spread === "empty" || spread === "crossed" ? (
    <span className="ok-spread-value">&mdash;</span>
  ) : (
    <>
      {lastPrice !== undefined && priceDirection && (
        <span className={`ok-spread-arrow ok-spread-arrow-${priceDirection}`}>
          <span className="ok-spread-arrow-motion">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </span>
        </span>
      )}
      {lastPrice !== undefined ? (
        <span className={`ok-spread-last ${priceDirection ? `ok-spread-last-${priceDirection}` : ""}`}>
          {formatPrice(lastPrice)}
        </span>
      ) : (
        <span className="ok-spread-value">
          {formatPrice(spread.mid)}
        </span>
      )}
      <span className="ok-spread-percent">
        {formatPrice(spread.value)} ({spread.percent.toFixed(2)}%)
      </span>
    </>
  );
  const HEADER_HEIGHT = showHeaders ? 29 : 0;
  const SPREAD_HEIGHT = showSpread ? 32 : 0;
  const visibleHeight = depth * ROW_HEIGHT * 2 + SPREAD_HEIGHT;
  const totalHeight = HEADER_HEIGHT + visibleHeight;

  // Single render path — scrollLock only controls auto-centering
  return (
    <div
      className={`ok-orderbook ${isHorizontal ? "ok-horizontal" : "ok-vertical"} ok-${theme}${className ? ` ${className}` : ""}`}
      style={{ height: totalHeight, ...style }}
    >
      {showHeaders && (
        <div className="ok-headers">
          <span className="ok-cell ok-price">Price</span>
          <span className="ok-cell ok-size">Size</span>
          <span className="ok-cell ok-total">Total</span>
        </div>
      )}

      <div
        ref={scrollRef}
        className={`ok-body ok-body-scrollable ${isHorizontal ? "ok-body-horizontal" : ""}`}
        style={{
          height: visibleHeight,
          overflowY: "auto",
          scrollBehavior: "auto",
          overflowAnchor: "none",
        }}
        onScroll={handleScroll}
      >
        <div className="ok-side ok-asks">
          {isEmpty ? (
            <Skeleton rows={depth} />
          ) : (
            smoothedAsks.map((level) => (
              <OrderbookRow
                key={level.price}
                level={level}
                flash={flash.getFlash(level.price, level.size)}
                formatPrice={formatPrice}
                formatSize={formatSize}
                onPriceClick={onPriceClick}
              />
            ))
          )}
        </div>

        {spread !== null && (
          <div className="ok-spread" ref={spreadRef}>
            {spreadContent}
          </div>
        )}

        <div className="ok-side ok-bids">
          {isEmpty ? (
            <Skeleton rows={depth} />
          ) : (
            smoothedBids.map((level) => (
              <OrderbookRow
                key={level.price}
                level={level}
                flash={flash.getFlash(level.price, level.size)}
                formatPrice={formatPrice}
                formatSize={formatSize}
                onPriceClick={onPriceClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Re-lock button when scroll lock is on but user scrolled away */}
      {scrollLockProp && !locked && (
        <button className="ok-relock" onClick={handleRelock}>
          Center spread
        </button>
      )}
    </div>
  );
}
