import type { OrderbookLevel } from "orderkit";

export class PredictionMarketSim {
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
    const bidLevels = 15 + Math.floor(Math.random() * 10);
    const askLevels = 15 + Math.floor(Math.random() * 10);

    for (let i = 1; i <= bidLevels; i++) {
      const price = this.clampPrice(this.fairValue - i * 0.01);
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
    const drift = (Math.random() - 0.5) * 0.005;
    const reversion = (0.5 - this.fairValue) * 0.001;
    this.fairValue = this.clampPrice(this.fairValue + drift + reversion);

    const bestBid = Math.max(...this.bids.keys(), 0);
    const bestAsk = Math.min(...this.asks.keys(), 1);

    const events = 3 + Math.floor(Math.random() * 6);
    for (let e = 0; e < events; e++) {
      const action = Math.random();

      if (action < 0.4) {
        const side = Math.random() < 0.5 ? this.bids : this.asks;
        const prices = [...side.keys()];
        if (prices.length > 0) {
          const price = prices[Math.floor(Math.random() * prices.length)];
          const current = side.get(price)!;
          const sortedPrices =
            side === this.bids
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
      } else if (action < 0.6) {
        if (Math.random() < 0.5) {
          const offset = 1 + Math.floor(Math.random() * 20);
          const price = this.clampPrice(this.fairValue - offset * 0.01);
          if (price < bestAsk && price > 0 && !this.bids.has(price)) {
            const size =
              offset <= 5
                ? Math.round(2000 + Math.random() * 15000)
                : Math.round(500 + Math.random() * 5000);
            this.bids.set(price, size);
          }
        } else {
          const offset = 1 + Math.floor(Math.random() * 20);
          const price = this.clampPrice(this.fairValue + offset * 0.01);
          if (price > bestBid && price < 1 && !this.asks.has(price)) {
            const size =
              offset <= 5
                ? Math.round(2000 + Math.random() * 15000)
                : Math.round(500 + Math.random() * 5000);
            this.asks.set(price, size);
          }
        }
      } else if (action < 0.72) {
        const side = Math.random() < 0.5 ? this.bids : this.asks;
        const prices = [...side.keys()];
        if (prices.length > 8) {
          const sorted =
            side === this.bids
              ? prices.sort((a, b) => a - b)
              : prices.sort((a, b) => b - a);
          const idx = Math.floor(Math.random() * Math.min(5, sorted.length));
          side.delete(sorted[idx]);
        }
      } else if (action < 0.85) {
        const side = Math.random() < 0.5 ? this.bids : this.asks;
        const prices = [...side.keys()];
        const sorted =
          side === this.bids
            ? prices.sort((a, b) => b - a)
            : prices.sort((a, b) => a - b);
        if (sorted.length > 0) {
          const price =
            sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
          const current = side.get(price)!;
          side.set(
            price,
            current + Math.round(3000 + Math.random() * 10000)
          );
        }
      }
    }

    const finalBestBid = Math.max(...this.bids.keys(), 0);
    const finalBestAsk = Math.min(...this.asks.keys(), 1);
    if (finalBestBid >= finalBestAsk) {
      this.bids.delete(finalBestBid);
    }

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
