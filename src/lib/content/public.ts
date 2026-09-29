import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  queryArticleCategories,
  queryArticles,
  queryCatalog,
  queryMediaById,
  queryPartners,
  queryProjects,
  querySettings,
} from "./queries";

/**
 * Cached public read-models. Admin mutations call `revalidatePublicContent()`,
 * so the site stays fast (no DB round-trip per page view) yet updates instantly.
 */
export const CONTENT_TAG = "public-content";

const opts = { tags: [CONTENT_TAG], revalidate: 3600 };

export const getSettings = cache(unstable_cache(querySettings, ["settings"], opts));
export const getCatalog = cache(unstable_cache(queryCatalog, ["catalog"], opts));
export const getProjects = cache(unstable_cache(queryProjects, ["projects"], opts));
export const getPartners = cache(unstable_cache(queryPartners, ["partners"], opts));
export const getArticleCategories = cache(unstable_cache(queryArticleCategories, ["article-categories"], opts));
// Short TTL so scheduled articles go live close to their publish time.
export const getArticles = cache(
  unstable_cache(() => queryArticles(), ["articles"], { tags: [CONTENT_TAG], revalidate: 300 }),
);
export const getMedia = cache((id: string) => unstable_cache(() => queryMediaById(id), ["media", id], opts)());
