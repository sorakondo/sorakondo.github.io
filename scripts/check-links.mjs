// Validate generated local links, assets, and section anchors; no external requests.
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { siteUrl, base } from "../site.config.mjs";
const root = path.resolve("dist");
const errors = [];
let count = 0;
async function walk(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const filename = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walk(filename)));
    else if (ent.name.endsWith(".html")) out.push(filename);
  }
  return out;
}
const basePath = `/${base.split("/").filter(Boolean).join("/")}${base === "/" ? "" : "/"}`;
for (const file of await walk(root)) {
  const html = await readFile(file, "utf8");
  const relative = path.relative(root, file).split(path.sep).join("/");
  const current = new URL(
    basePath + relative.replace(/index\.html$/, ""),
    siteUrl,
  );
  for (const match of html.matchAll(/\b(href|src|poster)="([^"]+)"/g)) {
    const value = match[2].replaceAll("&amp;", "&");
    if (/^(?:data:|mailto:|tel:|javascript:)/.test(value)) continue;
    const target = new URL(value, current);
    if (target.origin !== current.origin) continue;
    count++;
    const pathname = decodeURIComponent(target.pathname);
    if (!pathname.startsWith(basePath)) {
      errors.push(`${relative}: outside base ${value}`);
      continue;
    }
    const local = path.join(root, pathname.slice(basePath.length));
    let resolved = local;
    try {
      if ((await stat(resolved)).isDirectory())
        resolved = path.join(resolved, "index.html");
      await stat(resolved);
    } catch {
      errors.push(`${relative}: missing ${value}`);
      continue;
    }
    if (target.hash && resolved.endsWith(".html")) {
      const source = await readFile(resolved, "utf8");
      const anchor = decodeURIComponent(target.hash.slice(1));
      if (!source.includes(`id="${anchor}"`))
        errors.push(`${relative}: missing anchor ${value}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log(`Checked ${count} local links/assets and anchors.`);
