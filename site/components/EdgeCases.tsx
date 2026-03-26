"use client";

import { useState, useCallback } from "react";
import { Orderbook } from "orderkit";
import { EDGE_CASES } from "../lib/edge-cases";
import styles from "./EdgeCases.module.css";

const SCENARIOS = Object.entries(EDGE_CASES);

export default function EdgeCases() {
  const [active, setActive] = useState(SCENARIOS[0][0]);
  const current = EDGE_CASES[active];

  const formatPrice = useCallback((price: number) => `$${price.toFixed(2)}`, []);
  const formatSize = useCallback((size: number) => {
    if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
    if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
    return size.toLocaleString();
  }, []);

  return (
    <section className="section">
      <div className="section-label">Edge Cases</div>
      <div className="prose">
        <p>
          Every orderbook works when the data is clean and the book is deep.
          What happens when your WebSocket drops and reconnects with stale data.
          When one market maker parks 500K shares at the best bid and every other
          level becomes a rounding error. When the book thins to three levels on
          each side at 2am and your layout collapses to a sliver.
        </p>
        <p>On prediction markets, this is Tuesday.</p>
      </div>
      <div className="demo-container">
        <Orderbook
          bids={current.bids}
          asks={current.asks}
          theme="light"
          depth={10}
          highlightChanges={false}
          formatPrice={formatPrice}
          formatSize={formatSize}
        />
        <div className={styles.tabs}>
          {SCENARIOS.map(([key, { label }]) => (
            <button
              key={key}
              className={`${styles.tab} ${active === key ? styles.tabActive : ""}`}
              onClick={() => setActive(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
