import { Badge } from "@/components/ui/badge";

export type EffectiveStatus = "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "VOID" | "OVERDUE";

export function effectiveStatus(inv: { status: string; dueDate: Date; balance: number }): EffectiveStatus {
  if ((inv.status === "SENT" || inv.status === "PARTIAL") && inv.balance > 0 && inv.dueDate < new Date()) {
    return "OVERDUE";
  }
  return inv.status as EffectiveStatus;
}

export function StatusBadge({ status }: { status: EffectiveStatus }) {
  const variant: Record<EffectiveStatus, "secondary" | "default" | "outline" | "destructive"> = {
    DRAFT: "secondary",
    SENT: "default",
    PARTIAL: "default",
    PAID: "default",
    VOID: "outline",
    OVERDUE: "destructive",
  };
  return <Badge variant={variant[status]}>{status}</Badge>;
}
