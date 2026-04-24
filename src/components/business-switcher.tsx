"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { switchBusiness } from "@/lib/actions/businesses";
import { cn } from "@/lib/utils";

export type Membership = {
  businessId: string;
  businessName: string;
  role: "OWNER" | "MEMBER";
};

export function BusinessSwitcher({
  memberships,
  activeBusinessId,
}: {
  memberships: Membership[];
  activeBusinessId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const active =
    memberships.find((m) => m.businessId === activeBusinessId) ?? memberships[0];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function pick(id: string) {
    if (id === active?.businessId) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      const res = await switchBusiness(id);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (!active) return null;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group/btn inline-flex h-10 w-full shrink-0 items-center gap-2 rounded-md px-2 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-expanded:bg-accent disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="size-3.5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start text-left leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate text-sm font-medium">{active.businessName}</span>
          <span className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            {active.role.toLowerCase()}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full z-50 mt-1 min-w-max overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <div className="px-2 py-1 text-xs text-muted-foreground">Businesses</div>
          {memberships.map((m) => {
            const isActive = m.businessId === active.businessId;
            return (
              <button
                key={m.businessId}
                type="button"
                role="menuitem"
                onClick={() => pick(m.businessId)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent/60",
                )}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{m.businessName}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {m.role.toLowerCase()}
                  </span>
                </div>
                {isActive && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
          <div className="my-1 h-px bg-border" />
          <Link
            href="/onboarding?new=1"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="size-4" />
            New business
          </Link>
        </div>
      )}
    </div>
  );
}
