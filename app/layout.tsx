import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Float Docs",
  icons: { icon: { url: "/sailboat-white-300_1_1.png", type: "image/png" } },
  description: "Float 2.0 documentation: backing, custody, markets, liquidity, fees, and risk.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
