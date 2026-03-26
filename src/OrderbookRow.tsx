import { memo, useRef, useEffect } from "react";
import type { ProcessedLevel } from "./types";

interface OrderbookRowProps {
  level: ProcessedLevel;
  flash: "up" | "down" | null;
  formatPrice: (price: number) => string;
  formatSize: (size: number) => string;
}

export const OrderbookRow = memo(
  function OrderbookRow({ level, flash, formatPrice, formatSize }: OrderbookRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    // Store timer ID in a ref so it persists across renders
    // without being tied to useEffect cleanup
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (!flash || !rowRef.current) return;

      const el = rowRef.current;

      // Clear any existing timer — we're starting a fresh flash
      if (timerRef.current) clearTimeout(timerRef.current);

      // Apply flash instantly
      el.setAttribute("data-flash", flash);

      // Schedule removal — NOT in the cleanup function
      timerRef.current = setTimeout(() => {
        el.removeAttribute("data-flash");
        timerRef.current = null;
      }, 120);

      // No cleanup — the timeout manages itself via ref
    }, [flash, level.size]);

    // Cleanup only on unmount
    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    return (
      <div
        ref={rowRef}
        className="ok-row"
        data-side={level.side}
      >
        <div
          className="ok-depth-bar"
          style={{ transform: `scaleX(${level.depth})` }}
        />
        <span className="ok-cell ok-price">{formatPrice(level.price)}</span>
        <span className="ok-cell ok-size">{formatSize(level.size)}</span>
        <span className="ok-cell ok-total">{formatSize(level.total)}</span>
      </div>
    );
  },
  (prev, next) =>
    prev.level.price === next.level.price &&
    prev.level.size === next.level.size &&
    prev.level.total === next.level.total &&
    prev.flash === next.flash
);
