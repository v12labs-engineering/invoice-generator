"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type DataPoint = { month: string; label: string; issued: number; paid: number };

const config: ChartConfig = {
  issued: { label: "Invoiced", color: "#7C3AED" },
  paid: { label: "Collected", color: "#2563EB" },
};

export function RevenueChart({
  data,
  currency,
}: {
  data: DataPoint[];
  currency: string;
}) {
  const dollars = data.map((d) => ({
    ...d,
    issued: d.issued / 100,
    paid: d.paid / 100,
  }));

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={dollars} margin={{ left: 12, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fillIssued" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-issued)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-issued)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillPaid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-paid)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-paid)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_val, payload) => payload?.[0]?.payload?.label ?? ""}
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {name === "issued" ? "Invoiced" : "Collected"}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="issued"
          type="monotone"
          stroke="var(--color-issued)"
          fill="url(#fillIssued)"
          strokeWidth={2}
          stackId="a"
        />
        <Area
          dataKey="paid"
          type="monotone"
          stroke="var(--color-paid)"
          fill="url(#fillPaid)"
          strokeWidth={2}
          stackId="b"
        />
      </AreaChart>
    </ChartContainer>
  );
}
