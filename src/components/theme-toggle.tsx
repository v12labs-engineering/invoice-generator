"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="w-full justify-start gap-2"
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      <span>{isDark ? "Dark" : "Light"} mode</span>
    </Button>
  );
}
