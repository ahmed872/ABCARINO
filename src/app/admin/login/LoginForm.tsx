"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="admin-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="admin-input" />
      </div>
      <div>
        <label htmlFor="password" className="admin-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="admin-input" />
      </div>
      <div aria-live="polite">{state.error ? <p className="rounded-lg bg-signal/10 px-3 py-2 text-sm text-signal-deep">{state.error}</p> : null}</div>
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-lg bg-ink text-sm font-medium text-paper transition-colors hover:bg-ink-3 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
