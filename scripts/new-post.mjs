import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { mkdir, open, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
export async function newPost() {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const title = (await rl.question("Title: ")).trim();
    if (!title) throw new Error("タイトルは必須です。");
    const suggested = title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug =
      (
        await rl.question(
          `Slug (英小文字・数字・ハイフン)${suggested ? ` [${suggested}]` : ""}: `,
        )
      ).trim() || suggested;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw new Error("有効な英数字slugを入力してください。");
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(slug))
      throw new Error("Windowsの予約ファイル名はslugに使えません。");
    const tags = (await rl.question("Tags (カンマ区切り): "))
      .split(/[,、]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const dir = fileURLToPath(
      new URL(`../src/content/blog/`, import.meta.url),
    );
    await mkdir(dir, { recursive: true });
    // MDXとMarkdownが同じURLになるケースも拒否する。
    const files = await readdir(dir);
    if (files.includes(`${slug}.md`) || files.includes(`${slug}.mdx`))
      throw new Error("同じslugのファイルが既に存在します。");
    const today = new Date().toISOString().slice(0, 10);
    const content = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(title + "についてのメモ")}\npubDate: ${today}\ntags: ${JSON.stringify([...new Set(tags)])}\ndraft: true\n---\n\n## はじめに\n\nここに本文を書きます。\n`;
    const filename = path.join(dir, `${slug}.md`);
    const handle = await open(filename, "wx");
    try {
      await handle.writeFile(content, "utf8");
    } finally {
      await handle.close();
    }
    console.log(`Created: ${path.relative(process.cwd(), filename)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}
