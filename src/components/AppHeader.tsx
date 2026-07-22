"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";

const links = [
  { href: "/", label: "Maker" },
  { href: "/library", label: "Library" },
  { href: "/pricing", label: "Pro" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  const plan = useAppStore((s) => s.plan);
  const usageRemaining = useAppStore((s) => s.usageRemaining);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-black/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="group font-[family-name:var(--font-display)] text-lg font-black tracking-[0.04em]"
        >
          <span className="text-brand brand-glow transition group-hover:brightness-110">rbxl</span>
          <span className="text-white">Animate</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active ? "bg-brand/20 text-white" : "text-muted hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-lg border border-border px-3 py-1 text-xs text-muted sm:block">
            <span className={plan === "pro" ? "text-brand" : ""}>{plan.toUpperCase()}</span>
            <span className="mx-1 text-border">·</span>
            <span>{usageRemaining} gens</span>
          </div>
          {user ? (
            <button className="btn-ghost text-sm" onClick={() => signOut()} type="button">
              Sign out
            </button>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
