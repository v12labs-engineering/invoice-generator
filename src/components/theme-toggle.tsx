"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="h-8 w-full justify-start gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground [&_svg]:size-4"
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? <Moon /> : <Sun />
      ) : (
        <Sun className="opacity-0" />
      )}
      <span suppressHydrationWarning>
        {mounted ? (isDark ? "Dark" : "Light") : ""} mode
      </span>
    </Button>
  );
}
