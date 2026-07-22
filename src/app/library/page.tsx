"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { clipToRobloxExport } from "@/lib/generateAnimation";

export default function LibraryPage() {
  const library = useAppStore((s) => s.library);
  const removeClip = useAppStore((s) => s.removeClip);
  const setActiveClip = useAppStore((s) => s.setActiveClip);

  return (
    <div className="page-enter relative mx-auto max-w-6xl px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 surface-grid opacity-40" />
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Library</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
            Your animations
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Every clip stays local in this browser. Export anytime — no watermarks.
          </p>
        </div>
        <Link href="/" className="btn-primary text-sm">
          New animation
        </Link>
      </div>

      {library.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg text-white">Nothing saved yet</p>
          <p className="mt-2 text-muted">Generate your first clip in the maker.</p>
          <Link href="/" className="btn-primary mt-5 inline-flex text-sm">
            Open maker
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {library.map((clip) => (
            <div key={clip.id} className="panel group p-5 transition hover:border-brand/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white transition group-hover:text-brand-hot">
                    {clip.name}
                  </h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                    {clip.style} · {clip.duration.toFixed(1)}s · {clip.quality} · {clip.source}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{clip.prompt}</p>
                </div>
                <span className="rounded-md border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                  no watermark
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="btn-ghost text-xs"
                  onClick={() => setActiveClip(clip.id)}
                >
                  Open
                </Link>
                <button
                  className="btn-ghost text-xs"
                  type="button"
                  onClick={() => {
                    const payload = clipToRobloxExport(clip);
                    const blob = new Blob([JSON.stringify(payload, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${clip.name.replace(/\s+/g, "_")}.rbxlAnimate.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export
                </button>
                <button className="btn-ghost text-xs" type="button" onClick={() => removeClip(clip.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
