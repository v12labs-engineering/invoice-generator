import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  footer,
  icon: Icon,
  invertDelta,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  footer?: string;
  icon?: ComponentType<LucideProps>;
  /** For expenses etc., where a decrease is good. */
  invertDelta?: boolean;
}) {
  const hasDelta = typeof delta === "number";
  const isUp = hasDelta && delta > 0;
  const isDown = hasDelta && delta < 0;
  const positive = invertDelta ? isDown : isUp;
  const negative = invertDelta ? isUp : isDown;

  return (
    <Card className="gap-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
          {Icon && (
            <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Icon className="size-3.5" />
            </div>
          )}
        </div>
        <CardTitle className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-xs">
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
                positive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                negative && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                !positive && !negative && "bg-muted text-muted-foreground",
              )}
            >
              {isUp && <TrendingUp className="size-3" />}
              {isDown && <TrendingDown className="size-3" />}
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
          {deltaLabel && (
            <span className="text-muted-foreground">{deltaLabel}</span>
          )}
        </div>
        {footer && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{footer}</p>
        )}
      </CardContent>
    </Card>
  );
}
