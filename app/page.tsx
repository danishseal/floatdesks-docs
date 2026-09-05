"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BackgroundSquares } from "./components/background-squares";
import { HeaderTabs } from "./components/header-tabs";

const MIRROR_VERSION = "float-v2-header-match-1";

/**
 * Move to a heading, visibly, and always arrive.
 *
 * Two things made this worth writing by hand instead of passing
 * `behavior: "smooth"` to scrollIntoView.
 *
 * The content lives in an iframe whose scroller is #content-container, not the
 * document, so the anchor's default behaviour has nothing to scroll. That part
 * was already handled by intercepting the click.
 *
 * The second is why this is a tween rather than a one-line option: a native
 * smooth scroll is an animation, and an animation that never gets a frame
 * never moves. Measured in this frame, a smooth scrollTo to 2010 sat at 0 a
 * full second later while the identical call with "auto" arrived immediately.
 * A jump that always lands is worse UX than one that animates, but far better
 * than one that silently does nothing, so this does both: it eases when frames
 * are coming, and a timer guarantees the destination when they are not.
 */
const SCROLL_MS = 420;
const HEADING_OFFSET = 24;

function scrollToHeading(doc: Document, id: string) {
  const target = doc.getElementById(id);
  const view = doc.defaultView;
  if (!target || !view) return;

  const scroller = doc.querySelector<HTMLElement>("#content-container");
  if (!scroller) return;

  const max = scroller.scrollHeight - scroller.clientHeight;
  const to = Math.max(0, Math.min(max, target.offsetTop - HEADING_OFFSET));
  const from = scroller.scrollTop;
  if (Math.abs(to - from) < 2) return;

  const still = view.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still) {
    scroller.scrollTop = to;
    return;
  }

  const started = view.performance.now();
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  let arrived = false;

  const step = (now: number) => {
    const t = Math.min(1, (now - started) / SCROLL_MS);
    scroller.scrollTop = from + (to - from) * ease(t);
    if (t < 1) view.requestAnimationFrame(step);
    else arrived = true;
  };
  view.requestAnimationFrame(step);

  // The guarantee. If frames never came, this is the whole movement; if they
  // did, it is a no-op on a value already reached.
  view.setTimeout(() => {
    if (!arrived) scroller.scrollTop = to;
  }, SCROLL_MS + 80);
}

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

function ensureHeaderTabsHost(doc: Document) {
  const header = doc.querySelector<HTMLElement>("#navbar");
  if (!header) return null;

  let host = header.querySelector<HTMLElement>("#float-docs-header-tabs-root");
  if (!host) {
    host = doc.createElement("div");
    host.id = "float-docs-header-tabs-root";
    header.appendChild(host);
  }
  return host;
}

function applyFloatTheme(
  frame: HTMLIFrameElement,
  setHeaderTabsHost: (host: HTMLElement) => void,
) {
  const doc = frame.contentDocument;

  if (!doc || !doc.querySelector("#content-container")) {
    return;
  }

  if (doc.documentElement.dataset.floatInitialized) {
    const headerHost = ensureHeaderTabsHost(doc);
    if (headerHost) setHeaderTabsHost(headerHost);
    return;
  }

  doc.documentElement.dataset.floatInitialized = "true";
  frame.dataset.ready = "true";
  document.title = doc.title;

  if (!doc.documentElement.dataset.localNavigation) {
    doc.documentElement.dataset.localNavigation = "true";
    const navigate = async (url: URL, pushHistory = true) => {
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
          const expandedGroups = new Set(
            Array.from(staticNavigation.querySelectorAll<HTMLDetailsElement>("details[open]"), (group) => group.dataset.group),
          );
          for (const group of nextNavigation.querySelectorAll<HTMLDetailsElement>("details[data-group]")) {
            group.open = expandedGroups.has(group.dataset.group);
          }
          staticNavigation.replaceWith(doc.importNode(nextNavigation, true));
        }

        if (pushHistory) frame.contentWindow?.history.pushState({}, "", getMirrorUrl(url.pathname, url.hash));
        document.title = nextDoc.title;
        doc.querySelector<HTMLDetailsElement>(".mobile-navigation")?.removeAttribute("open");
        if (url.hash) {
          scrollToHeading(doc, decodeURIComponent(url.hash.slice(1)));
        }
      } catch (error) {
        console.error(error);
      } finally {
        currentContent.removeAttribute("aria-busy");
      }
    };

    frame.contentWindow?.addEventListener("popstate", () => {
      void navigate(new URL(frame.contentWindow!.location.href), false);
    });

    doc.addEventListener("click", (clickEvent) => {
      if (clickEvent.button !== 0 || clickEvent.metaKey || clickEvent.ctrlKey || clickEvent.shiftKey || clickEvent.altKey) return;
      const target = clickEvent.target;
      const FrameElement = doc.defaultView?.Element;
      if (!FrameElement || !(target instanceof FrameElement)) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const rawHref = link.getAttribute("href");
      if (rawHref?.startsWith("#")) {
        clickEvent.preventDefault();
        scrollToHeading(doc, decodeURIComponent(rawHref.slice(1)));
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

  const headerTabsHost = ensureHeaderTabsHost(doc);
  if (headerTabsHost) setHeaderTabsHost(headerTabsHost);

  /**
   * Expand and collapse the sidebar sections instead of cutting to them.
   *
   * A <details> gives you no animation: the content simply is or is not there.
   * Driving it by hand means taking over the toggle, because the element
   * removes its own content the instant `open` flips, which would cut the
   * closing animation before its first frame.
   *
   * Same guarantee as the heading scroll, for the same reason. If frames never
   * arrive, `transitionend` never fires, and without the timer a section would
   * be left mid animation with an inline height and, on a close, stuck open.
   * The timer makes the end state unconditional and the animation the part
   * that is optional.
   */
  if (!doc.documentElement.dataset.floatAccordion) {
    doc.documentElement.dataset.floatAccordion = "true";
    const TOGGLE_MS = 260;

    doc.addEventListener("click", (clickEvent) => {
      const FrameElement = doc.defaultView?.Element;
      const view = doc.defaultView;
      if (!FrameElement || !view || !(clickEvent.target instanceof FrameElement)) return;
      const summary = clickEvent.target.closest("details.nav-section > summary");
      if (!summary) return;
      const details = summary.parentElement as HTMLDetailsElement | null;
      const body = details?.querySelector<HTMLElement>(".nav-section-body");
      if (!details || !body) return;

      // Let the browser do its own instant thing when motion is unwanted.
      if (view.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      clickEvent.preventDefault();
      const opening = !details.open;
      if (opening) details.open = true;

      const full = body.scrollHeight;
      const from = opening ? 0 : full;
      const to = opening ? full : 0;

      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        body.style.transition = "";
        body.style.height = "";
        if (!opening) details.open = false;
      };

      body.style.height = `${from}px`;
      view.requestAnimationFrame(() => {
        body.style.transition = `height ${TOGGLE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        body.style.height = `${to}px`;
      });
      body.addEventListener("transitionend", (e) => {
        if (e.propertyName === "height") settle();
      }, { once: true });
      view.setTimeout(settle, TOGGLE_MS + 120);
    }, true);
  }

  /**
   * Mark which section of the page you are actually in.
   *
   * An animated jump only helps if you can see where it put you, and on a long
   * page the rail was a static list that never acknowledged the scroll. This
   * marks the last heading you have passed, so the rail is a position rather
   * than a menu.
   *
   * Guarded by a dataset flag because applyFloatTheme runs on every frame load
   * and a second listener would double every update.
   */
  if (!doc.documentElement.dataset.floatScrollspy) {
    doc.documentElement.dataset.floatScrollspy = "true";
    const links = [...doc.querySelectorAll<HTMLAnchorElement>(".float-page-toc a[href^='#']")];
    if (links.length) {
      const headings = links
        .map((link) => ({ link, el: doc.getElementById(decodeURIComponent(link.hash.slice(1))) }))
        .filter((entry): entry is { link: HTMLAnchorElement; el: HTMLElement } => Boolean(entry.el));

      const mark = () => {
        // The heading nearest the top that is still above the fold line. A
        // fixed offset rather than the exact top edge, so a heading counts as
        // reached once it is comfortably on screen rather than at the instant
        // its first pixel appears.
        const line = scrollWindow.scrollTop + 96;
        let current = headings[0];
        for (const entry of headings) if (entry.el.offsetTop <= line) current = entry;
        for (const entry of headings) {
          entry.link.toggleAttribute("data-current", entry === current);
        }
      };

      let queued = false;
      scrollWindow.addEventListener(
        "scroll",
        () => {
          if (queued) return;
          queued = true;
          doc.defaultView?.requestAnimationFrame(() => {
            queued = false;
            mark();
          });
        },
        { passive: true },
      );
      mark();
    }
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

  const staticSidebar = doc.querySelector<HTMLElement>("#docs-static-sidebar");
  const targets = [scrollWindow, ...(staticSidebar ? [staticSidebar] : [])];
  for (const scrollWindow of targets) {
    const sidebarTrack = scrollWindow === staticSidebar;
    const trackId = sidebarTrack ? "sidebar-scrollbar" : "content-scrollbar";
    if (doc.getElementById(trackId)) continue;
    const scrollbar = doc.createElement("div");
    scrollbar.className = `pixel-frame__scrollbar ${sidebarTrack ? "pixel-frame__scrollbar--sidebar" : ""}`;
    scrollbar.id = trackId;
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
    scrollWindow.addEventListener("toggle", syncScrollbar, true);
  
    const resizeObserver = new ResizeObserver(syncScrollbar);
    resizeObserver.observe(scrollWindow);
    for (const child of scrollWindow.children) resizeObserver.observe(child);
    new MutationObserver(syncScrollbar).observe(scrollWindow, {
      childList: true,
      subtree: true,
    });
    syncScrollbar();
  }
}

export function DocsMirror({
  src = `/mirror?v=${MIRROR_VERSION}`,
}: {
  src?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [headerTabsHost, setHeaderTabsHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Cached iframe documents can finish loading before React attaches onLoad.
    const frame = frameRef.current;
    if (frame?.contentDocument?.readyState === "complete") {
      applyFloatTheme(frame, setHeaderTabsHost);
    }
  }, [src]);

  return (
    <main className="mirror-shell">
      <div className="pixel-blast" aria-hidden="true">
        <BackgroundSquares />
      </div>
      <iframe
        ref={frameRef}
        className="mirror-frame"
        src={src}
        title="Float documentation"
        onLoad={(event) =>
          applyFloatTheme(event.currentTarget, setHeaderTabsHost)
        }
      />
      {headerTabsHost ? createPortal(<HeaderTabs />, headerTabsHost) : null}
    </main>
  );
}

export default function Home() {
  return <DocsMirror />;
}
