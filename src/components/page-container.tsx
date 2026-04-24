import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6", className)}>
      {children}
    </div>
  );
}
