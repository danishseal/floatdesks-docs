const DOCS_ORIGIN = "https://docs.dottxt.ai";
const LOCAL_ASSET_PREFIX = "/docs-assets";
const THEME_STYLESHEET =
  '<link rel="stylesheet" href="/float-theme.css?v=launchpad-shell-5" data-float-theme="true">';

export async function proxyDocsPage(request: Request, segments: string[]) {
  const requestUrl = new URL(request.url);
  const path = segments.map(encodeURIComponent).join("/");
  const sourceUrl = new URL(`/${path}${requestUrl.search}`, DOCS_ORIGIN);
  const response = await fetch(sourceUrl, {
    headers: { Accept: "text/html" },
    cache: "no-store",
  });

  if (!response.ok) {
    return new Response("Documentation page not found", { status: response.status });
  }

  const html = (await response.text())
    .replaceAll(`${DOCS_ORIGIN}/mintlify-assets/`, `${LOCAL_ASSET_PREFIX}/mintlify-assets/`)
    .replaceAll(`${DOCS_ORIGIN}/_next/`, `${LOCAL_ASSET_PREFIX}/_next/`)
    .replaceAll('href="/mintlify-assets/', `href="${LOCAL_ASSET_PREFIX}/mintlify-assets/`)
    .replaceAll('src="/mintlify-assets/', `src="${LOCAL_ASSET_PREFIX}/mintlify-assets/`)
    .replaceAll('href="/_next/', `href="${LOCAL_ASSET_PREFIX}/_next/`)
    .replaceAll('src="/_next/', `src="${LOCAL_ASSET_PREFIX}/_next/`)
    .replace("</head>", `${THEME_STYLESHEET}</head>`);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
