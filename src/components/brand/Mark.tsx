import type { SVGProps } from "react";

export const MARK_A_PATH = "M19.4 6.5h9.2l12.6 35h-6.6L24 11.6 13.4 41.5H6.8z";
export const MARK_NUQTA_PATH = "M24 24.6l5.3 5.3-5.3 5.3-5.3-5.3z";

/**
 * The ABCARINO mark.
 *
 * An "A" drawn as a light cone: the flat apex is the fixture, the legs are the
 * edges of the light, and the rhombus — an Arabic nuqta — is the intelligent
 * point where everything connects. Letter, light and dot: technology, comfort,
 * and the Arabic root of عبقرينو in one symbol.
 */
export function Mark({
  title,
  tone = "ink",
  ...props
}: SVGProps<SVGSVGElement> & { tone?: "ink" | "paper" | "current"; title?: string }) {
  const fill = tone === "paper" ? "#f4f2ed" : tone === "current" ? "currentColor" : "#0e0f11";
  return (
    <svg viewBox="0 0 48 48" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d={MARK_A_PATH} fill={fill} />
      <path d={MARK_NUQTA_PATH} fill="#ff5b1f" />
    </svg>
  );
}
