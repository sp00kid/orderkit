import type { OrderbookLevel } from "orderkit";

export interface EdgeCase {
  label: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export const EDGE_CASES: Record<string, EdgeCase> = {
  empty: {
    label: "Empty book",
    bids: [],
    asks: [],
  },
  "bids-only": {
    label: "Bids only",
    bids: [
      { price: 0.64, size: 5000 },
      { price: 0.63, size: 8000 },
      { price: 0.62, size: 3000 },
      { price: 0.61, size: 12000 },
      { price: 0.6, size: 6000 },
    ],
    asks: [],
  },
  "asks-only": {
    label: "Asks only",
    bids: [],
    asks: [
      { price: 0.66, size: 4000 },
      { price: 0.67, size: 9000 },
      { price: 0.68, size: 2000 },
      { price: 0.69, size: 7000 },
      { price: 0.7, size: 5000 },
    ],
  },
  "single-level": {
    label: "1 bid, 1 ask",
    bids: [{ price: 0.6, size: 500 }],
    asks: [{ price: 0.7, size: 500 }],
  },
  "thin-book": {
    label: "Thin (3 levels)",
    bids: [
      { price: 0.62, size: 200 },
      { price: 0.6, size: 150 },
      { price: 0.55, size: 80 },
    ],
    asks: [
      { price: 0.68, size: 300 },
      { price: 0.72, size: 100 },
      { price: 0.78, size: 50 },
    ],
  },
  "wide-spread": {
    label: "Wide spread (20c)",
    bids: [
      { price: 0.4, size: 5000 },
      { price: 0.39, size: 3000 },
      { price: 0.38, size: 8000 },
      { price: 0.37, size: 2000 },
      { price: 0.36, size: 6000 },
    ],
    asks: [
      { price: 0.6, size: 4000 },
      { price: 0.61, size: 7000 },
      { price: 0.62, size: 1500 },
      { price: 0.63, size: 9000 },
      { price: 0.64, size: 3000 },
    ],
  },
  "whale-wall": {
    label: "Whale wall",
    bids: [
      { price: 0.64, size: 500000 },
      { price: 0.63, size: 200 },
      { price: 0.62, size: 150 },
      { price: 0.61, size: 300 },
      { price: 0.6, size: 100 },
    ],
    asks: [
      { price: 0.66, size: 100 },
      { price: 0.67, size: 250 },
      { price: 0.68, size: 500000 },
      { price: 0.69, size: 300 },
      { price: 0.7, size: 150 },
    ],
  },
  "crossed-book": {
    label: "Crossed book",
    bids: [
      { price: 0.68, size: 5000 },
      { price: 0.67, size: 3000 },
      { price: 0.66, size: 2000 },
    ],
    asks: [
      { price: 0.65, size: 4000 },
      { price: 0.66, size: 3000 },
      { price: 0.67, size: 7000 },
    ],
  },
  "zero-sizes": {
    label: "Zero sizes",
    bids: [
      { price: 0.64, size: 0 },
      { price: 0.63, size: 1 },
      { price: 0.62, size: 0 },
      { price: 0.61, size: 5000 },
      { price: 0.6, size: 0 },
    ],
    asks: [
      { price: 0.66, size: 0 },
      { price: 0.67, size: 3 },
      { price: 0.68, size: 8000 },
    ],
  },
  "huge-numbers": {
    label: "Huge numbers",
    bids: [
      { price: 0.64, size: 99999999 },
      { price: 0.63, size: 50000000 },
      { price: 0.62, size: 25000000 },
    ],
    asks: [
      { price: 0.66, size: 88888888 },
      { price: 0.67, size: 44444444 },
      { price: 0.68, size: 22222222 },
    ],
  },
};
