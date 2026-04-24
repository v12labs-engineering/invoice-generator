"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LayoutDashboard } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Item = { href: string; label: string; icon: typeof LayoutDashboard };

export function SidebarBottomNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <SidebarMenu>
      {items.map((item) => {
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
  );
}
