export default function DesignRationale() {
  return (
    <section className="section">
      <div className="section-label">Design Rationale</div>
      <div className="prose">
        <p>
          <strong>DOM, not canvas.</strong> The data is tabular. CSS handles
          everything. Canvas would make customization harder for zero real
          benefit at the scale orderbooks operate (20-40 visible rows).
        </p>
        <p>
          <strong>No CSS transitions on depth bars.</strong> Transitions cause
          bars to animate at different rates. In cumulative mode, a bar at row 5
          might momentarily appear longer than the bar at row 6 mid-animation.
          That&apos;s a lie. The bars update instantly &mdash; truth over
          smoothness.
        </p>
        <p>
          <strong>Smoothed maxTotal, not smoothed bars.</strong> Individual bars
          don&apos;t animate, but the reference point they&apos;re calculated
          against (maxTotal) uses exponential smoothing. Rises fast, falls slow.
          Prevents the whole book from jittering when a large order appears at
          the deepest level. Resets automatically when the scale changes by 10x
          (market switching).
        </p>
        <p>
          <strong>Fixed-height sides.</strong> Both the ask and bid sections are
          exactly <code>depth &times; rowHeight</code> pixels tall, regardless
          of how many levels exist. The spread row is always at the vertical
          center. Empty space fills naturally. No layout shift, ever.
        </p>
      </div>
    </section>
  );
}
