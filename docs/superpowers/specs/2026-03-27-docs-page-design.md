# orderkit docs page — design spec

## Overview

Single-page documentation site for orderkit. Liveline-style: the page itself IS the demo. Every feature section has a live interactive orderbook before any explanation text. Built with Next.js, deployed on Vercel.

## Tech

- Next.js (app router)
- React 19
- CSS Modules for page layout/prose (no Tailwind — matches Liveline's approach). Component styles are global via `orderkit/styles.css`.
- Vercel deployment
- All demo components are `"use client"` (WebSocket, intervals, state)
- Imports orderkit from `../src` always (monorepo-style). No dual import path.

## Page structure

### 1. Hero

Live orderbook running prediction market sim on load. No controls, no chrome — just the component on a dark background. Below it:

> I work on a prediction market platform. Our orderbook was broken — sizes flickered, depth bars jumped on every tick, the spread drifted off-center when data got thin. I looked at what was out there. Two npm packages, both abandoned. A hundred tutorial repos wired to Binance WebSockets. Nothing I could drop into a production trading UI and trust.
>
> So I built one. One component, two required props, zero dependencies. It handles the things that actually break in production: floating point dust, crossed books, data loss, whale walls that compress every other bar into nothing. 3.1KB gzipped.

### 2. Getting Started

```bash
npm install orderkit
```

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

Copy: "Two props to get started. That's it."

### 3. Live Exchange Data

Live demo: Binance BTC/USDT WebSocket orderbook updating in real time. All demo components are `"use client"`.

**Fallback:** If the WebSocket fails (geo-blocked, CORS, Binance down), show a recorded data playback — pre-captured snapshots replayed at realistic intervals. The component renders identically either way. A small "(recorded)" label appears in the caption so it's honest.

Copy intro:

> Prediction markets update fast. Crypto exchanges update faster. This is a live BTC/USDT orderbook from Binance — 20 price levels per side, updating every 250ms. The component throttles renders to animation frames, smooths depth bar ratios so they don't jitter, and auto-resets when you switch markets.

Code snippet showing the WebSocket hook pattern.

### 4. Depth Modes

Live demo: single orderbook with a toggle between "Level" and "Cumulative" bar modes.

Copy intro:

> Cumulative bars grow outward from the spread — standard on every exchange. But when one whale parks 500K shares at the best bid, every other bar becomes a rounding error. Level mode shows each price level's size independently. You see where the liquidity actually sits.

### 5. Themes

Side-by-side: dark theme and light theme, both with live data.

No copy needed — the visual speaks.

### 6. Edge Cases

Live demo: clickable tabs cycling through key scenarios. Empty book → bids only → asks only → single level → thin book (3 levels) → whale wall → crossed book → zero sizes → huge numbers.

Copy intro:

> Every orderbook works when the data is clean and the book is deep. What happens when your WebSocket drops and reconnects with stale data. When one market maker parks 500K shares at the best bid and every other level becomes a rounding error. When the book thins to three levels on each side at 2am and your layout collapses to a sliver.
>
> On prediction markets, this is Tuesday.

### 7. Data Safety

No demo. Text section.

Bullet list:
- Filters zero, negative, NaN, Infinity
- Merges duplicate price levels
- Handles floating point dust (0.1 + 0.2 = 0.3)
- Crossed books show "—" spread
- Empty/partial data holds container height

### 8. Props Table

Full props table pulled from `src/types.ts` (the TypeScript interface is the source of truth, not the README). Includes `onGroupingChange` and `depthMode` which the README currently omits. Styled to match the page aesthetic — dark background, monospace, clean grid.

### 9. Design Rationale

Copy:

> **DOM, not canvas.** The data is tabular. CSS handles everything. Canvas would make customization harder for zero real benefit at the scale orderbooks operate (20-40 visible rows).
>
> **No CSS transitions on depth bars.** Transitions cause bars to animate at different rates. In cumulative mode, a bar at row 5 might momentarily appear longer than the bar at row 6 mid-animation. That's a lie. The bars update instantly — truth over smoothness.
>
> **Smoothed maxTotal, not smoothed bars.** Individual bars don't animate, but the reference point they're calculated against (maxTotal) uses exponential smoothing. Rises fast, falls slow. Prevents the whole book from jittering when a large order appears at the deepest level. Resets automatically when the scale changes by 10x (market switching).
>
> **Fixed-height sides.** Both the ask and bid sections are exactly `depth × rowHeight` pixels tall, regardless of how many levels exist. The spread row is always at the vertical center. Empty space fills naturally. No layout shift, ever.

### 10. Footer

"Built by Rajul. Used at Pred."

Link to GitHub repo. Link to npm package.

## Visual design

- Dark background: #090909
- Text: system sans-serif for prose, monospace for code and the component itself
- Max content width: ~720px for prose, orderbook demos can go wider (~900px)
- Generous vertical spacing between sections (80-120px)
- Code blocks: dark with syntax highlighting (shiki or prism)
- No sidebar, no table of contents — linear scroll, Liveline-style
- Section headings: small, uppercase, muted — the demos are the headings visually

## File structure

```
orderkit/
├── site/                    # Next.js app (not docs/ — avoids collision with specs/plans)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx         # The single page
│   │   └── globals.css
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── GettingStarted.tsx
│   │   ├── LiveExchange.tsx
│   │   ├── DepthModes.tsx
│   │   ├── Themes.tsx
│   │   ├── EdgeCases.tsx
│   │   ├── DataSafety.tsx
│   │   ├── PropsTable.tsx
│   │   ├── DesignRationale.tsx
│   │   ├── Footer.tsx
│   │   ├── CodeBlock.tsx    # Syntax-highlighted code
│   │   └── PredictionSim.ts # Extracted from demo/main.tsx (class is currently inline there)
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
├── src/                     # Component source (unchanged)
├── demo/                    # Dev demo (unchanged)
└── ...
```

The docs app always imports orderkit from `../src` (monorepo-style). No production/dev import switching — same path, same code.

## Deployment

- Vercel project pointed at `docs/` directory
- Custom domain: orderkit.dev (if available) or orderkit.vercel.app
- No build dependency on the demo — docs is a standalone Next.js app

## What's NOT in scope

- Table of contents / sidebar navigation
- Search
- Multiple pages
- Versioned docs
- Blog / changelog
- Mobile-specific layout (responsive yes, mobile-first no — this is a developer tool page)
