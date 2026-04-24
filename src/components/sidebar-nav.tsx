"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Repeat,
  Settings,
  UsersRound,
  Receipt,
  Store,
  Briefcase,
  UserCircle,
  Target,
  FileSignature,
  BadgeCheck,
  CalendarDays,
  FileBox,
  ChevronRight,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavSection = { label: string; items: NavItem[]; defaultOpen?: boolean };

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    defaultOpen: true,
  },
  {
    label: "Sales",
    items: [
      { href: "/deals", label: "Deals", icon: Target },
      { href: "/quotes", label: "Quotes", icon: FileSignature },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/recurring", label: "Recurring", icon: Repeat },
    ],
    defaultOpen: true,
  },
  {
    label: "Customers",
    items: [
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/contacts", label: "Contacts", icon: UserCircle },
    ],
  },
  {
    label: "Work",
    items: [
      { href: "/projects", label: "Projects", icon: Briefcase },
      { href: "/products", label: "Products", icon: Package },
    ],
  },
  {
    label: "Expenses",
    items: [
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/subscriptions", label: "Subscriptions", icon: Store },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/employees", label: "Employees", icon: BadgeCheck },
      { href: "/time-off", label: "Time off", icon: CalendarDays },
      { href: "/documents", label: "Documents", icon: FileBox },
    ],
  },
];

const bottomNav: NavItem[] = [
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

const STORAGE_KEY = "sidebar:collapsed-sections";

function loadCollapsed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(loadCollapsed());
    setHydrated(true);
  }, []);

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href + "/"))
    );
  }

  function sectionHasActive(section: NavSection) {
    return section.items.some((item) => isActive(item.href));
  }

  function toggle(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      }
      return next;
    });
  }

  function isSectionOpen(section: NavSection) {
    // Always show if a child route is active so user never hides the current page.
    if (sectionHasActive(section)) return true;
    // Before hydration, respect defaults to avoid flash.
    if (!hydrated) return section.defaultOpen ?? false;
    return !collapsed.has(section.label);
  }

  const buttonClass = cn(
    "h-8 gap-2 rounded-md px-2 text-sm font-medium transition-colors",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    "text-muted-foreground hover:bg-accent hover:text-foreground",
    "data-active:bg-accent data-active:text-foreground data-active:font-medium",
    "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:px-0",
  );

  return (
    <SidebarMenu className="gap-0.5">
      {sections.map((section) => {
        const open = isSectionOpen(section);
        const forced = sectionHasActive(section);
        return (
          <div key={section.label}>
            <button
              type="button"
              onClick={() => !forced && toggle(section.label)}
              disabled={forced}
              className={cn(
                "mb-0.5 mt-2 flex w-full items-center justify-between gap-2 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70 transition-colors hover:text-foreground group-data-[collapsible=icon]:hidden first:mt-0",
                forced && "cursor-default hover:text-muted-foreground/70",
              )}
            >
              <span>{section.label}</span>
              {!forced && (
                <ChevronRight
                  className={cn(
                    "size-3 transition-transform",
                    open && "rotate-90",
                  )}
                />
              )}
            </button>
            {open &&
              section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                      className={buttonClass}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
          </div>
        );
      })}
      <div className="mt-2">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                tooltip={item.label}
                render={<Link href={item.href} />}
                className={buttonClass}
              >
                <Icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </div>
    </SidebarMenu>
  );
}
