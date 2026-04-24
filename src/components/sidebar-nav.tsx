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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavSection = { label: string; items: NavItem[] };

const pinned: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const sections: NavSection[] = [
  {
    label: "Sales",
    items: [
      { href: "/deals", label: "Deals", icon: Target },
      { href: "/quotes", label: "Quotes", icon: FileSignature },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/recurring", label: "Recurring", icon: Repeat },
    ],
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

const STORAGE_KEY = "sidebar:open-sections:v2";

function loadOpen(): Set<string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : null;
  } catch {
    return null;
  }
}

function saveOpen(open: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...open]));
}

export function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  const activeSection = sections.find((s) => s.items.some((i) => isActive(i.href)))?.label;

  // Default state: only the active section is open. User overrides persist.
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadOpen();
    if (stored) {
      // Always force-open the active section even if user previously closed it.
      if (activeSection) stored.add(activeSection);
      setOpen(stored);
    } else {
      setOpen(new Set(activeSection ? [activeSection] : []));
    }
    setHydrated(true);
  }, [activeSection]);

  function toggle(label: string, isOpen: boolean) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(label);
      else next.delete(label);
      saveOpen(next);
      return next;
    });
  }

  function isOpen(label: string) {
    if (!hydrated) return label === activeSection;
    return open.has(label);
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {pinned.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {sections.map((section) => {
        const sectionActive = section.label === activeSection;
        return (
          <Collapsible
            key={section.label}
            open={isOpen(section.label)}
            onOpenChange={(v) => toggle(section.label, v)}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel
                  className="group/label flex w-full cursor-pointer items-center justify-between pr-2 hover:text-sidebar-foreground data-[state=open]:[&_svg]:rotate-90"
                  data-active={sectionActive || undefined}
                >
                  <span>{section.label}</span>
                  <ChevronRight className="size-3.5 shrink-0 transition-transform duration-200" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            isActive={isActive(item.href)}
                            tooltip={item.label}
                            render={<Link href={item.href} />}
                          >
                            <Icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        );
      })}

    </>
  );
}

export const sidebarBottomNav = [
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];
