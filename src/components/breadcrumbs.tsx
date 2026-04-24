"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  invoices: "Invoices",
  clients: "Clients",
  contacts: "Contacts",
  deals: "Deals",
  quotes: "Quotes",
  projects: "Projects",
  products: "Products",
  recurring: "Recurring",
  expenses: "Expenses",
  subscriptions: "Subscriptions",
  employees: "Employees",
  "time-off": "Time off",
  documents: "Documents",
  team: "Team",
  settings: "Settings",
  new: "New",
  import: "Import",
  "generate-doc": "Generate document",
};

function labelFor(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  // IDs (cuid-like) → "Details"
  if (/^c[a-z0-9]{20,}$/.test(segment)) return "Details";
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <div key={c.href} className="flex min-w-0 items-center gap-1">
            {i > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
            )}
            {isLast ? (
              <span className="truncate font-medium">{c.label}</span>
            ) : (
              <Link
                href={c.href}
                className="truncate text-muted-foreground hover:text-foreground"
              >
                {c.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
