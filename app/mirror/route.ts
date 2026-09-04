import { proxyDocsPage } from "./proxy";

export function GET(request: Request) {
  return proxyDocsPage(request, []);
}
