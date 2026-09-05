"use client";

import { ScrambleLabel } from "./scramble-label";

const HEADER_TABS = [
  { label: "App", key: "A", href: "https://app.floatdesks.com", color: "#a6b4a3" },
  { label: "Home", key: "H", href: "https://floatdesks.com", color: "#7f9acf" },
] as const;

export function HeaderTabs() {
  return (
    <nav className="float-header-tabs" aria-label="Float destinations">
      {HEADER_TABS.map((tab) => (
        <a key={tab.label} href={tab.href} target="_top">
          <span
            className="float-header-tab__key"
            style={{ backgroundColor: tab.color }}
            aria-hidden="true"
          >
            {tab.key}
          </span>
          <ScrambleLabel>{tab.label}</ScrambleLabel>
        </a>
      ))}
    </nav>
  );
}
