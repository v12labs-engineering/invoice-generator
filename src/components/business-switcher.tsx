"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { switchBusiness } from "@/lib/actions/businesses";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const active =
    memberships.find((m) => m.businessId === activeBusinessId) ?? memberships[0];

  function pick(id: string) {
    if (id === active?.businessId) return;
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className="w-full justify-between gap-2 px-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Building2 className="size-3.5" />
              </span>
              <span className="truncate text-sm font-medium">
                {active.businessName}
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Businesses
        </DropdownMenuLabel>
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.businessId}
            onClick={() => pick(m.businessId)}
            className="flex items-center justify-between"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{m.businessName}</span>
              <span className="text-[10px] uppercase text-muted-foreground">
                {m.role.toLowerCase()}
              </span>
            </div>
            {m.businessId === active.businessId && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/onboarding?new=1" />}>
          <Plus className="size-4" />
          New business
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
