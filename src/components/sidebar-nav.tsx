"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Briefcase,
  Target,
  BadgeCheck,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = { href: string; label: string; icon?: LucideIcon };
type NavSection = { label: string; icon: LucideIcon; items: NavItem[] };

const pinned: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const sections: NavSection[] = [
  {
    label: "Sales",
    icon: Target,
    items: [
      { href: "/deals", label: "Deals" },
      { href: "/quotes", label: "Quotes" },
      { href: "/invoices", label: "Invoices" },
      { href: "/recurring", label: "Recurring" },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    items: [
      { href: "/clients", label: "Clients" },
      { href: "/contacts", label: "Contacts" },
    ],
  },
  {
    label: "Work",
    icon: Briefcase,
    items: [
      { href: "/projects", label: "Projects" },
      { href: "/products", label: "Products" },
    ],
  },
  {
    label: "Expenses",
    icon: Receipt,
    items: [
      { href: "/expenses", label: "Expenses" },
      { href: "/subscriptions", label: "Subscriptions" },
    ],
  },
  {
    label: "People",
    icon: BadgeCheck,
    items: [
      { href: "/employees", label: "Employees" },
      { href: "/time-off", label: "Time off" },
      { href: "/documents", label: "Documents" },
    ],
  },
];

const STORAGE_KEY = "sidebar:open-sections:v3";

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

  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadOpen();
    if (stored) {
      if (activeSection) stored.add(activeSection);
      setOpen(stored);
    } else {
      setOpen(new Set(activeSection ? [activeSection] : []));
    }
    setHydrated(true);
  }, [activeSection]);

  function toggle(label: string, v: boolean) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (v) next.add(label);
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
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
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
                {Icon && <Icon />}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}

        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Collapsible
              key={section.label}
              open={isOpen(section.label)}
              onOpenChange={(v) => toggle(section.label, v)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={section.label}>
                    <SectionIcon />
                    <span>{section.label}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {section.items.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton
                          isActive={isActive(item.href)}
                          render={<Link href={item.href} />}
                        >
                          <span>{item.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
