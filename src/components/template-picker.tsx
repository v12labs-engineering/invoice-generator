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
      <div className="flex size-full flex-col gap-1.5 bg-white p-2.5 text-[6px] text-slate-900">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="font-bold">Acme Inc.</div>
            <div className="text-slate-400">123 Market St</div>
            <div className="text-slate-400">billing@acme.io</div>
          </div>
          <div className="text-right">
            <div className="font-bold">INVOICE</div>
            <div className="text-slate-400">#INV-0042</div>
            <div className="text-slate-400">Due 15 May</div>
          </div>
        </div>
        <div className="mt-1 space-y-0.5">
          <div className="text-[5px] uppercase text-slate-400">Bill to</div>
          <div className="font-semibold">Globex Corp</div>
        </div>
        <div className="mt-1 border-t border-slate-300">
          <div className="flex justify-between border-b border-slate-200 py-0.5 text-[5px] font-bold">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-0.5">
            <span>Consulting</span>
            <span>$1,200</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 py-0.5">
            <span>Design</span>
            <span>$800</span>
          </div>
        </div>
        <div className="ml-auto mt-1 w-1/2 border-t border-black pt-0.5 text-right font-bold">
          Total $2,000
        </div>
      </div>
    );
  }
  if (id === "MODERN") {
    return (
      <div className="flex size-full flex-col bg-white text-[6px] text-slate-900">
        <div
          className="h-1"
          style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}
        />
        <div className="flex flex-1 flex-col gap-1.5 p-2.5">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="font-bold">Acme Inc.</div>
              <div className="text-slate-400">billing@acme.io</div>
            </div>
            <div className="text-right">
              <div className="text-[5px] uppercase tracking-wider text-slate-400">Invoice</div>
              <div className="text-[10px] font-bold leading-none" style={{ color: "#2563eb" }}>
                #0042
              </div>
              <div className="mt-0.5 flex gap-1.5 text-[5px]">
                <span className="text-slate-400">Due</span>
                <span className="font-bold">15 May</span>
              </div>
            </div>
          </div>
          <div className="border-l-2 bg-slate-50 p-1" style={{ borderColor: "#2563eb" }}>
            <div className="text-[5px] uppercase text-slate-400">Bill to</div>
            <div className="font-bold">Globex Corp</div>
          </div>
          <div className="mt-0.5">
            <div className="flex justify-between bg-slate-900 px-1 py-0.5 text-[5px] font-bold text-white">
              <span>DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 px-1 py-0.5">
              <span>Consulting</span>
              <span>$1,200</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 px-1 py-0.5">
              <span>Design</span>
              <span>$800</span>
            </div>
          </div>
          <div className="ml-auto mt-auto w-1/2 bg-slate-50 p-1">
            <div className="flex justify-between font-bold" style={{ color: "#2563eb" }}>
              <span>Total</span>
              <span>$2,000</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex size-full flex-col gap-1.5 bg-white p-3 text-[6px] text-slate-900">
      <div className="flex items-start justify-between">
        <div className="font-bold">Acme Inc.</div>
        <div className="text-[5px] uppercase tracking-widest text-slate-400">Invoice</div>
      </div>
      <div className="mt-2">
        <div className="text-[14px] font-light leading-none tracking-tight">#0042</div>
        <div className="mt-1.5 flex gap-3 text-[5px]">
          <div>
            <div className="uppercase text-slate-400">Issued</div>
            <div>15 Apr</div>
          </div>
          <div>
            <div className="uppercase text-slate-400">Due</div>
            <div>15 May</div>
          </div>
        </div>
      </div>
      <div className="mt-1 flex gap-3">
        <div>
          <div className="text-[5px] uppercase text-slate-400">From</div>
          <div>Acme Inc.</div>
        </div>
        <div>
          <div className="text-[5px] uppercase text-slate-400">Bill to</div>
          <div className="font-semibold">Globex</div>
        </div>
      </div>
      <div className="mt-1 border-t border-slate-900">
        <div className="flex justify-between border-b border-slate-100 py-0.5">
          <span>Consulting</span>
          <span>$1,200</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-0.5">
          <span>Design</span>
          <span>$800</span>
        </div>
      </div>
      <div className="ml-auto mt-auto flex w-2/3 justify-between border-t border-slate-900 pt-0.5 text-[8px] font-bold">
        <span>Total</span>
        <span>$2,000</span>
      </div>
    </div>
  );
}

export function TemplatePicker({
  name = "template",
  defaultValue,
  value,
  onChange,
}: {
  name?: string;
  defaultValue?: TemplateId | null;
  value?: TemplateId;
  onChange?: (v: TemplateId) => void;
}) {
  const [internal, setInternal] = useState<TemplateId>(defaultValue ?? "CLASSIC");
  const controlled = value !== undefined;
  const selected = controlled ? value! : internal;
  const setSelected = (v: TemplateId) => {
    if (!controlled) setInternal(v);
    onChange?.(v);
  };

  return (
    <div>
      {!controlled && <input type="hidden" name={name} value={selected} />}
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
              <div className="aspect-[1/1.2] w-full border-b bg-background">
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
