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
      className="h-11 w-full justify-start gap-3 rounded-lg px-3 text-[0.95rem] font-medium text-muted-foreground hover:bg-primary/5 hover:text-foreground [&_svg]:size-5"
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
