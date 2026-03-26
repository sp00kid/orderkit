"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Orderbook } from "orderkit";
import type { OrderbookLevel } from "orderkit";
import { PredictionMarketSim } from "../lib/PredictionSim";

export default function DepthModes() {
  const [mode, setMode] = useState<"cumulative" | "level">("cumulative");
  const simRef = useRef<PredictionMarketSim | null>(null);
  const [book, setBook] = useState<{ bids: OrderbookLevel[]; asks: OrderbookLevel[] }>({
    bids: [],
    asks: [],
  });

  if (!simRef.current) {
    simRef.current = new PredictionMarketSim(0.58);
  }

  useEffect(() => {
    if (simRef.current) setBook(simRef.current.getSnapshot());
    const interval = setInterval(() => {
      if (simRef.current) setBook(simRef.current.tick());
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = useCallback((price: number) => `$${price.toFixed(2)}`, []);
  const formatSize = useCallback((size: number) => {
    if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
    if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
    return size.toLocaleString();
  }, []);

  return (
    <section className="section">
      <div className="section-label">Depth Modes</div>
      <div className="prose">
        <p>
          Cumulative bars grow outward from the spread &mdash; standard on every
          exchange. But when one whale parks 500K shares at the best bid, every
          other bar becomes a rounding error. Level mode shows each price
          level&apos;s size independently. You see where the liquidity actually
          sits.
        </p>
      </div>
      <div className="demo-container">
        <div className="toggle-row">
          <button
            className={`toggle-btn ${mode === "cumulative" ? "toggle-btn-active" : ""}`}
            onClick={() => setMode("cumulative")}
          >
            Cumulative
          </button>
          <button
            className={`toggle-btn ${mode === "level" ? "toggle-btn-active" : ""}`}
            onClick={() => setMode("level")}
          >
            Level
          </button>
        </div>
        <Orderbook
          bids={book.bids}
          asks={book.asks}
          theme="light"
          depth={8}
          depthMode={mode}
          highlightChanges
          formatPrice={formatPrice}
          formatSize={formatSize}
        />
      </div>
    </section>
  );
}
