"use client";

import type { SyntheticEvent } from "react";
import { BackgroundSquares } from "./components/background-squares";

const MIRROR_VERSION = "launchpad-shell-5";

function getMirrorUrl(pathname: string, hash = "") {
  let normalizedPath = pathname;
  if (normalizedPath === "/mirror") normalizedPath = "/";
  if (normalizedPath.startsWith("/mirror/")) normalizedPath = normalizedPath.slice(7);
  if (
    normalizedPath === "/" ||
    normalizedPath === "/index" ||
    normalizedPath === "/index.html"
  ) {
    return `/mirror?v=${MIRROR_VERSION}${hash}`;
  }
  return `/mirror${normalizedPath}?v=${MIRROR_VERSION}${hash}`;
}

function applyFloatTheme(event: SyntheticEvent<HTMLIFrameElement>) {
  const frame = event.currentTarget;
  const doc = event.currentTarget.contentDocument;

  if (!doc) {
    return;
  }

  frame.dataset.ready = "true";

  if (!doc.documentElement.dataset.localNavigation) {
    doc.documentElement.dataset.localNavigation = "true";
    const navigate = async (url: URL) => {
      const currentContent = doc.querySelector<HTMLElement>("#content-container");
      if (!currentContent) return;

      currentContent.setAttribute("aria-busy", "true");
      try {
        const response = await fetch(getMirrorUrl(url.pathname));
        if (!response.ok) throw new Error(`Documentation request failed: ${response.status}`);

        const nextDoc = new DOMParser().parseFromString(await response.text(), "text/html");
        const nextContent = nextDoc.querySelector<HTMLElement>("#content-container");
        if (!nextContent) throw new Error("Documentation content was not found");

        currentContent.replaceChildren(
          ...Array.from(nextContent.childNodes, (node) => doc.importNode(node, true)),
        );
        currentContent.scrollTop = 0;
        doc.title = nextDoc.title;

        const nextNavigation = nextDoc.querySelector<HTMLElement>(
          "#sidebar-content #navigation-items",
        );
        const staticNavigation = doc.querySelector<HTMLElement>(
          "#docs-static-sidebar #navigation-items",
        );
        if (nextNavigation && staticNavigation) {
          staticNavigation.replaceWith(doc.importNode(nextNavigation, true));
        }

        frame.contentWindow?.history.pushState({}, "", getMirrorUrl(url.pathname, url.hash));
        if (url.hash) {
          doc.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({
            block: "start",
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        currentContent.removeAttribute("aria-busy");
      }
    };

    doc.addEventListener("click", (clickEvent) => {
      const target = clickEvent.target;
      const FrameElement = doc.defaultView?.Element;
      if (!FrameElement || !(target instanceof FrameElement)) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const rawHref = link.getAttribute("href");
      if (rawHref?.startsWith("#")) {
        clickEvent.preventDefault();
        doc.getElementById(decodeURIComponent(rawHref.slice(1)))?.scrollIntoView({
          block: "start",
        });
        frame.contentWindow?.history.pushState({}, "", rawHref);
        return;
      }

      const url = new URL(link.href, frame.contentWindow?.location.href);
      if (url.origin !== frame.contentWindow?.location.origin) return;
      if (
        url.pathname.startsWith("/mintlify-assets/") ||
        url.pathname.startsWith("/fonts/") ||
        url.pathname === "/index.md" ||
        url.pathname === "/llms.txt"
      ) {
        return;
      }

      clickEvent.preventDefault();
      void navigate(url);
    }, true);
  }

  if (!doc.querySelector('link[data-float-theme="true"]')) {
    const stylesheet = doc.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = `/float-theme.css?v=${MIRROR_VERSION}`;
    stylesheet.dataset.floatTheme = "true";
    doc.head.appendChild(stylesheet);
  }

  const scrollWindow = doc.querySelector<HTMLElement>("#content-container");
  const bodyFrame = doc.querySelector<HTMLElement>("#navbar + div");
  const sidebar = doc.querySelector<HTMLElement>("#sidebar");
  const sidebarContent = doc.querySelector<HTMLElement>("#sidebar-content");
  if (!scrollWindow || !bodyFrame) {
    return;
  }

  const pinSidebar = () => {
    if (!sidebar) return;
    let staticSidebar = bodyFrame.querySelector<HTMLElement>("#docs-static-sidebar");
    const navigation = sidebarContent?.querySelector<HTMLElement>("#navigation-items");
    if (!staticSidebar && navigation) {
      staticSidebar = doc.createElement("aside");
      staticSidebar.id = "docs-static-sidebar";
      staticSidebar.setAttribute("aria-label", "Documentation navigation");
      staticSidebar.appendChild(navigation.cloneNode(true));
      bodyFrame.prepend(staticSidebar);
    }
    sidebar.style.setProperty("display", "none", "important");
  };
  pinSidebar();
  requestAnimationFrame(pinSidebar);
  window.setTimeout(pinSidebar, 250);

  if (bodyFrame.querySelector(".pixel-frame__scrollbar")) {
    return;
  }

  const scrollbar = doc.createElement("div");
  scrollbar.className = "pixel-frame__scrollbar";
  scrollbar.setAttribute("aria-hidden", "true");
  const thumb = doc.createElement("div");
  thumb.className = "pixel-frame__scrollbar-thumb";
  scrollbar.appendChild(thumb);
  bodyFrame.appendChild(scrollbar);

  const syncScrollbar = () => {
    const maxScroll = scrollWindow.scrollHeight - scrollWindow.clientHeight;
    const travel = scrollbar.clientHeight - thumb.offsetHeight;
    const progress = maxScroll > 0 ? scrollWindow.scrollTop / maxScroll : 0;
    scrollbar.hidden = maxScroll <= 0;
    thumb.style.transform = `translateY(${Math.max(0, progress * travel)}px)`;
  };

  let dragOffset = 0;
  let dragging = false;
  const scrollFromPointer = (pointerEvent: PointerEvent) => {
    const track = scrollbar.getBoundingClientRect();
    const maxScroll = scrollWindow.scrollHeight - scrollWindow.clientHeight;
    const travel = scrollbar.clientHeight - thumb.offsetHeight;
    if (travel <= 0 || maxScroll <= 0) return;
    const thumbTop = Math.max(
      0,
      Math.min(travel, pointerEvent.clientY - track.top - 1 - dragOffset),
    );
    scrollWindow.scrollTop = (thumbTop / travel) * maxScroll;
  };

  scrollbar.addEventListener("pointerdown", (pointerEvent) => {
    const bounds = thumb.getBoundingClientRect();
    const onThumb = pointerEvent.clientY >= bounds.top && pointerEvent.clientY <= bounds.bottom;
    dragOffset = onThumb ? pointerEvent.clientY - bounds.top : thumb.offsetHeight / 2;
    dragging = true;
    scrollbar.setPointerCapture(pointerEvent.pointerId);
    scrollFromPointer(pointerEvent);
  });
  scrollbar.addEventListener("pointermove", (pointerEvent) => {
    if (dragging) scrollFromPointer(pointerEvent);
  });
  const stopDragging = (pointerEvent: PointerEvent) => {
    dragging = false;
    if (scrollbar.hasPointerCapture(pointerEvent.pointerId)) {
      scrollbar.releasePointerCapture(pointerEvent.pointerId);
    }
  };
  scrollbar.addEventListener("pointerup", stopDragging);
  scrollbar.addEventListener("pointercancel", stopDragging);
  scrollWindow.addEventListener("scroll", syncScrollbar, { passive: true });

  const resizeObserver = new ResizeObserver(syncScrollbar);
  resizeObserver.observe(scrollWindow);
  for (const child of scrollWindow.children) resizeObserver.observe(child);
  new MutationObserver(syncScrollbar).observe(scrollWindow, {
    childList: true,
    subtree: true,
  });
  syncScrollbar();
}

export function DocsMirror({
  src = `/mirror?v=${MIRROR_VERSION}`,
}: {
  src?: string;
}) {
  return (
    <main className="mirror-shell">
      <div className="pixel-blast" aria-hidden="true">
        <BackgroundSquares />
      </div>
      <iframe
        className="mirror-frame"
        src={src}
        title="dottxt documentation"
        onLoad={applyFloatTheme}
      />
    </main>
  );
}

export default function Home() {
  return <DocsMirror />;
}
