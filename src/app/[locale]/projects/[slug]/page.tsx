import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/site/CtaBand";
import { Markdown } from "@/components/site/Markdown";
import { PageHero } from "@/components/site/PageHero";
import { Eyebrow } from "@/components/site/Primitives";
import { Visual } from "@/components/site/Visual";
import { getCatalog, getProjects, getSettings } from "@/lib/content/public";
import { isLocale, tf, tr } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { siteContext } from "@/lib/site";
import { formatDate, videoEmbedUrl } from "@/lib/utils";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getSettings();
  const project = (await getProjects()).find((p) => p.slug === slug);
  if (!project || !settings.sections.showProjects) return {};
  return buildMetadata({
    locale,
    settings,
    path: `/projects/${project.slug}`,
    title: tr(locale, project.seoTitleEn, project.seoTitleAr) || tf(locale, project, "name"),
    description: tr(locale, project.seoDescriptionEn, project.seoDescriptionAr) || tf(locale, project, "description").slice(0, 200),
    image: project.image,
    type: "article",
  });
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { locale, settings, t } = await siteContext(params);
  if (!settings.sections.showProjects) notFound();
  const { slug } = await params;
  const project = (await getProjects()).find((p) => p.slug === slug);
  if (!project) notFound();
  const { solutions } = await getCatalog();
  const used = solutions.filter((s) => project.servicesUsed.includes(s.id));
  const embed = videoEmbedUrl(project.videoUrl);
  const name = tf(locale, project, "name");

  return (
    <>
      <PageHero
        eyebrow={t.projects.eyebrow}
        title={name}
        intro={tf(locale, project, "location")}
        crumbs={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.projects, href: `/${locale}/projects` },
          { label: name },
        ]}
      />
      <section className="bg-paper">
        <div className="container-x py-20 lg:py-28">
          <Visual media={project.image} visualKey="living" uid={`prjd-${project.slug}`} locale={locale} showLabel={!project.image} priority className="aspect-[16/9] rounded-2xl" sizes="100vw" />
          <div className="mt-14 grid gap-14 lg:grid-cols-12">
            <Markdown source={tf(locale, project, "description")} className="lg:col-span-7" />
            <dl className="space-y-6 lg:col-span-4 lg:col-start-9">
              {tf(locale, project, "location") ? (
                <div>
                  <dt className="eyebrow text-stone">{t.projects.location}</dt>
                  <dd className="mt-1">{tf(locale, project, "location")}</dd>
                </div>
              ) : null}
              {project.completedAt ? (
                <div>
                  <dt className="eyebrow text-stone">{t.projects.completed}</dt>
                  <dd className="mt-1">{formatDate(project.completedAt, locale)}</dd>
                </div>
              ) : null}
              {used.length ? (
                <div>
                  <dt className="eyebrow text-stone">{t.projects.services}</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {used.map((s) => (
                      <Link key={s.id} href={`/${locale}/solutions/${s.slug}`} className="rounded-full border border-ink/15 px-3 py-1 text-sm hover:border-ink">
                        {tf(locale, s, "title")}
                      </Link>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
          {embed ? (
            <div className="mt-16">
              <Eyebrow>{t.projects.video}</Eyebrow>
              <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl bg-ink">
                <iframe src={embed} title={name} className="absolute inset-0 h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
              </div>
            </div>
          ) : null}
          {project.gallery.length ? (
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.gallery.map((m) => (
                <figure key={m.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink">
                  <Image src={m.url} alt={tr(locale, m.altEn, m.altAr)} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <CtaBand locale={locale} t={t} settings={settings} />
    </>
  );
}
