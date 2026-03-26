export default function DataSafety() {
  return (
    <section className="section">
      <div className="section-label">Data Safety</div>
      <div className="prose">
        <p>The component sanitizes input data before rendering:</p>
        <ul>
          <li>Filters out zero, negative, NaN, and Infinity prices and sizes</li>
          <li>Merges duplicate price levels (sums sizes)</li>
          <li>
            Handles floating point dust (<code>0.1 + 0.2 = 0.3</code>, not{" "}
            <code>0.30000000000000004</code>)
          </li>
          <li>Crossed books show &ldquo;&mdash;&rdquo; spread instead of misleading negative values</li>
          <li>Empty or partial data holds container height &mdash; no layout collapse</li>
        </ul>
      </div>
    </section>
  );
}
