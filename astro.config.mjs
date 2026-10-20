import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import { siteUrl, base } from "./site.config.mjs";
export default defineConfig({
  site: siteUrl,
  base,
  output: "static",
  trailingSlash: "always",
  integrations: [mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    syntaxHighlight: { type: "shiki", excludeLangs: ["math", "mermaid"] },
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
        [
          rehypeMermaid,
          {
            strategy: "img-svg",
            launchOptions: { args: ["--no-sandbox"] },
            mermaidConfig: { theme: "neutral", securityLevel: "strict" },
          },
        ],
      ],
    }),
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: false,
      langs: [
        "python",
        "c",
        "cpp",
        "typescript",
        "bash",
        "powershell",
        "verilog",
      ],
    },
  },
});
