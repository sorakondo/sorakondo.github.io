import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
const metadata = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(true),
  })
  .refine((data) => !data.updatedDate || data.updatedDate >= data.pubDate, {
    message: "updatedDate must be on or after pubDate",
  });
const collection = (name: string) =>
  defineCollection({
    loader: glob({
      base: `./src/content/${name}`,
      pattern: "**/*.{md,mdx}",
      generateId: ({ entry }) => {
        const id = entry.replace(/\.(md|mdx)$/, "");
        if (!/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(id))
          throw new Error(`Use a lowercase ASCII file slug: ${entry}`);
        return id;
      },
    }),
    schema: metadata,
  });
export const collections = {
  articles: collection("articles"),
  notes: collection("notes"),
  projects: defineCollection({
    loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(true),
      repository: z.url().optional(),
      demo: z.url().optional(),
    }),
  }),
};
