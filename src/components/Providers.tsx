"use client";

import { SessionProvider } from "next-auth/react";
import { AppHeader } from "./AppHeader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppHeader />
      <main>{children}</main>
    </SessionProvider>
  );
}
