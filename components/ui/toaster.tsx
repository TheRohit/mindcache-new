"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { theme = "system" } = useTheme();

  return <Sonner richColors closeButton theme={theme as "light" | "dark" | "system"} />;
}

