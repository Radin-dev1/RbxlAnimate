"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { applyThemeToDocument } from "@/lib/themes";
import { AppHeader } from "./AppHeader";

export function Providers({ children }: { children: React.ReactNode }) {
  const themeId = useAppStore((s) => s.settings.themeId);

  useEffect(() => {
    applyThemeToDocument(themeId);
  }, [themeId]);

  return (
    <>
      <AppHeader />
      <main>{children}</main>
    </>
  );
}
