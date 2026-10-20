import { getCollection, type CollectionEntry } from "astro:content";
export type Post = CollectionEntry<"articles"> | CollectionEntry<"notes">;
export const url = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
export const postUrl = (post: Post) => url(`${post.collection}/${post.id}/`);
export const date = (value: Date) => value.toISOString().slice(0, 10);
export async function posts(kind: "articles" | "notes") {
  return (await getCollection(kind, ({ data }) => !data.draft)).sort(
    (a, b) =>
      b.data.pubDate.getTime() - a.data.pubDate.getTime() ||
      a.id.localeCompare(b.id),
  );
}
export async function allPosts() {
  return [...(await posts("articles")), ...(await posts("notes"))].sort(
    (a, b) =>
      b.data.pubDate.getTime() - a.data.pubDate.getTime() ||
      a.id.localeCompare(b.id),
  );
}
export const tagUrl = (tag: string) => url(`tags/${encodeURIComponent(tag)}/`);
