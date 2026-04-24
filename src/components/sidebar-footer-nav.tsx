"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Settings, Sun, UsersRound } from "lucide-react";
import { useTheme } from "next-themes";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarFooterNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive("/team")}
          tooltip="Team"
          render={<Link href="/team" />}
        >
          <UsersRound />
          <span>Team</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive("/settings")}
          tooltip="Settings"
          render={<Link href="/settings" />}
        >
          <Settings />
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={mounted ? (isDark ? "Light mode" : "Dark mode") : "Theme"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          suppressHydrationWarning
        >
          {mounted ? isDark ? <Sun /> : <Moon /> : <Sun className="opacity-0" />}
          <span suppressHydrationWarning>
            {mounted ? (isDark ? "Light" : "Dark") : ""} mode
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
