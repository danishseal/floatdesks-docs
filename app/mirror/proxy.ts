import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked, Renderer } from "marked";

const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Verification marks.
 *
 * Three states, and the distinction is the whole point of them:
 *   live   the claim was checked against chain state and holds today
 *   built  the code is deployed, but nothing has exercised it with real value
 *   todo   described here and not deployed, or deployed and known wrong
 *
 * "built" is not a softer "live". A mechanism can be flawless and hold nothing,
 * which is exactly the state the reserve is in, and collapsing those two into
 * one green mark would hide the only thing a reader needs to know.
 *
 * Marks are written in the markdown as {{live:...}} inline, or a whole-line
 * {{status:live|note}} chip under a heading. Substitution happens on the
 * markdown BEFORE marked sees it, so the marked text still parses as markdown
 * and a mark can wrap bold, links or a whole sentence that wraps lines.
 *
 * Fenced code is excluded by splitting on fences and only substituting the odd
 * chunks. Without that, a {{...}} appearing in a Solidity sample would be
 * rewritten into HTML inside a <pre>, which is both wrong and invisible until
 * someone reads that one code block.
 */
const MARK_LABEL: Record<string, string> = { live: "verified", built: "built, unexercised", todo: "outstanding" };
export function annotate(markdown: string) {
  const chunks = markdown.split(/(^```[\s\S]*?^```)/m);
  return chunks.map((chunk, i) => {
    if (i % 2) return chunk;
    return chunk
      .replace(/^\{\{status:(live|built|todo)\|([\s\S]*?)\}\}$/gm,
        (_m, kind: string, note: string) =>
          `<p class="fx-chip fx-chip--${kind}"><span class="fx-chip__dot"></span><span class="fx-chip__kind">${MARK_LABEL[kind]}</span><span class="fx-chip__note">${note.trim()}</span></p>`)
      .replace(/\{\{(live|built|todo):([\s\S]*?)\}\}/g,
        (_m, kind: string, body: string) => `<mark class="fx fx--${kind}">${body}</mark>`);
  }).join("");
}

export async function proxyDocsPage(_request: Request, segments: string[]) {
  const source = await readFile(path.join(process.cwd(), "content/float.md"), "utf8");
  const pages: { title: string; slug: string; group: string; markdown: string }[] = [];
  let group = "Overview";
  let fenced = false;
  for (const line of source.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    if (!fenced && line.startsWith("# Part ")) {
      group = line.slice(2);
      continue;
    }
    if (!fenced && (line === "# Float" || line.startsWith("## "))) {
      const title = line.replace(/^#+ /, "");
      pages.push({ title, slug: title === "Float" ? "" : slugify(title.replace(/^\d+\. /, "")), group, markdown: `# ${title}\n` });
    } else if (pages.length) {
      pages[pages.length - 1].markdown += `${line}\n`;
    }
  }
  const requested = segments.join("/");
  const index = pages.findIndex((page) => page.slug === (requested === "index" || requested === "index.html" ? "" : requested));
  if (index === -1) return new Response("Documentation page not found", { status: 404 });
  const page = pages[index];
  const headings: { title: string; id: string }[] = [];
  const renderer = new Renderer();
  renderer.heading = function ({ tokens, depth, text }) {
    const id = slugify(text);
    if (depth > 1) headings.push({ title: text, id });
    return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>`;
  };
  const article = marked.parse(annotate(page.markdown), { renderer, async: false });
  const groups = [...new Set(pages.map((entry) => entry.group))];
  const groupIcons = [
    '<circle cx="12" cy="12" r="8"/><path d="M12 7v6m0 3v1"/>',
    '<path d="m12 3 8 4v10l-8 4-8-4V7Zm0 8 8-4M12 11 4 7m8 4v10"/>',
    '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m10 8-3 4 3 4m4-8 3 4-3 4"/>',
    '<path d="M5 20V10m7 10V4m7 16v-7M3 20h18"/>',
  ];
  const navigation = groups.map((group, groupIndex) => {
    const links = pages.filter((entry) => entry.group === group).map((entry) =>
      `<a class="nav-anchor" href="/${entry.slug}" ${entry === page ? 'aria-current="page"' : ""}>${escape(entry.title === "Float" ? "Introduction" : entry.title)}</a>`,
    ).join("");
    return group === "Overview"
      ? `<p class="nav-group">${escape(group)}</p>${links}`
      : `<details class="nav-section" data-group="${escape(group)}"><summary class="nav-group"><span class="nav-section-icon nav-section-icon--${groupIndex}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${groupIcons[groupIndex - 1]}</svg></span><span class="nav-section-label">${escape(group)}</span><span class="nav-plus" aria-hidden="true"></span></summary><div class="nav-section-body">${links}</div></details>`;
  }).join("");
  const neighbor = (offset: number, label: string) => {
    const entry = pages[index + offset];
    return entry ? `<a href="/${entry.slug}">${label}<br>${escape(entry.title)}</a>` : "<span></span>";
  };
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="icon" type="image/png" href="/sailboat-white-300_1_1.png"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(page.title)} · Float Docs</title><link rel="stylesheet" href="/float-theme.css?v=float-v2-header-match-1" data-float-theme="true"><link rel="stylesheet" href="/float-content.css?v=float-v2-header-match-1"></head><body><div class="relative antialiased"><header id="navbar"><a class="nav-logo" href="/" aria-label="Float documentation home"><span class="float-logo-tile"><img src="/sailboat-white-300_1_1.png" alt="" width="44" height="44"></span><span>Float</span></a><span>Documentation · v2.0</span><details class="mobile-navigation"><summary>Sections</summary>${navigation}</details></header><div><nav id="sidebar"><div id="sidebar-content"><div id="navigation-items">${navigation}</div></div></nav><main id="content-container"><div class="docs-layout"><article><p class="eyebrow">${escape(page.group)}</p>${article}<nav class="page-navigation" aria-label="Adjacent pages">${neighbor(-1, "← Previous")}${neighbor(1, "Next →")}</nav></article><aside class="float-page-toc" aria-label="On this page">${headings.length ? `<p>On this page</p>${headings.map((heading) => `<a href="#${heading.id}">${escape(heading.title)}</a>`).join("")}` : ""}</aside></div></main></div></div></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, max-age=0" },
  });
}
