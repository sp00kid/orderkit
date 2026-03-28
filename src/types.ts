import type { CSSProperties } from "react";

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface OrderbookProps {
  /** Buy orders, highest price first */
  bids: OrderbookLevel[];
  /** Sell orders, lowest price first */
  asks: OrderbookLevel[];
  /** Color scheme */
  theme?: "dark" | "light";
  /** Max visible price levels per side */
  depth?: number;
  /** Show spread row between bids and asks */
  showSpread?: boolean;
  /** Show column headers (Price / Size / Total) */
  showHeaders?: boolean;
  /** Tick size for price level aggregation */
  grouping?: number;
  /** Callback when user changes grouping */
  onGroupingChange?: (grouping: number) => void;
  /** Custom price formatter */
  formatPrice?: (price: number) => string;
  /** Custom size formatter */
  formatSize?: (size: number) => string;
  /** Flash animation on size changes */
  highlightChanges?: boolean;
  /** Depth bar mode: "cumulative" grows outward from spread, "level" shows per-level size */
  depthMode?: "cumulative" | "level";
  /** Vertical = asks on top, bids below. Horizontal = side by side */
  layout?: "vertical" | "horizontal";
  /** Scrollable book with spread locked to center. When true (default), depth controls visible window height but all levels render. Set false for fixed-depth mode. */
  scrollLock?: boolean;
  /** Last traded price — used to show mid-market and direction arrow in spread row */
  lastPrice?: number;
  /** Callback when a price row is clicked */
  onPriceClick?: (price: number, side: "bid" | "ask") => void;
  /** Container class */
  className?: string;
  /** Container styles */
  style?: CSSProperties;
}

export interface ProcessedLevel {
  price: number;
  size: number;
  total: number;
  depth: number;
  side: "bid" | "ask";
}
