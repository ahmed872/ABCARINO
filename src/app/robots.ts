import type { MetadataRoute } from "next";
import { querySettings } from "@/lib/content/queries";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let allow = true;
  try {
    const settings = await querySettings();
    allow = settings.seo.allowIndexing && !settings.maintenance.enabled;
  } catch {
    allow = false;
  }
  if (!allow) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
