import type { MetadataRoute } from "next";
import { getPublicCatalog } from "@/lib/public-catalog-server";
import { publicSitemapEntries } from "@/lib/seo";
import { legacySitemapPaths } from "@/lib/legacy-method-placement";
import { algorithms } from "@/lib/catalog";

// New reviewer-approved methods appear automatically; withdrawn methods disappear.
// Do not prerender the sitemap from a stale build-time database snapshot.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { lessons, methods } = await getPublicCatalog();
  return publicSitemapEntries(lessons, methods, legacySitemapPaths(lessons,algorithms));
}
