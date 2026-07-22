"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { clipToRobloxExport } from "@/lib/generateAnimation";

export default function LibraryPage() {
  const library = useAppStore((s) => s.library);
  const removeClip = useAppStore((s) => s.removeClip);
  const setActiveClip = useAppStore((s) => s.setActiveClip);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-brand">Library</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Your animations</h1>
        </div>
        <Link href="/" className="btn-primary text-sm">
          New animation
        </Link>
      </div>

      {library.length === 0 ? (
        <div className="panel p-8 text-center text-muted">
          Nothing saved yet. Generate your first clip in the maker.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {library.map((clip) => (
            <div key={clip.id} className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white">{clip.name}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {clip.style} · {clip.duration.toFixed(1)}s · {clip.quality} · {clip.source}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{clip.prompt}</p>
                </div>
                <span className="rounded-md border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                  no watermark
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
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
