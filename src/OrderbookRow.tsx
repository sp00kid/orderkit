import { memo, useRef, useEffect, useCallback } from "react";
import type { ProcessedLevel } from "./types";

interface OrderbookRowProps {
  level: ProcessedLevel;
  flash: "up" | "down" | null;
  formatPrice: (price: number) => string;
  formatSize: (size: number) => string;
  onPriceClick?: (price: number, side: "bid" | "ask") => void;
}

export const OrderbookRow = memo(
  function OrderbookRow({ level, flash, formatPrice, formatSize, onPriceClick }: OrderbookRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (!flash || !rowRef.current) return;

      const el = rowRef.current;

      if (timerRef.current) clearTimeout(timerRef.current);

      el.setAttribute("data-flash", flash);

      timerRef.current = setTimeout(() => {
        el.removeAttribute("data-flash");
        timerRef.current = null;
      }, 120);
    }, [flash, level.size]);

    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    const handleClick = useCallback(() => {
      onPriceClick?.(level.price, level.side);
    }, [onPriceClick, level.price, level.side]);

    return (
      <div
        ref={rowRef}
        className={`ok-row${onPriceClick ? " ok-row-clickable" : ""}`}
        data-side={level.side}
        onClick={onPriceClick ? handleClick : undefined}
      >
        <div
          className="ok-depth-bar"
          style={{ transform: `scaleX(${level.depth})` }}
        />
        <span className="ok-cell ok-price">{formatPrice(level.price)}</span>
        <span className="ok-cell ok-size">{formatSize(level.size)}</span>
        <span className="ok-cell ok-total" data-pct={`${(level.depth * 100).toFixed(0)}%`}>{formatSize(level.total)}</span>
      </div>
    );
  },
  (prev, next) =>
    prev.level.price === next.level.price &&
    prev.level.size === next.level.size &&
    prev.level.total === next.level.total &&
    prev.flash === next.flash &&
    prev.onPriceClick === next.onPriceClick
);
