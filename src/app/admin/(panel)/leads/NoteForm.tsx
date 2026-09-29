"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/lib/admin/form-state";

export function NoteForm({ action }: { action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-2">
      <textarea name="body" rows={3} className="admin-input" placeholder="Call summary, next step, quote sent…" maxLength={4000} />
      {state.errors?.body ? <p className="text-xs text-signal-deep">{state.errors.body}</p> : null}
      {state.message && !state.ok ? <p className="text-xs text-signal-deep">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-60">
        {pending ? "Adding…" : "Add note"}
      </button>
    </form>
  );
}
