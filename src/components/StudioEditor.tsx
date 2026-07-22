"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimationPreview } from "./AnimationPreview";
import { BuyUsageModal } from "./BuyUsageModal";
import { generateAnimationFromPrompt, clipToRobloxExport } from "@/lib/generateAnimation";
import { useAppStore } from "@/lib/store";
import type { AnimStyle } from "@/lib/types";

export function StudioEditor() {
  const user = useAppStore((s) => s.user);
  const settings = useAppStore((s) => s.settings);
  const plan = useAppStore((s) => s.plan);
  const usageRemaining = useAppStore((s) => s.usageRemaining);
  const consumeUsage = useAppStore((s) => s.consumeUsage);
  const addClip = useAppStore((s) => s.addClip);
  const library = useAppStore((s) => s.library);
  const activeClipId = useAppStore((s) => s.activeClipId);
  const setActiveClip = useAppStore((s) => s.setActiveClip);

  const [prompt, setPrompt] = useState("cool emote: spin kick then victory pose");
  const [style, setStyle] = useState<AnimStyle>(settings.defaultStyle);
  const [duration, setDuration] = useState(2.2);
  const [intensity, setIntensity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const activeClip = useMemo(
    () => library.find((c) => c.id === activeClipId) || library[0] || null,
    [library, activeClipId],
  );

  async function generate(source: "text" | "video") {
    setError(null);
    if (!user) {
      setError("Sign in to generate animations.");
      return;
    }
    if (source === "video" && plan !== "pro") {
      setError("Video → animation is a Pro feature.");
      return;
    }
    if (source === "video" && !videoFile) {
      setError("Choose a short video clip first.");
      return;
    }
    if (!prompt.trim() && source === "text") {
      setError("Describe the animation you want.");
      return;
    }

    const quality =
      plan === "pro" && settings.aiQualityPref === "high" ? "high" : "standard";

    if (!consumeUsage(1)) {
      setBuyOpen(true);
      setError("You're out of generations. Buy more usage or upgrade to Pro.");
      return;
    }

    setBusy(true);
    try {
      // Client-side generation (static GitHub Pages has no API routes)
      await new Promise((r) => setTimeout(r, 280));
      const clip = generateAnimationFromPrompt({
        prompt:
          source === "video"
            ? `video motion: ${prompt || videoFile?.name || "uploaded clip"}`
            : prompt,
        style,
        duration: duration * intensity,
        quality,
        source,
      });
      addClip(clip);
    } catch {
      setError("Generation failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function exportClip() {
    if (!activeClip) return;
    const payload = clipToRobloxExport(activeClip);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeClip.name.replace(/\s+/g, "_")}.rbxlAnimate.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-pulse-red absolute -left-32 top-16 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
        <div className="animate-float absolute -right-16 top-28 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8">
        <div className="mb-8 max-w-3xl">
          <p className="mb-2 font-[family-name:var(--font-display)] text-sm font-semibold tracking-[0.28em] text-brand brand-glow">
            rbxlAnimate
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl">
            Make the move.
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted md:text-lg">
            Prompt a Roblox animation, scrub the R15-style preview, export clean KeyframeSequence data —
            no watermarks.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <AnimationPreview clip={activeClip} autoPlay={settings.autoPlayPreview} />
            {library.length > 0 && (
              <div className="panel panel-inset p-3">
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {library.slice(0, 8).map((clip) => (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => setActiveClip(clip.id)}
                      className={`rounded-lg border px-3 py-1 text-xs transition ${
                        clip.id === activeClip?.id
                          ? "border-brand bg-brand/20 text-white"
                          : "border-border text-muted hover:border-brand/60"
                      }`}
                    >
                      {clip.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel space-y-5 p-5 md:p-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-brand">Maker</p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Describe · preview · export
              </h2>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-muted">Prompt</span>
              <textarea
                className="input min-h-[110px] resize-y"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="wave both arms, hop twice, then point at camera"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-sm text-muted">Style</span>
                <select
                  className="input"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as AnimStyle)}
                >
                  <option value="emote">Emote</option>
                  <option value="combat">Combat</option>
                  <option value="idle">Idle</option>
                  <option value="walk">Walk</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-muted">Duration ({duration.toFixed(1)}s)</span>
                <input
                  className="mt-3 w-full accent-[var(--red)]"
                  type="range"
                  min={0.8}
                  max={6}
                  step={0.1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-muted">Intensity ({intensity.toFixed(1)}x)</span>
              <input
                className="w-full accent-[var(--red)]"
                type="range"
                min={0.6}
                max={1.4}
                step={0.05}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
              />
            </label>

            <div className="rounded-xl border border-border bg-black/35 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Video → animation</p>
                <span className="rounded-md bg-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                  Pro
                </span>
              </div>
              <input
                type="file"
                accept="video/*"
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              <button
                className="btn-ghost mt-3 w-full text-sm"
                disabled={busy}
                type="button"
                onClick={() => generate("video")}
              >
                Generate from video
              </button>
            </div>

            {error && (
              <p className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-red-100">
                {error}{" "}
                {error.includes("Sign in") && (
                  <Link href="/login" className="underline">
                    Go to login
                  </Link>
                )}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                disabled={busy}
                type="button"
                onClick={() => generate("text")}
              >
                {busy ? "Animating…" : "Generate animation"}
              </button>
              <button className="btn-ghost" disabled={!activeClip} type="button" onClick={exportClip}>
                Export
              </button>
              <button className="btn-ghost" type="button" onClick={() => setBuyOpen(true)}>
                Buy usage
              </button>
            </div>

            <p className="text-xs text-muted">
              {usageRemaining} generations left · {plan === "pro" ? "Pro quality unlocked" : "Free plan"} ·
              exports never watermarked
            </p>
          </div>
        </div>
      </div>

      <BuyUsageModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
