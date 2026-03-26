import { useMemo, useEffect, useRef } from "react";
import type { OrderbookProps, ProcessedLevel } from "./types";
import { OrderbookRow } from "./OrderbookRow";
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
    // Per-level: depth = this level's size / max size across all visible levels
    const maxSize = Math.max(...levels.map((l) => l.size));
    const smoothMax = smoother(maxSize);
    return levels.map((level) => ({
      ...level,
      depth: smoothMax > 0 ? Math.min(1, level.size / smoothMax) : 0,
    }));
  }

  // Cumulative: depth = cumulative total / max cumulative total
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
  formatPrice = defaultFormatPrice,
  formatSize = defaultFormatSize,
  className,
  style,
}: OrderbookProps) {
  const flash = useFlash(highlightChanges);
  const askSmootherRef = useRef(createMaxTotalSmoother());
  const bidSmootherRef = useRef(createMaxTotalSmoother());

  // Start a new flash cycle for this render
  flash.startCycle();

  const processedAsks = useMemo(() => {
    const clean = sanitizeLevels(asks);
    const aggregated = aggregateLevels(clean, grouping);
    const sorted = [...aggregated].sort((a, b) => a.price - b.price);
    return processLevels(sorted, "ask", depth);
  }, [asks, grouping, depth]);

  const smoothedAsks = useMemo(() => {
    const withDepth = applyDepthMode(processedAsks, depthMode, askSmootherRef.current);
    return withDepth.reverse(); // highest ask at top
  }, [processedAsks, depthMode]);

  const processedBids = useMemo(() => {
    const clean = sanitizeLevels(bids);
    const aggregated = aggregateLevels(clean, grouping);
    const sorted = [...aggregated].sort((a, b) => b.price - a.price);
    return processLevels(sorted, "bid", depth);
  }, [bids, grouping, depth]);

  const smoothedBids = useMemo(() => {
    return applyDepthMode(processedBids, depthMode, bidSmootherRef.current);
  }, [processedBids, depthMode]);

  const spread = useMemo((): { value: number; percent: number } | "empty" | "crossed" | null => {
    if (!showSpread) return null;

    if (smoothedAsks.length === 0 || smoothedBids.length === 0) return "empty";

    const lowestAsk = smoothedAsks[smoothedAsks.length - 1]?.price ?? 0;
    const highestBid = smoothedBids[0]?.price ?? 0;
    const value = lowestAsk - highestBid;

    if (value <= 0) return "crossed";

    const mid = (lowestAsk + highestBid) / 2;
    const percent = mid > 0 ? (value / mid) * 100 : 0;

    return { value, percent };
  }, [smoothedAsks, smoothedBids, showSpread]);

  // Clean up stale flash entries after render
  useEffect(() => {
    flash.endCycle();
  });

  const isHorizontal = layout === "horizontal";

  // Lock min-height so the container never collapses on data loss.
  const ROW_HEIGHT = 24;
  const HEADER_HEIGHT = showHeaders ? 29 : 0;
  const SPREAD_HEIGHT = showSpread ? 32 : 0;
  const sideHeight = depth * ROW_HEIGHT;
  const minHeight = HEADER_HEIGHT + sideHeight * 2 + SPREAD_HEIGHT;

  return (
    <div
      className={`ok-orderbook ${isHorizontal ? "ok-horizontal" : "ok-vertical"} ok-${theme}${className ? ` ${className}` : ""}`}
      style={{ minHeight, ...style }}
    >
      {showHeaders && (
        <div className="ok-headers">
          <span className="ok-cell ok-price">Price</span>
          <span className="ok-cell ok-size">Size</span>
          <span className="ok-cell ok-total">Total</span>
        </div>
      )}

      <div className={`ok-body ${isHorizontal ? "ok-body-horizontal" : ""}`}>
        <div className="ok-side ok-asks" style={{ height: sideHeight }}>
          {smoothedAsks.map((level) => (
            <OrderbookRow
              key={level.price}
              level={level}
              flash={flash.getFlash(level.price, level.size)}
              formatPrice={formatPrice}
              formatSize={formatSize}
            />
          ))}
        </div>

        {spread !== null && (
          <div className="ok-spread">
            {spread === "empty" ? (
              <span className="ok-spread-value">—</span>
            ) : spread === "crossed" ? (
              <span className="ok-spread-value">—</span>
            ) : (
              <>
                <span className="ok-spread-value">
                  {formatPrice(spread.value)}
                </span>
                <span className="ok-spread-percent">
                  ({spread.percent.toFixed(2)}%)
                </span>
              </>
            )}
          </div>
        )}

        <div className="ok-side ok-bids" style={{ height: sideHeight }}>
          {smoothedBids.map((level) => (
            <OrderbookRow
              key={level.price}
              level={level}
              flash={flash.getFlash(level.price, level.size)}
              formatPrice={formatPrice}
              formatSize={formatSize}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
