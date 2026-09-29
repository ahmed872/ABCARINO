"use client";

import { useEffect } from "react";

/**
 * Last-resort error screen (errors in a root layout, e.g. the database is
 * unreachable). Renders its own document, so styles are inline and it shows
 * both languages. Details are logged on the server, never shown to visitors.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", background: "#0e0f11", color: "#f4f2ed", fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Tahoma, Arial, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <title>ABCARINO</title>
        <main style={{ maxWidth: 520, textAlign: "center" }}>
          <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden>
            <path d="M19.4 6.5h9.2l12.6 35h-6.6L24 11.6 13.4 41.5H6.8z" fill="#f4f2ed" />
            <path d="M24 24.6l5.3 5.3-5.3 5.3-5.3-5.3z" fill="#ff5b1f" />
          </svg>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: "32px 0 8px" }}>We’ll be right back.</h1>
          <p style={{ color: "rgba(244,242,237,.6)", lineHeight: 1.6, margin: 0 }}>The website is temporarily unavailable. Please try again in a moment.</p>
          <p dir="rtl" lang="ar" style={{ color: "rgba(244,242,237,.6)", lineHeight: 1.9, margin: "20px 0 0" }}>
            الموقع غير متاح مؤقتًا. يُرجى المحاولة مرة أخرى بعد لحظات.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 32, background: "#f4f2ed", color: "#0e0f11", border: 0, borderRadius: 999, padding: "12px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Try again · حاول مرة أخرى
          </button>
          {error.digest ? <p style={{ marginTop: 40, fontSize: 11, fontFamily: "ui-monospace, monospace", color: "rgba(244,242,237,.3)" }}>ref {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}
