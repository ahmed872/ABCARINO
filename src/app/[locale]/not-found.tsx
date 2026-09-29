import Link from "next/link";
import { headers } from "next/headers";
import { Mark } from "@/components/brand/Mark";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function NotFound() {
  const path = (await headers()).get("x-pathname") ?? "";
  const seg = path.split("/")[1];
  const locale = isLocale(seg) ? seg : "en";
  const t = getDictionary(locale);
  return (
    <section className="bg-ink text-paper">
      <div className="container-x flex min-h-[70vh] flex-col items-start justify-center py-24">
        <Mark tone="paper" className="h-12 w-12" />
        <p className="eyebrow mt-10 text-paper/40">404</p>
        <h1 className="display-2 mt-4 max-w-3xl">{t.notFound.title}</h1>
        <p className="lead mt-6 max-w-xl text-paper/60">{t.notFound.text}</p>
        <Link href={`/${locale}`} className="mt-10 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink">
          {t.notFound.home}
        </Link>
      </div>
    </section>
  );
}
