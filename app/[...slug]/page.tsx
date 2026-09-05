import { DocsMirror } from "../page";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = slug.map(encodeURIComponent).join("/");
  return <DocsMirror src={`/mirror/${path}?v=float-v2-header-tabs-1`} />;
}
