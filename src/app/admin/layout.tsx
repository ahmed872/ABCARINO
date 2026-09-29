import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { fontVariables } from "../fonts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin — ABCARINO", template: "%s — ABCARINO Admin" },
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = { themeColor: "#0e0f11", width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVariables}>
      <body className="min-h-dvh bg-paper-2/60 text-ink">{children}</body>
    </html>
  );
}
