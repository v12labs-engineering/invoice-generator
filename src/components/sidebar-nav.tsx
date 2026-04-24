"use client";

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
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavSection = { label: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
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

const bottomNav: NavItem[] = [
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href + "/"))
    );
  }

  const buttonClass = cn(
    "h-11 gap-3 rounded-lg px-3 text-[0.95rem] font-medium transition-colors",
    "[&_svg]:size-5 [&_svg]:shrink-0",
    "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
    "data-active:bg-primary/10 data-active:text-primary data-active:font-semibold",
    "data-active:[&_svg]:text-primary",
    "group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:px-0",
  );

  return (
    <SidebarMenu className="gap-1 py-1">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="mb-1 mt-3 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground/60 group-data-[collapsible=icon]:hidden first:mt-0">
            {section.label}
          </p>
          {section.items.map((item) => {
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
      ))}
      <div>
        <p className="mb-1 mt-3 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground/60 group-data-[collapsible=icon]:hidden" />
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
