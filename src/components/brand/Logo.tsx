import Image from "next/image";
import { Mark } from "./Mark";
import { cn } from "@/lib/utils";
import type { PublicMedia } from "@/lib/content/queries";

type Props = {
  locale: "en" | "ar";
  tone?: "ink" | "paper";
  /** Optional uploaded logo (Settings → General) replacing the built-in lockup. */
  custom?: PublicMedia | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

/** Primary lockup: mark + wordmark. The Latin spelling is always ABCARINO. */
export function Logo({ locale, tone = "ink", custom, className, size = "md" }: Props) {
  if (custom) {
    return (
      <Image
        src={custom.url}
        alt="ABCARINO"
        width={custom.width}
        height={custom.height}
        className={cn("h-8 w-auto", className)}
        priority
      />
    );
  }
  const markSize = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const text = size === "lg" ? "text-xl" : size === "sm" ? "text-[0.8rem]" : "text-[0.95rem]";
  return (
    <span className={cn("inline-flex items-center gap-2.5", tone === "paper" ? "text-paper" : "text-ink", className)}>
      <Mark tone={tone} className={cn(markSize, "shrink-0")} />
      <span className="flex flex-col leading-none">
        <span dir="ltr" className={cn("font-[600] tracking-[0.18em]", text)} style={{ letterSpacing: "0.18em" }}>
          ABCARINO
        </span>
        {locale === "ar" ? (
          <span className="mt-1 text-[0.72rem] font-medium opacity-70" lang="ar">
            عبقرينو
          </span>
        ) : null}
      </span>
    </span>
  );
}
