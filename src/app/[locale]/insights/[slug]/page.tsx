import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/site/CtaBand";
import { Markdown } from "@/components/site/Markdown";
import { PageHero } from "@/components/site/PageHero";
import { JsonLd } from "@/components/site/Primitives";
import { Visual } from "@/components/site/Visual";
import { getArticleCategories, getArticles, getSettings } from "@/lib/content/public";
import { isLocale, tf, tr } from "@/lib/i18n";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getNonce, siteContext } from "@/lib/site";
import { formatDate } from "@/lib/utils";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getSettings();
  const article = (await getArticles()).find((a) => a.slug === slug);
  if (!article || !settings.sections.showInsights) return {};
  return buildMetadata({
    locale,
    settings,
    path: `/insights/${article.slug}`,
    title: tr(locale, article.seoTitleEn, article.seoTitleAr) || tf(locale, article, "title"),
    description: tr(locale, article.seoDescriptionEn, article.seoDescriptionAr) || tf(locale, article, "excerpt"),
    image: article.image,
    type: "article",
    publishedTime: article.publishedAt,
  });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { locale, settings, t } = await siteContext(params);
  if (!settings.sections.showInsights) notFound();
  const { slug } = await params;
  const [articles, cats] = await Promise.all([getArticles(), getArticleCategories()]);
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();
  const nonce = await getNonce();
  const cat = cats.find((c) => c.id === article.categoryId);
  const title = tf(locale, article, "title");
  return (
    <>
      <JsonLd
        nonce={nonce}
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description: tf(locale, article, "excerpt"),
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            inLanguage: locale,
            mainEntityOfPage: absoluteUrl(`/${locale}/insights/${article.slug}`),
            publisher: { "@id": `${absoluteUrl("/")}#organization` },
            ...(article.image ? { image: absoluteUrl(article.image.url) } : {}),
          },
          breadcrumbJsonLd([
            { name: t.nav.home, path: `/${locale}` },
            { name: t.nav.insights, path: `/${locale}/insights` },
            { name: title, path: `/${locale}/insights/${article.slug}` },
          ]),
        ]}
      />
      <PageHero
        eyebrow={`${cat ? `${tf(locale, cat, "name")} · ` : ""}${formatDate(article.publishedAt, locale)}`}
        title={title}
        intro={tf(locale, article, "excerpt")}
        crumbs={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.insights, href: `/${locale}/insights` },
          { label: title },
        ]}
      />
      <article className="bg-paper">
        <div className="container-x py-16 lg:py-24">
          <Visual media={article.image} visualKey={cat?.visualKey ?? "lighting"} uid={`artd-${article.slug}`} locale={locale} priority className="mx-auto aspect-[16/9] max-w-5xl rounded-2xl" sizes="(min-width: 1024px) 1024px, 100vw" />
          <Markdown source={tf(locale, article, "body")} className="mx-auto mt-14 max-w-2xl" />
        </div>
      </article>
      <CtaBand locale={locale} t={t} settings={settings} />
    </>
  );
}
