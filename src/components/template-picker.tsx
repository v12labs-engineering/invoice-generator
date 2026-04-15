"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type TemplateId = "CLASSIC" | "MODERN" | "MINIMAL";

const OPTIONS: { id: TemplateId; name: string; description: string }[] = [
  { id: "CLASSIC", name: "Classic", description: "Timeless, structured, bordered." },
  { id: "MODERN", name: "Modern", description: "Brand gradient, bold header." },
  { id: "MINIMAL", name: "Minimal", description: "Heavy whitespace, large number." },
];

function Thumb({ id }: { id: TemplateId }) {
  if (id === "CLASSIC") {
    return (
      <div className="flex size-full flex-col gap-1 p-2">
        <div className="flex justify-between">
          <div className="h-1.5 w-10 bg-foreground" />
          <div className="h-1.5 w-8 bg-foreground" />
        </div>
        <div className="h-0.5 w-6 bg-muted-foreground/60" />
        <div className="mt-1 h-0.5 w-full bg-border" />
        <div className="h-0.5 w-full bg-border/60" />
        <div className="h-0.5 w-full bg-border/60" />
        <div className="h-0.5 w-full bg-border/60" />
        <div className="mt-auto flex justify-end">
          <div className="h-1 w-10 bg-foreground" />
        </div>
      </div>
    );
  }
  if (id === "MODERN") {
    return (
      <div className="flex size-full flex-col">
        <div className="h-1.5" style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }} />
        <div className="flex flex-1 flex-col gap-1 p-2">
          <div className="flex justify-between">
            <div className="h-1.5 w-8 bg-foreground" />
            <div className="h-2 w-10 rounded-sm bg-primary" />
          </div>
          <div className="mt-1 rounded-sm bg-muted p-1">
            <div className="h-0.5 w-6 bg-muted-foreground/60" />
            <div className="mt-0.5 h-1 w-10 bg-foreground" />
          </div>
          <div className="mt-1 h-1 w-full bg-foreground" />
          <div className="h-0.5 w-full bg-border" />
          <div className="h-0.5 w-full bg-border" />
          <div className="mt-auto rounded-sm bg-muted p-1">
            <div className="ml-auto h-1 w-10 bg-primary" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex size-full flex-col gap-1 p-3">
      <div className="flex justify-between">
        <div className="h-1.5 w-6 bg-foreground" />
        <div className="h-0.5 w-4 bg-muted-foreground/40" />
      </div>
      <div className="mt-3 h-4 w-14 bg-foreground" />
      <div className="mt-auto h-0.5 w-full bg-foreground" />
      <div className="h-0.5 w-full bg-border/60" />
      <div className="h-0.5 w-full bg-border/60" />
      <div className="ml-auto h-1.5 w-10 bg-foreground" />
    </div>
  );
}

export function TemplatePicker({
  name = "template",
  defaultValue,
}: {
  name?: string;
  defaultValue?: TemplateId | null;
}) {
  const [selected, setSelected] = useState<TemplateId>(defaultValue ?? "CLASSIC");

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-md border bg-card text-left transition-all",
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-foreground/30",
              )}
            >
              {active && (
                <div className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </div>
              )}
              <div className="aspect-[4/5] w-full border-b bg-background">
                <Thumb id={opt.id} />
              </div>
              <div className="space-y-0.5 p-3">
                <div className="text-sm font-medium">{opt.name}</div>
                <div className="text-xs text-muted-foreground">{opt.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
