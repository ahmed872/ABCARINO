"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import type { RenoProps } from "./RenoExperience";

// RENO's code, artwork and knowledge base load in a separate chunk after the page is
// interactive, so they never delay rendering, LCP or the server HTML.
const RenoExperience = dynamic(() => import("./RenoExperience"), { ssr: false, loading: () => null });

/** RENO is an extra: if anything in it fails (or its chunk can't load), he disappears — the page never does. */
class RenoBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[RENO] disabled after an error:", error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function RenoMount(props: RenoProps) {
  return (
    <RenoBoundary>
      <RenoExperience {...props} />
    </RenoBoundary>
  );
}
