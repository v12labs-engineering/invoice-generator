"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function FormSubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
