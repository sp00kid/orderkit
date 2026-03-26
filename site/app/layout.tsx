import type { Metadata } from "next";
import "./globals.css";
import "../../src/styles.css";

export const metadata: Metadata = {
  title: "orderkit — lightweight React orderbook component",
  description:
    "A lightweight, animated React orderbook component. 3.1KB gzipped. Zero dependencies. Built for prediction markets and crypto exchanges.",
  openGraph: {
    title: "orderkit",
    description: "Lightweight React orderbook component. 3.1KB gzipped.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "orderkit",
    description: "Lightweight React orderbook component. 3.1KB gzipped.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
