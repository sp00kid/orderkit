"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Orderbook } from "orderkit";
import { PredictionMarketSim } from "../lib/PredictionSim";
import type { OrderbookLevel } from "orderkit";
import styles from "./Hero.module.css";

export default function Hero() {
  const simRef = useRef<PredictionMarketSim | null>(null);
  const [book, setBook] = useState<{
    bids: OrderbookLevel[];
    asks: OrderbookLevel[];
  }>({ bids: [], asks: [] });

  if (!simRef.current) {
    simRef.current = new PredictionMarketSim(0.62);
  }

  const tick = useCallback(() => {
    if (simRef.current) {
      setBook(simRef.current.tick());
    }
  }, []);

  useEffect(() => {
    if (simRef.current) {
      setBook(simRef.current.getSnapshot());
    }
    const interval = setInterval(tick, 300);
    return () => clearInterval(interval);
  }, [tick]);

  const formatPrice = useCallback(
    (price: number) => `$${price.toFixed(2)}`,
    []
  );

  const formatSize = useCallback((size: number) => {
    if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
    if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
    return size.toLocaleString();
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.title}>orderkit</div>
      <div className={styles.demo}>
        <Orderbook
          bids={book.bids}
          asks={book.asks}
          depth={10}
          depthMode="level"
          highlightChanges
          formatPrice={formatPrice}
          formatSize={formatSize}
        />
      </div>
      <div className={styles.copy}>
        <p>
          I work on a prediction market platform. Our orderbook was broken
          &mdash; sizes flickered, depth bars jumped on every tick, the spread
          drifted off-center when data got thin. I looked at what was out there.
          Two npm packages, both abandoned. A hundred tutorial repos wired to
          Binance WebSockets. Nothing I could drop into a production trading UI
          and trust.
        </p>
        <p>
          So I built one. One component, two required props, zero dependencies.
          It handles the things that actually break in production: floating point
          dust, crossed books, data loss, whale walls that compress every other
          bar into nothing. 3.1KB gzipped.
        </p>
      </div>
    </section>
  );
}
