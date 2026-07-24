"use client";

import { useMemo, useState } from "react";
import { AnimationPreview } from "./AnimationPreview";
import { BuyUsageModal } from "./BuyUsageModal";
import {
  generateAnimationFromPrompt,
  generateDuelOpponent,
  clipToRobloxExport,
  clipToRobloxExportString,
} from "@/lib/generateAnimation";
import { fetchYoutubeMeta } from "@/lib/youtube";
import { useAppStore } from "@/lib/store";
import type { AnimStyle, PreviewMode } from "@/lib/types";

const PROMPT_CHIPS = [
  "backflip",
  "frontflip then victory",
  "spin then kick then victory",
  "wave both arms then point at camera",
  "punch then dodge then slash",
  "dance then flex then clap",
];

const DUEL_CHIPS = [
  "boxing match punch dodge kick",
  "sword fight slash block slash",
  "street brawl punch kick stomp",
  "anime duel slash dodge slash",
];

export function StudioEditor() {
  const user = useAppStore((s) => s.user);
  const signIn = useAppStore((s) => s.signIn);
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
  const [mode, setMode] = useState<PreviewMode>(
    settings.defaultPreviewMode === "duel" ? "duel" : "solo",
  );
  const [intensity, setIntensity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedInfo, setParsedInfo] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [ytPreview, setYtPreview] = useState<{
    title: string;
    thumbnail: string;
    inferred: string;
  } | null>(null);

  const activeClip = useMemo(
    () => library.find((c) => c.id === activeClipId) || library[0] || null,
    [library, activeClipId],
  );

  async function runGenerate(opts: {
    source: "text" | "video";
    promptText: string;
    youtube?: { id: string; title?: string; thumbnail?: string };
  }) {
    setError(null);
    setParsedInfo(null);
    if (!opts.promptText.trim()) {
      setError("Describe the animation you want.");
      return;
    }
    // Guest-friendly: auto-create a local session if needed
    if (!user) {
      signIn("guest@rbxlAnimate.local", { name: "Guest" });
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
      // Yield one frame so the Generating state paints, then generate immediately
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      const heroPrompt =
        mode === "duel" && !/punch|kick|slash|dodge|fight|duel|box/i.test(opts.promptText)
          ? `${opts.promptText} then punch then dodge`
          : opts.promptText;

      const clip = generateAnimationFromPrompt({
        prompt: heroPrompt,
        style: mode === "duel" ? "combat" : style,
        quality,
        source: opts.source,
        rig: "r15",
        intensity,
        variation: Math.random(),
        preferPromptStyle: true,
      });

      if (mode === "duel") {
        const rival = generateDuelOpponent(clip, Math.random());
        clip.rival = rival;
        clip.duelSide = "A";
        rival.duelSide = "B";
        rival.duelPartnerId = clip.id;
        clip.duelPartnerId = rival.id;
      }

      if (opts.youtube) clip.youtube = opts.youtube;

      setParsedInfo(
        `Parsed: ${(clip.parsedSteps || []).join(" → ") || "motion"}${
          mode === "duel" ? " · Duel rival generated" : ""
        }`,
      );
      addClip(clip);
    } catch {
      setError("Generation failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function generateText() {
    await runGenerate({ source: "text", promptText: prompt });
  }

  async function generateFromFile() {
    if (!videoFile) {
      setError("Choose a short video file first.");
      return;
    }
    await runGenerate({
      source: "video",
      promptText: prompt || `video motion from ${videoFile.name}`,
    });
  }

  async function generateFromYoutube() {
    if (!youtubeUrl.trim()) {
      setError("Paste a YouTube link first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const meta = await fetchYoutubeMeta(youtubeUrl, prompt);
      if (!meta) {
        setError("Could not parse that YouTube URL.");
        setBusy(false);
        return;
      }
      setYtPreview({
        title: meta.title,
        thumbnail: meta.thumbnail,
        inferred: meta.inferredPrompt,
      });
      setBusy(false);
      await runGenerate({
        source: "video",
        promptText: meta.inferredPrompt,
        youtube: { id: meta.id, title: meta.title, thumbnail: meta.thumbnail },
      });
    } catch {
      setBusy(false);
      setError("YouTube lookup failed. Try again or describe the motion in the prompt.");
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
    if (activeClip.rival) {
      const rivalPayload = clipToRobloxExport(activeClip.rival);
      const blob2 = new Blob([JSON.stringify(rivalPayload, null, 2)], { type: "application/json" });
      const url2 = URL.createObjectURL(blob2);
      const a2 = document.createElement("a");
      a2.href = url2;
      a2.download = `${activeClip.rival.name.replace(/\s+/g, "_")}.rbxlAnimate.json`;
      a2.click();
      URL.revokeObjectURL(url2);
    }
  }

  async function copyForStudio() {
    if (!activeClip) return;
    try {
      await navigator.clipboard.writeText(clipToRobloxExportString(activeClip));
      setParsedInfo(
        activeClip.rival
          ? "Copied hero JSON for Studio. Download JSONs for the rival clip too."
          : "Copied JSON — paste into the rbxlAnimate Studio plugin importer.",
      );
    } catch {
      setError("Clipboard blocked — use Download JSON instead.");
    }
  }

  const chips = mode === "duel" ? DUEL_CHIPS : PROMPT_CHIPS;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-70" />
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-pulse-red absolute -left-28 top-10 h-[22rem] w-[22rem] rounded-full bg-brand/20 blur-[90px]" />
        <div className="animate-drift absolute -right-20 top-24 h-[26rem] w-[26rem] rounded-full bg-brand/12 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10">
        <div className="stagger-1 mb-10 max-w-3xl">
          <p className="eyebrow brand-glow mb-4">rbxlAnimate</p>
          <h1 className="hero-brand text-[clamp(2.6rem,7vw,4.6rem)] text-white">
            Make the
            <span className="block text-brand brand-glow">move.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted md:text-lg">
            Type a move (or a whole combo), preview on R15, then Copy for Studio — paste into the
            plugin and it lands in AnimSaves. Solo or Duel. No watermarks.
          </p>
        </div>

        <div className="stagger-2 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-4">
            <AnimationPreview
              clip={activeClip}
              rivalClip={activeClip?.rival || null}
              mode={mode}
              autoPlay={settings.autoPlayPreview}
              generating={busy}
            />
            {library.length > 0 && (
              <div className="panel panel-inset p-3.5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {library.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveClip(c.id)}
                      className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                        c.id === activeClip?.id
                          ? "border-brand bg-brand/20 text-white"
                          : "border-border text-muted hover:border-brand/60 hover:text-white"
                      }`}
                    >
                      {c.rival ? "⚔ " : ""}
                      {c.name}
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

            <div className="space-y-2">
              <span className="text-sm text-muted">Mode</span>
              <div className="rig-toggle" role="group" aria-label="Preview mode">
                {(["solo", "duel"] as PreviewMode[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={mode === id ? "is-active" : ""}
                    onClick={() => {
                      setMode(id);
                      updateSettings({ defaultPreviewMode: id, defaultRig: "r15" });
                      if (id === "duel") setStyle("combat");
                    }}
                  >
                    {id === "duel" ? "Duel fight" : "Solo"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted">
                {mode === "duel"
                  ? "Two R15 avatars face off — you vs rival with counter moves."
                  : "One R15 character. Prompt drives the exact moves (backflip, wave, …)."}
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm text-muted">Prompt</span>
              <textarea
                className="input min-h-[110px] resize-y"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === "duel" ? "boxing match punch dodge kick" : "backflip"}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
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

            {mode === "solo" && (
              <label className="block space-y-2">
                <span className="text-sm text-muted">Style hint (prompt wins if clear)</span>
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
            )}

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

            <div className="rounded-2xl border border-border bg-black/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">YouTube → motion idea</p>
                <span className="rounded-md border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Title infer
                </span>
              </div>
              <p className="text-[11px] text-muted">
                We read the video <strong className="text-white/80">title</strong> (not pixels) and
                turn it into a motion prompt. Free to try.
              </p>
              <input
                className="input text-sm"
                placeholder="https://youtube.com/watch?v=…"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              {ytPreview && (
                <div className="flex gap-3 rounded-xl border border-border/80 bg-black/40 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ytPreview.thumbnail}
                    alt=""
                    className="h-14 w-24 rounded-lg object-cover"
                  />
                  <div className="min-w-0 text-xs">
                    <p className="truncate font-medium text-white">{ytPreview.title}</p>
                    <p className="mt-1 text-muted">Interpreted as: {ytPreview.inferred}</p>
                  </div>
                </div>
              )}
              <button
                className="btn-ghost w-full text-sm"
                disabled={busy}
                type="button"
                onClick={() => generateFromYoutube()}
              >
                Infer & generate from YouTube
              </button>
              <div className="border-t border-border/60 pt-3">
                <p className="mb-2 text-[11px] text-muted">
                  File upload uses the filename + your prompt (no frame analysis on Pages).
                </p>
                <input
                  type="file"
                  accept="video/*"
                  className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                <button
                  className="btn-ghost mt-2 w-full text-sm"
                  disabled={busy}
                  type="button"
                  onClick={() => generateFromFile()}
                >
                  Generate from file name + prompt
                </button>
              </div>
            </div>

            {parsedInfo && (
              <p className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-xs text-red-100">
                {parsedInfo}
              </p>
            )}

            {error && (
              <p className="rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                className={`btn-primary ${busy ? "is-busy" : ""}`}
                disabled={busy}
                type="button"
                onClick={() => generateText()}
              >
                {busy ? "Animating…" : mode === "duel" ? "Generate duel" : "Generate animation"}
              </button>
              <button
                className="btn-ghost"
                disabled={busy || !prompt.trim()}
                type="button"
                onClick={() => generateText()}
                title="Same prompt, new random variation"
              >
                New variation
              </button>
              <button className="btn-ghost" disabled={!activeClip} type="button" onClick={exportClip}>
                Download JSON{activeClip?.rival ? "s" : ""}
              </button>
              <button className="btn-ghost" disabled={!activeClip} type="button" onClick={copyForStudio}>
                Copy for Studio
              </button>
              <button className="btn-ghost" type="button" onClick={() => setBuyOpen(true)}>
                Buy usage
              </button>
            </div>

            <div className="rounded-xl border border-border/80 bg-black/30 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              <strong className="text-white/90">Studio:</strong> install{" "}
              <code className="text-white/80">plugin/RbxlAnimate.plugin.luau</code> → select R15 →
              paste JSON → Apply. Opens in AnimSaves for the Animation Editor.
            </div>

            <p className="text-xs text-muted">
              {usageRemaining} gens left · {plan === "pro" ? "Pro" : "Free"} · guest OK · no
              watermarks
            </p>
          </div>
        </div>
      </div>

      <BuyUsageModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
