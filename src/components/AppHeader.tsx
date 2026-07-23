"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ThemePicker } from "./ThemePicker";

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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-black/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link
          href="/"
          className="group font-[family-name:var(--font-display)] text-lg font-black tracking-[0.02em]"
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
                className={`rounded-xl px-3.5 py-1.5 text-sm transition ${
                  active
                    ? "bg-brand/20 text-white shadow-[0_0_20px_rgba(var(--brand-rgb),0.15)]"
                    : "text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemePicker compact className="hidden lg:flex" />
          <div className="hidden rounded-xl border border-border/80 bg-black/40 px-3 py-1.5 text-xs text-muted sm:block">
            <span className={plan === "pro" ? "font-semibold text-brand" : ""}>{plan.toUpperCase()}</span>
            <span className="mx-1.5 text-border">·</span>
            <span>{usageRemaining} gens</span>
          </div>
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                className="hidden max-w-[9rem] truncate rounded-xl border border-border/80 bg-black/40 px-3 py-1.5 text-xs text-muted md:inline-block"
                title={user.email}
              >
                {user.name}
              </span>
              <button
                className="btn-ghost px-3 py-1.5 text-sm sm:px-4"
                onClick={() => signOut()}
                type="button"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary px-3 py-1.5 text-sm sm:px-4">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
