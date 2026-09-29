import Image from "next/image";
import { ConceptVisual } from "@/components/illustrations/ConceptVisual";
import type { PublicMedia } from "@/lib/content/queries";
import { tr, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Uploaded photo when available, otherwise the built-in concept illustration.
 * Photos flagged as inspiration carry a visible label so stock or mood imagery is
 * never presented as ABCARINO's own completed work.
 */
export function Visual({
  media,
  visualKey,
  uid,
  locale,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  className,
  animated,
  showLabel = true,
}: {
  media?: PublicMedia | null;
  visualKey: string;
  uid: string;
  locale: Locale;
  sizes?: string;
  priority?: boolean;
  className?: string;
  animated?: boolean;
  showLabel?: boolean;
}) {
  const t = getDictionary(locale);
  return (
    <div className={cn("relative overflow-hidden bg-ink", className)}>
      {media ? (
        <Image
          src={media.url}
          alt={tr(locale, media.altEn, media.altAr)}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <ConceptVisual visual={visualKey} uid={uid} locale={locale} animated={animated} className="absolute inset-0 h-full w-full" />
      )}
      {showLabel && (!media || media.isInspiration) ? (
        <span className="eyebrow pointer-events-none absolute end-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.62rem] text-paper/75 backdrop-blur-sm">
          {media ? t.common.inspiration : t.common.concept}
        </span>
      ) : null}
    </div>
  );
}
