"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/** Switches between daylight and evening mode. Icons swap with CSS so the server render matches. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle evening mode"
      title="Toggle evening mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <MoonIcon aria-hidden className="dark:hidden" />
      <SunIcon aria-hidden className="hidden dark:block" />
    </Button>
  );
}
