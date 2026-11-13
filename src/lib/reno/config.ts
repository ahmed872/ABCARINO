/**
 * RENO behaviour switches. Change these to tune the experience without touching components.
 */
export const RENO_CONFIG = {
  intro: {
    enabled: true,
    /** "session": once per browser session (default) · "always": every eligible load · "never". */
    frequency: "session" as "session" | "always" | "never",
    /** "home": only when the visitor lands on the home page · "any": on whichever page they land. */
    pages: "home" as "home" | "any",
    /** Automated browsers (WebDriver) skip the intro; ?reno-intro=1 forces it, ?reno-intro=auto applies the normal rules. */
    skipForAutomation: true,
    forceParam: "reno-intro",
    /** Scene start times in ms (total ≈ 6.4 s): portal ignites → jump → time tunnel → arrival → reveal. */
    timeline: { ignite: 1100, jump: 2150, tunnel: 2650, arrive: 4050, reveal: 5650, done: 6400 },
    reducedMotionHoldMs: 1600,
  },
  companion: {
    enabled: true,
    /** Show one idle speech bubble per session after this long without interaction. */
    idleBubbleAfterMs: 25_000,
    idleBubbleForMs: 7_000,
    /** Small pause before RENO answers, so it reads as a reply (shorter with reduced motion). */
    replyDelayMs: 450,
  },
  storage: { intro: "reno:intro", bubble: "reno:bubble", chat: "reno:chat" },
} as const;

export function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* storage blocked: the experience still works, it just won't be remembered */
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
