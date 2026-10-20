// Run after pnpm build, with pnpm preview running. Optional first arg: base URL.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const origin = process.argv[2] || "http://127.0.0.1:4321/";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const failures = [];
  page.on("pageerror", (e) => failures.push(e.message));
  for (const route of [
    "",
    "about/",
    "research/",
    "projects/",
    "blog/",
    "blog/python-gds-klayout-klive/",
    "blog/klayout-dark-mode/",
    "tags/KLayout/",
    "search/",
  ]) {
    const response = await page.goto(new URL(route, origin).href);
    assert.equal(response.status(), 200, route);
    assert.equal(await page.locator("h1").count(), 1, route);
  }
  await page.goto(new URL("blog/python-gds-klayout-klive/", origin).href);
  assert.ok(await page.locator("pre.astro-code").count());
  await page.locator(".toc a").first().click();
  assert.ok(new URL(page.url()).hash);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "",
      "blog/python-gds-klayout-klive/",
      "blog/",
      "search/",
    ]) {
      await page.goto(new URL(route, origin).href);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `horizontal overflow ${route} at ${width}`,
      );
    }
  }
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(origin);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.locator("#theme-toggle").click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.locator("#theme-toggle").click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.locator("#theme-toggle").click();
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.goto(new URL("search/", origin).href);
  await page.waitForSelector(".pagefind-ui__search-input");
  for (const term of ["KLayout", "Python", "GDS", "KLive"]) {
    await page.locator(".pagefind-ui__search-input").fill(term);
    await page.waitForTimeout(1500);
    assert.ok(
      await page.locator(".pagefind-ui__result-link").count(),
      `No search result: ${term}`,
    );
    const href = await page
      .locator(".pagefind-ui__result-link")
      .first()
      .getAttribute("href");
    assert.ok(
      new URL(href, origin).pathname.startsWith(new URL(origin).pathname),
      "Search result outside base",
    );
    const result = await page.evaluate(
      async ({ base, term }) => {
        const pf = await import(`${base}pagefind/pagefind.js`);
        return (await pf.search(term)).results.length;
      },
      { base: origin, term },
    );
    assert.ok(result, `Index search failed: ${term}`);
    console.log(`Search ${term}: ${result} indexed page(s)`);
  }
  const indexed = await page.evaluate(async (base) => {
    const pf = await import(`${base}pagefind/pagefind.js`);
    const all = await pf.search(null);
    const data = await Promise.all(all.results.map((r) => r.data()));
    return data.map((d) => ({ url: d.url, title: d.meta.title }));
  }, origin);
  assert.ok(indexed.length === 2);
  assert.ok(indexed.every((p) => /\/blog\//.test(p.url)));
  assert.ok(indexed.every((p) => !p.title.includes("DRAFT_SENTINEL")));
  const draft = await page.goto(new URL("blog/draft-example/", origin).href);
  assert.equal(draft.status(), 404);
  const rss = await (
    await page.request.get(new URL("rss.xml", origin).href)
  ).text();
  assert.ok(!rss.includes("DRAFT_SENTINEL"));
  const sitemap = await (
    await page.request.get(new URL("sitemap-0.xml", origin).href)
  ).text();
  assert.ok(!sitemap.includes("draft-example"));
  assert.ok(!sitemap.includes("DraftOnly"));
  assert.deepEqual(failures, []);
  console.log(
    "Verified routes, code blocks, TOC, responsive widths, themes, search, draft exclusion.",
  );
} finally {
  await browser.close();
}
