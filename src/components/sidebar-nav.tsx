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
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <SidebarMenu className="gap-1 py-1">
      {nav.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")) ||
          (item.href !== "/dashboard" && pathname === item.href);
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              isActive={active}
              tooltip={item.label}
              render={<Link href={item.href} />}
              className={cn(
                "h-11 gap-3 rounded-lg px-3 text-[0.95rem] font-medium transition-colors",
                "[&_svg]:size-5 [&_svg]:shrink-0",
                "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                "data-active:bg-primary/10 data-active:text-primary data-active:font-semibold",
                "data-active:[&_svg]:text-primary",
                "group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:px-0",
              )}
            >
              <Icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
