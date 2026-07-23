"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { applyThemeToDocument } from "@/lib/themes";
import { AppHeader } from "./AppHeader";

export function Providers({ children }: { children: React.ReactNode }) {
  const themeId = useAppStore((s) => s.settings.themeId);
  const pathname = usePathname();
  const hideHeader = pathname === "/login" || pathname === "/login/";

  useEffect(() => {
    applyThemeToDocument(themeId);
  }, [themeId]);

  return (
    <>
      {!hideHeader && <AppHeader />}
      <main>{children}</main>
    </>
  );
}
