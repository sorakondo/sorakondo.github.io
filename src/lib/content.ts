import { getCollection, type CollectionEntry } from "astro:content";
export type Post = CollectionEntry<"blog">;
export const url = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
export const postUrl = (post: Post) => url(`${post.collection}/${post.id}/`);
export const date = (value: Date) => value.toISOString().slice(0, 10);
export async function posts() {
  return (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) =>
      b.data.pubDate.getTime() - a.data.pubDate.getTime() ||
      a.id.localeCompare(b.id),
  );
}
export const allPosts = posts;
export const tagUrl = (tag: string) => url(`tags/${encodeURIComponent(tag)}/`);
