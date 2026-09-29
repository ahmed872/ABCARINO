import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { Visual } from "@/components/site/Visual";
import { getProjects, getSettings } from "@/lib/content/public";
import { getDictionary, isLocale, tf } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { siteContext } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildMetadata({ locale, settings: await getSettings(), path: "/projects", title: t.projects.eyebrow, description: t.projects.intro });
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, settings, t } = await siteContext(params);
  if (!settings.sections.showProjects) notFound();
  const projects = await getProjects();
  return (
    <>
      <PageHero eyebrow={t.projects.eyebrow} title={t.projects.title} intro={t.projects.intro} />
      <section className="bg-paper">
        <div className="container-x py-20 lg:py-28">
          {!projects.length ? <p className="text-graphite">{t.projects.empty}</p> : null}
          <div className="grid gap-x-6 gap-y-14 md:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/${locale}/projects/${p.slug}`} className="group block" data-reveal>
                <Visual media={p.image} visualKey="living" uid={`prj-${p.slug}`} locale={locale} showLabel={!p.image} className="aspect-[4/3] rounded-2xl" sizes="(min-width: 768px) 50vw, 100vw" />
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h2 className="text-2xl font-medium tracking-tight group-hover:underline">{tf(locale, p, "name")}</h2>
                  {p.completedAt ? <span className="mono shrink-0 text-xs text-stone">{formatDate(p.completedAt, locale)}</span> : null}
                </div>
                <p className="mt-1 text-sm text-stone">{tf(locale, p, "location")}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand locale={locale} t={t} settings={settings} />
    </>
  );
}
