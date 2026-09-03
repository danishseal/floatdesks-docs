import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Start Here - dottxt docs",
  description: "Pick the fastest path based on what you need right now.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
