"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimationPreview } from "./AnimationPreview";
import { BuyUsageModal } from "./BuyUsageModal";
import { generateAnimationFromPrompt, clipToRobloxExport } from "@/lib/generateAnimation";
import { useAppStore } from "@/lib/store";
import type { AnimStyle, PreviewMode, RigType } from "@/lib/types";

const PROMPT_CHIPS = [
  "backflip",
  "frontflip then victory",
  "spin then kick then victory",
  "wave both arms then point at camera",
  "combat: punch then dodge then slash",
  "walk cycle confident stride",
];

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
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [prompt, setPrompt] = useState("backflip");
  const [style, setStyle] = useState<AnimStyle>(settings.defaultStyle);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(
    (settings.defaultPreviewMode as PreviewMode) || settings.defaultRig || "r15",
  );
  const [intensity, setIntensity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const activeClip = useMemo(
    () => library.find((c) => c.id === activeClipId) || library[0] || null,
    [library, activeClipId],
  );

  const generateRig: RigType = previewMode === "r6" ? "r6" : "r15";

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
      await new Promise((r) => setTimeout(r, highQualityDelay(quality)));
      const clip = generateAnimationFromPrompt({
        prompt:
          source === "video"
            ? `video motion: ${prompt || videoFile?.name || "uploaded clip"}`
            : prompt,
        style,
        quality,
        source,
        // Dual stores R15 master; R6 side converts in the preview
        rig: generateRig,
        intensity,
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
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-70" />
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-pulse-red absolute -left-28 top-10 h-[22rem] w-[22rem] rounded-full bg-brand/20 blur-[90px]" />
        <div className="animate-drift absolute -right-20 top-24 h-[26rem] w-[26rem] rounded-full bg-brand/12 blur-[100px]" />
        <div className="animate-float absolute bottom-10 left-1/3 h-48 w-48 rounded-full bg-brand/8 blur-[70px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10">
        <div className="stagger-1 mb-10 max-w-3xl">
          <p className="eyebrow brand-glow mb-4">rbxlAnimate</p>
          <h1 className="hero-brand text-[clamp(2.6rem,7vw,4.6rem)] text-white">
            Make the
            <span className="block text-brand brand-glow">move.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted md:text-lg">
            Prompt multi-step Roblox motion. Preview on real R15 / R6 Blender rigs. Export clean
            KeyframeSequence JSON — never watermarked.
          </p>
        </div>

        <div className="stagger-2 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-4">
            <AnimationPreview
              clip={activeClip}
              rig={previewMode}
              autoPlay={settings.autoPlayPreview}
              generating={busy}
            />
            {library.length > 0 && (
              <div className="panel panel-inset p-3.5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {library.slice(0, 8).map((clip) => (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => setActiveClip(clip.id)}
                      className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                        clip.id === activeClip?.id
                          ? "border-brand bg-brand/20 text-white shadow-[0_0_20px_rgba(225,6,0,0.2)]"
                          : "border-border text-muted hover:border-brand/60 hover:text-white"
                      }`}
                    >
                      {clip.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel panel-hot stagger-3 space-y-5 p-5 md:p-6">
            <div>
              <p className="eyebrow">Maker</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
                Describe · preview · export
              </h2>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-muted">Prompt</span>
              <textarea
                className="input min-h-[118px] resize-y"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="spin then kick then victory pose"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="rounded-lg border border-border/80 bg-black/30 px-2.5 py-1 text-[11px] text-muted transition hover:border-brand/50 hover:text-white"
                  onClick={() => setPrompt(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            <label className="block space-y-2">
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

            <div className="space-y-2">
              <span className="text-sm text-muted">Rig</span>
              <div className="rig-toggle" role="group" aria-label="Rig type">
                {(["r15", "r6", "dual"] as PreviewMode[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={previewMode === id ? "is-active" : ""}
                    onClick={() => {
                      setPreviewMode(id);
                      updateSettings({
                        defaultPreviewMode: id,
                        defaultRig: id === "dual" ? "r15" : id,
                      });
                    }}
                  >
                    {id === "dual" ? "Dual" : id.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted">
                Dual shows R15 and R6 side by side playing the same animation.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-muted">Intensity ({intensity.toFixed(1)}x)</span>
              <input
                className="range"
                type="range"
                min={0.6}
                max={1.4}
                step={0.05}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
              />
            </label>

            <div className="rounded-2xl border border-border bg-black/40 p-3.5">
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
              <p className="rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-red-100">
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
                className={`btn-primary ${busy ? "is-busy" : ""}`}
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

function highQualityDelay(quality: "standard" | "high") {
  return quality === "high" ? 520 : 320;
}
