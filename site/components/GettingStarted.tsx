import CodeBlock from "./CodeBlock";

const installCode = `npm install orderkit`;

const usageCode = `import { Orderbook } from 'orderkit'
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
/>`;

export default function GettingStarted() {
  return (
    <section className="section">
      <div className="section-label">Getting Started</div>
      <CodeBlock code={installCode} language="bash" />
      <CodeBlock code={usageCode} language="tsx" />
      <div className="prose">
        <p>Two props to get started. That&apos;s it.</p>
      </div>
    </section>
  );
}
