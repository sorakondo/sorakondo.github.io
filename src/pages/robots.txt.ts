import type { APIContext } from "astro";
import { url } from "../lib/content";
export function GET({ site }: APIContext) {
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${new URL(url("sitemap-index.xml"), site)}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
