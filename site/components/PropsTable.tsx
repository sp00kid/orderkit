import styles from "./PropsTable.module.css";

const PROPS = [
  { name: "bids", type: "{ price: number, size: number }[]", def: "required", desc: "Buy orders, highest price first" },
  { name: "asks", type: "{ price: number, size: number }[]", def: "required", desc: "Sell orders, lowest price first" },
  { name: "theme", type: "'dark' | 'light'", def: "'dark'", desc: "Color scheme" },
  { name: "depth", type: "number", def: "10", desc: "Max visible price levels per side" },
  { name: "showSpread", type: "boolean", def: "true", desc: "Show spread row between bids and asks" },
  { name: "showHeaders", type: "boolean", def: "true", desc: "Column headers (Price / Size / Total)" },
  { name: "grouping", type: "number", def: "\u2014", desc: "Tick size for price level aggregation" },
  { name: "onGroupingChange", type: "(grouping: number) => void", def: "\u2014", desc: "Callback when user changes grouping" },
  { name: "depthMode", type: "'cumulative' | 'level'", def: "'cumulative'", desc: "Bar mode: cumulative grows outward, level shows per-level size" },
  { name: "highlightChanges", type: "boolean", def: "true", desc: "Flash animation on size changes" },
  { name: "layout", type: "'vertical' | 'horizontal'", def: "'vertical'", desc: "Vertical = asks on top, bids below" },
  { name: "formatPrice", type: "(price: number) => string", def: "2 decimal places", desc: "Custom price formatter" },
  { name: "formatSize", type: "(size: number) => string", def: "Auto K/M", desc: "Custom size formatter" },
  { name: "className", type: "string", def: "\u2014", desc: "Container class" },
  { name: "style", type: "CSSProperties", def: "\u2014", desc: "Container styles" },
];

export default function PropsTable() {
  return (
    <section className="section">
      <div className="section-label">Props</div>
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {PROPS.map((p) => (
              <tr key={p.name}>
                <td><code>{p.name}</code></td>
                <td><code>{p.type}</code></td>
                <td>{p.def}</td>
                <td>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
