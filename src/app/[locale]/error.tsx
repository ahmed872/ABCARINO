"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const ar = typeof document !== "undefined" && document.documentElement.lang === "ar";
  return (
    <section className="bg-ink text-paper">
      <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-24">
        <h1 className="display-3">{ar ? "حدث خطأ ما." : "Something went wrong."}</h1>
        <p className="lead mt-4 text-paper/60">{ar ? "يُرجى المحاولة بعد لحظات." : "Please try again in a moment."}</p>
        <button type="button" onClick={reset} className="mt-8 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink">
          {ar ? "حاول مرة أخرى" : "Try again"}
        </button>
      </div>
    </section>
  );
}
