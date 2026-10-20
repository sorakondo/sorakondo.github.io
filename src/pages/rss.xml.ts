import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { allPosts, postUrl } from "../lib/content";
import { profile } from "../site";
export async function GET(context: APIContext) {
  return rss({
    title: `${profile.name} — Blog`,
    description: profile.description,
    site: context.site!,
    items: (await allPosts()).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(post),
      categories: post.data.tags,
    })),
    customData: "<language>ja</language>",
  });
}
