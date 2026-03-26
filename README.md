# orderkit

A lightweight, animated React orderbook component. 3.1KB gzipped. Zero runtime dependencies.

Built for prediction markets and crypto exchanges. Handles thin books (3 levels) and deep books (20+ levels) gracefully. Sanitizes bad data, smooths depth bar jitter on high-frequency feeds, and never collapses on data loss.

## Install

```bash
npm install orderkit
```

## Quick start

```tsx
import { Orderbook } from 'orderkit'
import 'orderkit/styles.css'

<Orderbook
  bids={[
    { price: 0.64, size: 5000 },
    { price: 0.63, size: 8000 },
    { price: 0.62, size: 3000 },
  ]}
  asks={[
    { price: 0.66, size: 4000 },
    { price: 0.67, size: 7000 },
    { price: 0.68, size: 2000 },
  ]}
/>
```

Two props to get started. That's it.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bids` | `{ price: number, size: number }[]` | required | Buy orders, highest price first |
| `asks` | `{ price: number, size: number }[]` | required | Sell orders, lowest price first |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color scheme |
| `depth` | `number` | `10` | Max visible price levels per side |
| `showSpread` | `boolean` | `true` | Show spread row between bids and asks |
| `showHeaders` | `boolean` | `true` | Column headers (Price / Size / Total) |
| `grouping` | `number` | — | Tick size for price level aggregation |
| `depthMode` | `'cumulative' \| 'level'` | `'cumulative'` | Bar mode: cumulative grows outward, level shows per-level size |
| `highlightChanges` | `boolean` | `true` | Flash animation on size changes |
| `layout` | `'vertical' \| 'horizontal'` | `'vertical'` | Vertical = asks on top, bids below |
| `formatPrice` | `(price: number) => string` | 2 decimal places | Custom price formatter |
| `formatSize` | `(size: number) => string` | Auto K/M | Custom size formatter |
| `className` | `string` | — | Container class |
| `style` | `CSSProperties` | — | Container styles |

## Theming

Override CSS custom properties on `.ok-orderbook`:

```css
.ok-orderbook {
  --ok-bg: #0a0a0a;
  --ok-text: #d4d4d4;
  --ok-text-muted: #525252;
  --ok-border: #1a1a1a;
  --ok-bid: #4ade80;
  --ok-ask: #f87171;
  --ok-bid-bar: rgba(74, 222, 128, 0.06);
  --ok-ask-bar: rgba(248, 113, 113, 0.06);
  --ok-font: "SF Mono", ui-monospace, monospace;
  --ok-font-size: 12px;
  --ok-row-height: 24px;
}
```

## Data safety

The component sanitizes input data before rendering:

- Filters out zero, negative, NaN, and Infinity prices/sizes
- Merges duplicate price levels (sums sizes)
- Handles floating point dust (0.1 + 0.2 = 0.3, not 0.30000000000000004)
- Crossed books show "—" spread instead of misleading negative values
- Empty/partial data holds container height — no layout collapse

## Performance

- Memoized row components — only re-renders rows whose data changed
- Smoothed depth ratios prevent bar jitter on high-frequency feeds
- Auto-resets smoothing on >10x scale change (handles market switching)
- Instant depth bar updates (no CSS transitions) to preserve visual correctness
- Flash highlights use refs + timers decoupled from React lifecycle — no stuck states

## Requirements

- React 18+ or React 19+
- Import `orderkit/styles.css` for default styling

## License

MIT
