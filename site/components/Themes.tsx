"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Orderbook } from "orderkit";
import type { OrderbookLevel } from "orderkit";
import { PredictionMarketSim } from "../lib/PredictionSim";
import styles from "./Themes.module.css";

export default function Themes() {
  const simRef = useRef<PredictionMarketSim | null>(null);
  const [book, setBook] = useState<{ bids: OrderbookLevel[]; asks: OrderbookLevel[] }>({
    bids: [],
    asks: [],
  });

  if (!simRef.current) {
    simRef.current = new PredictionMarketSim(0.7);
  }

  useEffect(() => {
    if (simRef.current) setBook(simRef.current.getSnapshot());
    const interval = setInterval(() => {
      if (simRef.current) setBook(simRef.current.tick());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = useCallback((price: number) => `$${price.toFixed(2)}`, []);
  const formatSize = useCallback((size: number) => {
    if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
    return size.toLocaleString();
  }, []);

  return (
    <section className="section">
      <div className="section-label">Themes</div>
      <div className={styles.grid}>
        <div>
          <Orderbook
            bids={book.bids}
            asks={book.asks}
            theme="dark"
            depth={6}
            highlightChanges
            formatPrice={formatPrice}
            formatSize={formatSize}
          />
          <div className="demo-caption">Dark</div>
        </div>
        <div>
          <Orderbook
            bids={book.bids}
            asks={book.asks}
            theme="light"
            depth={6}
            highlightChanges
            formatPrice={formatPrice}
            formatSize={formatSize}
          />
          <div className="demo-caption">Light</div>
        </div>
      </div>
    </section>
  );
}
