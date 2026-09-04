const DOCS_ORIGIN = "https://docs.dottxt.ai";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const requestUrl = new URL(request.url);
  const sourceUrl = new URL(
    `/${path.map(encodeURIComponent).join("/")}${requestUrl.search}`,
    DOCS_ORIGIN,
  );
  const response = await fetch(sourceUrl, {
    next: { revalidate: 86400 },
  });

  if (!response.ok || !response.body) {
    return new Response("Documentation asset not found", { status: response.status });
  }

  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
