"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Orderbook } from "orderkit";
import type { OrderbookLevel } from "orderkit";
import { RECORDED_SNAPSHOTS } from "../lib/recorded-binance";

export default function LiveExchange() {
  const [book, setBook] = useState<{ bids: OrderbookLevel[]; asks: OrderbookLevel[] }>({
    bids: [],
    asks: [],
  });
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const latestRef = useRef<{ bids: OrderbookLevel[]; asks: OrderbookLevel[] } | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let lastRenderTime = 0;
    const RENDER_INTERVAL = 250;
    let fallbackTimeout: ReturnType<typeof setTimeout>;

    function scheduleRender() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const now = performance.now();
        if (now - lastRenderTime < RENDER_INTERVAL) return;
        lastRenderTime = now;
        if (latestRef.current) setBook(latestRef.current);
      });
    }

    // Try live WebSocket
    try {
      const ws = new WebSocket(
        "wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms"
      );
      wsRef.current = ws;

      // Fallback if no data within 3s
      fallbackTimeout = setTimeout(() => {
        if (!isLive) startRecordedPlayback();
      }, 3000);

      ws.onmessage = (event) => {
        if (!isLive) {
          setIsLive(true);
          clearTimeout(fallbackTimeout);
        }
        const data = JSON.parse(event.data);
        if (!data.bids || !data.asks) return;
        latestRef.current = {
          bids: data.bids.map(([p, s]: [string, string]) => ({
            price: parseFloat(p),
            size: parseFloat(s),
          })),
          asks: data.asks.map(([p, s]: [string, string]) => ({
            price: parseFloat(p),
            size: parseFloat(s),
          })),
        };
        scheduleRender();
      };

      ws.onerror = () => {
        clearTimeout(fallbackTimeout);
        ws.close();
        startRecordedPlayback();
      };
    } catch {
      startRecordedPlayback();
    }

    function startRecordedPlayback() {
      let idx = 0;
      const interval = setInterval(() => {
        setBook(RECORDED_SNAPSHOTS[idx % RECORDED_SNAPSHOTS.length]);
        idx++;
      }, 250);
      return () => clearInterval(interval);
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const formatPrice = useCallback((price: number) => price.toFixed(2), []);
  const formatSize = useCallback((size: number) => size.toFixed(4), []);

  return (
    <section className="section">
      <div className="section-label">Live Data</div>
      <div className="prose">
        <p>
          Prediction markets update fast. Crypto exchanges update faster. This
          is a {isLive ? "live" : "recorded"} BTC/USDT orderbook from Binance
          &mdash; 20 price levels per side, updating every 250ms. The component
          throttles renders to animation frames, smooths depth bar ratios so
          they don&apos;t jitter, and auto-resets when you switch markets.
        </p>
      </div>
      <div className="demo-container">
        <Orderbook
          bids={book.bids}
          asks={book.asks}
          theme="light"
          depth={10}
          highlightChanges
          formatPrice={formatPrice}
          formatSize={formatSize}
        />
        <div className="demo-caption">
          BTC/USDT {isLive ? "(live)" : "(recorded)"}
        </div>
      </div>
    </section>
  );
}
