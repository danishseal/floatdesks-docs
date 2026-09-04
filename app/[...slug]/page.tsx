import { DocsMirror } from "../page";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = slug.map(encodeURIComponent).join("/");
  return <DocsMirror src={`/mirror/${path}?v=launchpad-shell-5`} />;
}
