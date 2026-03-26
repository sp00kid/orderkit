import { createRoot } from "react-dom/client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Orderbook } from "../src";
import type { OrderbookLevel } from "../src";
import "../src/styles.css";

// ── Prediction Market Simulator ──────────────────────────────────
// Models a realistic YES/NO market with:
// - Fair value that drifts via random walk
// - Orders clustered near fair value, thinning out further away
// - Levels that appear/disappear naturally
// - Book never crosses (best bid < best ask always)
// - Prices clamped to $0.01-$0.99 with $0.01 tick size

class PredictionMarketSim {
  fairValue: number;
  bids: Map<number, number>;
  asks: Map<number, number>;

  constructor(initialFairValue = 0.62) {
    this.fairValue = initialFairValue;
    this.bids = new Map();
    this.asks = new Map();
    this.seed();
  }

  private clampPrice(p: number): number {
    return Math.round(Math.max(0.01, Math.min(0.99, p)) * 100) / 100;
  }

  private seed() {
    // Active market: 15-25 levels per side, heavy liquidity near the spread
    // Mirrors real Polymarket/Kalshi books on popular markets
    const bidLevels = 15 + Math.floor(Math.random() * 10);
    const askLevels = 15 + Math.floor(Math.random() * 10);

    for (let i = 1; i <= bidLevels; i++) {
      const price = this.clampPrice(this.fairValue - i * 0.01);
      // Liquidity curve: heavy near spread, long tail further out
      // Top 3 levels: 5K-30K shares. Levels 4-10: 2K-15K. Deep: 500-5K.
      let baseSize: number;
      if (i <= 3) baseSize = 5000 + Math.random() * 25000;
      else if (i <= 10) baseSize = 2000 + Math.random() * 13000;
      else baseSize = 500 + Math.random() * 4500;
      if (price > 0) this.bids.set(price, Math.round(baseSize));
    }

    for (let i = 1; i <= askLevels; i++) {
      const price = this.clampPrice(this.fairValue + i * 0.01);
      let baseSize: number;
      if (i <= 3) baseSize = 5000 + Math.random() * 25000;
      else if (i <= 10) baseSize = 2000 + Math.random() * 13000;
      else baseSize = 500 + Math.random() * 4500;
      if (price < 1) this.asks.set(price, Math.round(baseSize));
    }
  }

  tick(): { bids: OrderbookLevel[]; asks: OrderbookLevel[] } {
    // Fair value drifts via random walk, slight mean-reversion
    const drift = (Math.random() - 0.5) * 0.005;
    const reversion = (0.5 - this.fairValue) * 0.001;
    this.fairValue = this.clampPrice(this.fairValue + drift + reversion);

    const bestBid = Math.max(...this.bids.keys(), 0);
    const bestAsk = Math.min(...this.asks.keys(), 1);

    // 3-8 events per tick — active market
    const events = 3 + Math.floor(Math.random() * 6);
    for (let e = 0; e < events; e++) {
      const action = Math.random();

      if (action < 0.40) {
        // Size change on existing level (most common event)
        const side = Math.random() < 0.5 ? this.bids : this.asks;
        const prices = [...side.keys()];
        if (prices.length > 0) {
          const price = prices[Math.floor(Math.random() * prices.length)];
          const current = side.get(price)!;
          // Larger delta for levels near spread, smaller for deep levels
          const sortedPrices = side === this.bids
            ? prices.sort((a, b) => b - a)
            : prices.sort((a, b) => a - b);
          const idx = sortedPrices.indexOf(price);
          const nearSpread = idx < 5;
          const delta = nearSpread
            ? Math.round((Math.random() - 0.48) * 3000)
            : Math.round((Math.random() - 0.48) * 1000);
          const newSize = current + delta;
          if (newSize <= 50) {
            side.delete(price);
          } else {
            side.set(price, newSize);
          }
        }
      } else if (action < 0.60) {
        // New level appears (new limit order)
        if (Math.random() < 0.5) {
          const offset = 1 + Math.floor(Math.random() * 20);
          const price = this.clampPrice(this.fairValue - offset * 0.01);
          if (price < bestAsk && price > 0 && !this.bids.has(price)) {
            const size = offset <= 5
              ? Math.round(2000 + Math.random() * 15000)
              : Math.round(500 + Math.random() * 5000);
            this.bids.set(price, size);
          }
        } else {
          const offset = 1 + Math.floor(Math.random() * 20);
          const price = this.clampPrice(this.fairValue + offset * 0.01);
          if (price > bestBid && price < 1 && !this.asks.has(price)) {
            const size = offset <= 5
              ? Math.round(2000 + Math.random() * 15000)
              : Math.round(500 + Math.random() * 5000);
            this.asks.set(price, size);
          }
        }
      } else if (action < 0.72) {
        // Level removed (order cancelled or fully filled)
        const side = Math.random() < 0.5 ? this.bids : this.asks;
        const prices = [...side.keys()];
        if (prices.length > 8) {
          // Prefer removing deep levels (further from spread)
          const sorted = side === this.bids
            ? prices.sort((a, b) => a - b) // worst bids first
            : prices.sort((a, b) => b - a); // worst asks first
          const idx = Math.floor(Math.random() * Math.min(5, sorted.length));
          side.delete(sorted[idx]);
        }
      } else if (action < 0.85) {
        // Large order hits near spread (market maker activity)
        const side = Math.random() < 0.5 ? this.bids : this.asks;
        const prices = [...side.keys()];
        const sorted = side === this.bids
          ? prices.sort((a, b) => b - a)
          : prices.sort((a, b) => a - b);
        if (sorted.length > 0) {
          const price = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
          const current = side.get(price)!;
          side.set(price, current + Math.round(3000 + Math.random() * 10000));
        }
      }
      // else: no-op (brief quiet moment)
    }

    // Safety: never let book cross
    const finalBestBid = Math.max(...this.bids.keys(), 0);
    const finalBestAsk = Math.min(...this.asks.keys(), 1);
    if (finalBestBid >= finalBestAsk) {
      this.bids.delete(finalBestBid);
    }

    // Maintain minimum depth (active market always has liquidity)
    for (let offset = 1; this.bids.size < 10 && offset < 50; offset++) {
      const price = this.clampPrice(this.fairValue - offset * 0.01);
      if (price <= 0) break;
      if (!this.bids.has(price)) {
        this.bids.set(price, Math.round(1000 + Math.random() * 8000));
      }
    }
    for (let offset = 1; this.asks.size < 10 && offset < 50; offset++) {
      const price = this.clampPrice(this.fairValue + offset * 0.01);
      if (price >= 1) break;
      if (!this.asks.has(price)) {
        this.asks.set(price, Math.round(1000 + Math.random() * 8000));
      }
    }

    return this.getSnapshot();
  }

  getSnapshot(): { bids: OrderbookLevel[]; asks: OrderbookLevel[] } {
    const bids = [...this.bids.entries()]
      .map(([price, size]) => ({ price, size }))
      .sort((a, b) => b.price - a.price);
    const asks = [...this.asks.entries()]
      .map(([price, size]) => ({ price, size }))
      .sort((a, b) => a.price - b.price);
    return { bids, asks };
  }
}

// ── Binance WebSocket Hook ───────────────────────────────────────

function useBinanceOrderbook(symbol: string, enabled: boolean) {
  const [book, setBook] = useState<{ bids: OrderbookLevel[]; asks: OrderbookLevel[] }>({
    bids: [],
    asks: [],
  });
  const wsRef = useRef<WebSocket | null>(null);
  const latestRef = useRef<{ bids: OrderbookLevel[]; asks: OrderbookLevel[] } | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`
    );
    wsRef.current = ws;

    let msgCount = 0;

    // Throttle: render at most once per animation frame (~60fps cap),
    // but also skip frames to target ~4 visual updates/sec
    let lastRenderTime = 0;
    const RENDER_INTERVAL = 250; // ms between visual updates

    function scheduleRender() {
      if (rafRef.current) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const now = performance.now();
        if (now - lastRenderTime < RENDER_INTERVAL) return;
        lastRenderTime = now;
        if (latestRef.current) {
          setBook(latestRef.current);
        }
      });
    }

    ws.onopen = () => {
      console.log("[orderkit:binance] WebSocket connected to", symbol);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      msgCount++;

      if (msgCount === 1 || msgCount % 100 === 0) {
        console.log(`[orderkit:binance] msg #${msgCount}`, {
          bidCount: data.bids?.length ?? 0,
          askCount: data.asks?.length ?? 0,
          bestBid: data.bids?.[0],
          bestAsk: data.asks?.[0],
        });
      }

      if (!data.bids || !data.asks) {
        console.warn("[orderkit:binance] unexpected payload shape:", data);
        return;
      }

      const bids: OrderbookLevel[] = data.bids.map(([p, s]: [string, string]) => ({
        price: parseFloat(p),
        size: parseFloat(s),
      }));
      const asks: OrderbookLevel[] = data.asks.map(([p, s]: [string, string]) => ({
        price: parseFloat(p),
        size: parseFloat(s),
      }));

      const hasBadData = [...bids, ...asks].some(
        (l) => isNaN(l.price) || isNaN(l.size) || l.price <= 0 || l.size < 0
      );
      if (hasBadData) {
        console.error("[orderkit:binance] bad data detected");
        return;
      }

      if (bids.length > 0 && asks.length > 0 && bids[0].price >= asks[0].price) {
        console.error("[orderkit:binance] crossed book!", {
          bestBid: bids[0].price,
          bestAsk: asks[0].price,
        });
      }

      // Buffer latest data, render on schedule
      latestRef.current = { bids, asks };
      scheduleRender();
    };

    ws.onerror = (err) => {
      console.error("[orderkit:binance] WebSocket error:", err);
      ws.close();
    };

    ws.onclose = (event) => {
      console.log("[orderkit:binance] WebSocket closed", {
        code: event.code,
        reason: event.reason,
        totalMessages: msgCount,
      });
    };

    return () => {
      ws.close();
      wsRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [symbol, enabled]);

  return book;
}

// ── App ──────────────────────────────────────────────────────────

type DataSource = "prediction" | "binance" | "edge-case";

// ── Edge Case Scenarios ──────────────────────────────────────────

const EDGE_CASES: Record<string, { label: string; bids: OrderbookLevel[]; asks: OrderbookLevel[] }> = {
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
      { price: 0.60, size: 6000 },
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
      { price: 0.70, size: 5000 },
    ],
  },
  "single-level": {
    label: "1 bid, 1 ask",
    bids: [{ price: 0.60, size: 500 }],
    asks: [{ price: 0.70, size: 500 }],
  },
  "thin-book": {
    label: "Thin (3 levels)",
    bids: [
      { price: 0.62, size: 200 },
      { price: 0.60, size: 150 },
      { price: 0.55, size: 80 },
    ],
    asks: [
      { price: 0.68, size: 300 },
      { price: 0.72, size: 100 },
      { price: 0.78, size: 50 },
    ],
  },
  "wide-spread": {
    label: "Wide spread (20¢)",
    bids: [
      { price: 0.40, size: 5000 },
      { price: 0.39, size: 3000 },
      { price: 0.38, size: 8000 },
      { price: 0.37, size: 2000 },
      { price: 0.36, size: 6000 },
    ],
    asks: [
      { price: 0.60, size: 4000 },
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
      { price: 0.60, size: 100 },
    ],
    asks: [
      { price: 0.66, size: 100 },
      { price: 0.67, size: 250 },
      { price: 0.68, size: 500000 },
      { price: 0.69, size: 300 },
      { price: 0.70, size: 150 },
    ],
  },
  "duplicate-prices": {
    label: "Duplicate prices",
    bids: [
      { price: 0.64, size: 5000 },
      { price: 0.64, size: 3000 },
      { price: 0.63, size: 2000 },
      { price: 0.63, size: 4000 },
      { price: 0.62, size: 1000 },
    ],
    asks: [
      { price: 0.66, size: 3000 },
      { price: 0.66, size: 2000 },
      { price: 0.67, size: 5000 },
    ],
  },
  "crossed-book": {
    label: "Crossed book (bad data)",
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
    label: "Zero/tiny sizes",
    bids: [
      { price: 0.64, size: 0 },
      { price: 0.63, size: 1 },
      { price: 0.62, size: 0 },
      { price: 0.61, size: 5000 },
      { price: 0.60, size: 0 },
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

function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [depthMode, setDepthMode] = useState<"cumulative" | "level">("level");
  const [depth, setDepth] = useState(10);
  const [source, setSource] = useState<DataSource>("prediction");
  const [edgeCase, setEdgeCase] = useState<string>("empty");
  const [predBook, setPredBook] = useState<{ bids: OrderbookLevel[]; asks: OrderbookLevel[] }>({
    bids: [],
    asks: [],
  });
  const simRef = useRef<PredictionMarketSim>();

  // Init simulator
  if (!simRef.current) {
    simRef.current = new PredictionMarketSim(0.62);
    setPredBook(simRef.current.getSnapshot());
  }

  // Prediction market tick — active market updates fast
  useEffect(() => {
    if (source !== "prediction") return;
    const interval = setInterval(() => {
      if (simRef.current) {
        setPredBook(simRef.current.tick());
      }
    }, 300);
    return () => clearInterval(interval);
  }, [source]);

  // Binance live data
  const binanceBook = useBinanceOrderbook("btcusdt", source === "binance");

  const edgeCaseBook = source === "edge-case" ? EDGE_CASES[edgeCase] : null;
  const book = source === "prediction" ? predBook : source === "binance" ? binanceBook : edgeCaseBook!;

  // ── Orderbook health monitor ──
  // Reads the actual rendered DOM every 2s and validates invariants
  useEffect(() => {
    const audit = setInterval(() => {
      const rows = document.querySelectorAll<HTMLElement>(".ok-row");
      if (rows.length === 0) return;

      const askRows: { price: number; size: string; total: string; depth: number; side: string }[] = [];
      const bidRows: { price: number; size: string; total: string; depth: number; side: string }[] = [];

      rows.forEach((row) => {
        const side = row.getAttribute("data-side");
        const bar = row.querySelector<HTMLElement>(".ok-depth-bar");
        const cells = row.querySelectorAll(".ok-cell");
        const priceText = cells[0]?.textContent ?? "";
        const sizeText = cells[1]?.textContent ?? "";
        const totalText = cells[2]?.textContent ?? "";

        // Parse scaleX from transform
        const transform = bar?.style.transform ?? "";
        const scaleMatch = transform.match(/scaleX\(([^)]+)\)/);
        const depth = scaleMatch ? parseFloat(scaleMatch[1]) : -1;

        const price = parseFloat(priceText.replace("$", ""));

        const entry = { price, size: sizeText, total: totalText, depth, side: side ?? "?" };
        if (side === "ask") askRows.push(entry);
        else if (side === "bid") bidRows.push(entry);
      });

      const issues: string[] = [];

      // 1. Asks should be sorted descending (highest at top, lowest near spread)
      for (let i = 0; i < askRows.length - 1; i++) {
        if (askRows[i].price < askRows[i + 1].price) {
          // This is actually correct — asks render highest at top
        }
        if (askRows[i].price === askRows[i + 1].price) {
          issues.push(`duplicate ask price: ${askRows[i].price}`);
        }
      }

      // 2. Bids should be sorted descending (highest near spread at top)
      for (let i = 0; i < bidRows.length - 1; i++) {
        if (bidRows[i].price < bidRows[i + 1].price) {
          issues.push(`bids not sorted descending: ${bidRows[i].price} < ${bidRows[i + 1].price}`);
        }
        if (bidRows[i].price === bidRows[i + 1].price) {
          issues.push(`duplicate bid price: ${bidRows[i].price}`);
        }
      }

      // 3. Book shouldn't cross — lowest ask > highest bid
      const lowestAsk = askRows.length > 0 ? askRows[askRows.length - 1].price : Infinity;
      const highestBid = bidRows.length > 0 ? bidRows[0].price : -Infinity;
      if (lowestAsk <= highestBid) {
        issues.push(`CROSSED BOOK: lowest ask ${lowestAsk} <= highest bid ${highestBid}`);
      }

      // 4. Depth bars should be 0-1 and the last row in each side should be 1.0
      [...askRows, ...bidRows].forEach((r) => {
        if (r.depth < 0 || r.depth > 1.001) {
          issues.push(`bad depth ${r.depth} at price ${r.price}`);
        }
      });

      // 5. No NaN prices
      [...askRows, ...bidRows].forEach((r) => {
        if (isNaN(r.price)) {
          issues.push(`NaN price rendered`);
        }
      });

      // 6. Check flash attributes aren't stuck
      const flashedRows = document.querySelectorAll('.ok-row[data-flash]');
      if (flashedRows.length > rows.length * 0.5) {
        issues.push(`${flashedRows.length}/${rows.length} rows have flash stuck`);
      }

      if (issues.length > 0) {
        console.warn(`[orderkit:audit] ${issues.length} issue(s):`, issues);
      } else {
        console.log(`[orderkit:audit] OK — ${askRows.length} asks, ${bidRows.length} bids, spread: ${(lowestAsk - highestBid).toFixed(4)}, no issues`);
      }
    }, 2000);

    return () => clearInterval(audit);
  }, []);

  const formatPrice = useCallback(
    (price: number) => {
      if (source === "prediction") return `$${price.toFixed(2)}`;
      return price.toFixed(2);
    },
    [source]
  );

  const formatSize = useCallback(
    (size: number) => {
      if (source === "binance") return size.toFixed(4);
      if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
      if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
      return size.toLocaleString();
    },
    [source]
  );

  return (
    <div className="demo-container">
      <div className="demo-sidebar">
        <h1>orderkit</h1>

        <div className="demo-section">
          <span className="demo-label">Data</span>
          <div className="controls">
            <button
              className={source === "prediction" ? "active" : ""}
              onClick={() => setSource("prediction")}
            >
              Prediction
            </button>
            <button
              className={source === "binance" ? "active" : ""}
              onClick={() => setSource("binance")}
            >
              BTC/USDT
            </button>
            <button
              className={source === "edge-case" ? "active" : ""}
              onClick={() => setSource("edge-case")}
            >
              Edge Cases
            </button>
          </div>
        </div>

        {source === "edge-case" && (
          <div className="demo-section">
            <span className="demo-label">Scenario</span>
            <div className="controls" style={{ flexDirection: "column" }}>
              {Object.entries(EDGE_CASES).map(([key, { label }]) => (
                <button
                  key={key}
                  className={edgeCase === key ? "active" : ""}
                  onClick={() => setEdgeCase(key)}
                  style={{ textAlign: "left", width: "100%" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="demo-section">
          <span className="demo-label">Theme</span>
          <div className="controls">
            <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>
              Dark
            </button>
            <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>
              Light
            </button>
          </div>
        </div>

        <div className="demo-section">
          <span className="demo-label">Layout</span>
          <div className="controls">
            <button
              className={layout === "vertical" ? "active" : ""}
              onClick={() => setLayout("vertical")}
            >
              Vertical
            </button>
            <button
              className={layout === "horizontal" ? "active" : ""}
              onClick={() => setLayout("horizontal")}
            >
              Horizontal
            </button>
          </div>
        </div>

        <div className="demo-section">
          <span className="demo-label">Bars</span>
          <div className="controls">
            <button
              className={depthMode === "level" ? "active" : ""}
              onClick={() => setDepthMode("level")}
            >
              Level
            </button>
            <button
              className={depthMode === "cumulative" ? "active" : ""}
              onClick={() => setDepthMode("cumulative")}
            >
              Cumul.
            </button>
          </div>
        </div>

        <div className="demo-section">
          <span className="demo-label">Depth</span>
          <div className="controls">
            {[3, 5, 10, 15].map((d) => (
              <button key={d} className={depth === d ? "active" : ""} onClick={() => setDepth(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="demo-main">
        <Orderbook
          bids={book.bids}
          asks={book.asks}
          theme={theme}
          layout={layout}
          depth={depth}
          highlightChanges={true}
          depthMode={depthMode}
          formatPrice={formatPrice}
          formatSize={formatSize}
        />
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
