"use client";

import { AppHeader } from "./AppHeader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main>{children}</main>
    </>
  );
}
