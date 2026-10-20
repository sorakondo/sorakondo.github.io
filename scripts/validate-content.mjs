import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../src/content/", import.meta.url));
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(file)));
    else if (/\.mdx?$/.test(entry.name)) out.push(file);
  }
  return out;
}
for (const collection of ["articles", "notes", "projects"]) {
  const dir = path.join(root, collection);
  const ids = new Set();
  for (const filename of await walk(dir)) {
    const id = path
      .relative(dir, filename)
      .split(path.sep)
      .join("/")
      .replace(/\.mdx?$/, "");
    if (!/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(id))
      throw new Error(`Invalid file slug: ${filename}`);
    if (ids.has(id))
      throw new Error(`Duplicate Markdown / MDX URL: ${collection}/${id}`);
    ids.add(id);
  }
}
console.log("Content filenames and URL collisions checked.");
