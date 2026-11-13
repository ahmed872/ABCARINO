"use client";

import { useId, useMemo } from "react";
import { RENO_SVG, RENO_VIEWBOX } from "./art";

export type RenoMood = "chill" | "hello" | "really" | "whoa" | "sip" | "solving";

/** RENO's layered vector artwork. Expressions are switched with `mood` (CSS in reno.css). */
export function RenoArt({
  mood = "chill",
  variant = "full",
  talking = false,
  label,
  className,
}: {
  mood?: RenoMood;
  variant?: "full" | "avatar";
  /** Moves the mouth, for the moment an answer appears. */
  talking?: boolean;
  /** Accessible name; omit for decorative use. */
  label?: string;
  className?: string;
}) {
  const prefix = `reno${useId().replace(/[^a-zA-Z0-9]/g, "")}-`;
  // Static artwork from art.ts (no user input); ids are prefixed per instance.
  const markup = useMemo(() => RENO_SVG.replaceAll("__P__", prefix), [prefix]);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={RENO_VIEWBOX[variant]}
      className={`reno-art${className ? ` ${className}` : ""}`}
      data-mood={mood}
      data-variant={variant}
      data-talk={talking ? "true" : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
