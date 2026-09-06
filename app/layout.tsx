import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLOAT",
  applicationName: "FLOAT",
  icons: { icon: { url: "/float-favicon.png", type: "image/png" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
