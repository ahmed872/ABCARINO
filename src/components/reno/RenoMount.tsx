"use client";

import dynamic from "next/dynamic";
import type { RenoProps } from "./RenoExperience";

// RENO's code, artwork and knowledge base load in a separate chunk after the page is
// interactive, so they never delay rendering, LCP or the server HTML.
const RenoExperience = dynamic(() => import("./RenoExperience"), { ssr: false, loading: () => null });

export function RenoMount(props: RenoProps) {
  return <RenoExperience {...props} />;
}
