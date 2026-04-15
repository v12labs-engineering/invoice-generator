import { Badge } from "@/components/ui/badge";

export type EffectiveStatus = "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "VOID" | "OVERDUE";

export function effectiveStatus(inv: { status: string; dueDate: Date; balance: number }): EffectiveStatus {
  if ((inv.status === "SENT" || inv.status === "PARTIAL") && inv.balance > 0 && inv.dueDate < new Date()) {
    return "OVERDUE";
  }
  return inv.status as EffectiveStatus;
}

const styles: Record<EffectiveStatus, { variant: "secondary" | "default" | "outline" | "destructive"; className?: string }> = {
  DRAFT: { variant: "secondary" },
  SENT: { variant: "outline", className: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  PARTIAL: { variant: "outline", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  PAID: { variant: "outline", className: "border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-400" },
  VOID: { variant: "outline", className: "text-muted-foreground" },
  OVERDUE: { variant: "destructive" },
};

export function StatusBadge({ status }: { status: EffectiveStatus }) {
  const s = styles[status];
  return <Badge variant={s.variant} className={s.className}>{status}</Badge>;
}
