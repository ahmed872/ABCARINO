/** Shared shape returned by admin server actions to `useActionState`. */
export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const initialFormState: FormState = { ok: false };
