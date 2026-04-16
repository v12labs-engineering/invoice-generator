"use client";

import { useActionState, useEffect, type FormHTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";
import type { Result } from "@/lib/result";

type ToastFormProps<T> = Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "children"> & {
  action: (prev: Result<T> | null, formData: FormData) => Promise<Result<T>>;
  successMessage?: string | ((data: T) => string);
  errorMessage?: string;
  children: ReactNode | ((state: { pending: boolean }) => ReactNode);
};

export function ToastForm<T>({
  action,
  successMessage,
  errorMessage,
  children,
  ...props
}: ToastFormProps<T>) {
  const [state, formAction, pending] = useActionState<Result<T> | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      const msg =
        typeof successMessage === "function"
          ? successMessage(state.data)
          : successMessage;
      if (msg) toast.success(msg);
    } else {
      toast.error(errorMessage ?? state.error ?? "Something went wrong");
    }
  }, [state, successMessage, errorMessage]);

  return (
    <form {...props} action={formAction}>
      {typeof children === "function" ? children({ pending }) : children}
    </form>
  );
}
