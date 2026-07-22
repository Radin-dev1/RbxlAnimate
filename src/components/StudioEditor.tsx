"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AnimationPreview } from "./AnimationPreview";
import { BuyUsageModal } from "./BuyUsageModal";
import { generateAnimationFromPrompt, clipToRobloxExport } from "@/lib/generateAnimation";
import { useAppStore } from "@/lib/store";
import type { AnimStyle, AnimationClip } from "@/lib/types";

export function StudioEditor() {
  const { data: session, status } = useSession();
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
    if (status !== "authenticated") {
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
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            source === "video"
              ? `video motion: ${prompt || videoFile?.name || "uploaded clip"}`
              : prompt,
          style,
          duration: duration * intensity,
          quality,
          source,
        }),
      });
      const data = await res.json();
      let clip: AnimationClip;
      if (data.clip) {
        clip = data.clip as AnimationClip;
      } else {
        clip = generateAnimationFromPrompt({
          prompt: prompt || "video capture",
          style,
          duration: duration * intensity,
          quality,
          source,
        });
      }
      if (settings.autoSave) addClip(clip);
      else {
        addClip(clip);
      }
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
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4">
        <AnimationPreview clip={activeClip} autoPlay={settings.autoPlayPreview} />
        {library.length > 0 && (
          <div className="panel p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">Recent</p>
            <div className="flex flex-wrap gap-2">
              {library.slice(0, 8).map((clip) => (
                <button
                  key={clip.id}
                  onClick={() => setActiveClip(clip.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
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

      <div className="panel space-y-5 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand">AI Studio</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Make the move</h1>
          <p className="mt-1 text-sm text-muted">
            Describe a Roblox animation. Preview on an R15-style rig, export with zero watermark.
          </p>
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
              className="w-full accent-[var(--red)]"
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

        <div className="rounded-xl border border-border bg-black/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Video → animation</p>
            <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
              Pro
            </span>
          </div>
          <input
            type="file"
            accept="video/*"
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />
          <button
            className="btn-ghost mt-3 w-full text-sm"
            disabled={busy}
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
          <button className="btn-primary" disabled={busy} onClick={() => generate("text")}>
            {busy ? "Animating…" : "Generate animation"}
          </button>
          <button className="btn-ghost" disabled={!activeClip} onClick={exportClip}>
            Export (no watermark)
          </button>
          <button className="btn-ghost" onClick={() => setBuyOpen(true)}>
            Buy more usage
          </button>
        </div>

        <p className="text-xs text-muted">
          {usageRemaining} generations left · {plan === "pro" ? "Pro quality unlocked" : "Free plan"} · Studio plugin
          comes next for backgrounds + in-place apply
        </p>
      </div>

      <BuyUsageModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
