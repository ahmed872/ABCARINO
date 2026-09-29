import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Mark } from "@/components/brand/Mark";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <Mark tone="paper" className="h-9 w-9" />
          <span className="text-sm font-semibold" style={{ letterSpacing: "0.18em" }}>
            ABCARINO
          </span>
        </div>
        <div>
          <p className="eyebrow text-paper/40">Content & operations</p>
          <p className="display-3 mt-4 max-w-md">Manage the website without touching code.</p>
        </div>
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-glow/10 blur-[120px]" />
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Mark className="h-10 w-10 lg:hidden" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight lg:mt-0">Sign in</h1>
          <p className="mt-1 text-sm text-stone">Authorized team members only.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
