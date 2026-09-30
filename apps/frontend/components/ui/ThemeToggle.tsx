"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Use light theme" : "Use dark theme";

  return (
    <Tooltip label={label}>
      <Button variant="ghost" iconOnly onClick={toggleTheme} aria-label={label}>
        {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </Button>
    </Tooltip>
  );
}
