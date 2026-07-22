"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnimStyle, AnimationClip, Plan } from "./types";
import { FREE_MONTHLY_USAGE, PRO_MONTHLY_USAGE } from "./types";

interface UserSettings {
  defaultStyle: AnimStyle;
  autoPlayPreview: boolean;
  exportFormat: "json" | "plugin";
  accentIntensity: "soft" | "bold";
  aiQualityPref: "standard" | "high";
  contentFilter: "strict" | "standard" | "off";
  autoSave: boolean;
  emailOnComplete: boolean;
  lowUsageWarning: boolean;
  robloxLinked: boolean;
  robloxUsername: string;
}

interface AppState {
  plan: Plan;
  usageRemaining: number;
  periodResetAt: string;
  library: AnimationClip[];
  activeClipId: string | null;
  settings: UserSettings;
  setPlan: (plan: Plan) => void;
  setUsage: (n: number) => void;
  consumeUsage: (n?: number) => boolean;
  addUsage: (n: number) => void;
  upgradeToPro: () => void;
  addClip: (clip: AnimationClip) => void;
  removeClip: (id: string) => void;
  setActiveClip: (id: string | null) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  resetPeriodIfNeeded: () => void;
}

const defaultSettings: UserSettings = {
  defaultStyle: "emote",
  autoPlayPreview: true,
  exportFormat: "json",
  accentIntensity: "bold",
  aiQualityPref: "standard",
  contentFilter: "standard",
  autoSave: true,
  emailOnComplete: true,
  lowUsageWarning: true,
  robloxLinked: false,
  robloxUsername: "",
};

function nextPeriodReset() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      plan: "free",
      usageRemaining: FREE_MONTHLY_USAGE,
      periodResetAt: nextPeriodReset(),
      library: [],
      activeClipId: null,
      settings: defaultSettings,
      setPlan: (plan) => set({ plan }),
      setUsage: (usageRemaining) => set({ usageRemaining }),
      consumeUsage: (n = 1) => {
        get().resetPeriodIfNeeded();
        const left = get().usageRemaining;
        if (left < n) return false;
        set({ usageRemaining: left - n });
        return true;
      },
      addUsage: (n) => set({ usageRemaining: get().usageRemaining + n }),
      upgradeToPro: () =>
        set({
          plan: "pro",
          usageRemaining: PRO_MONTHLY_USAGE,
          periodResetAt: nextPeriodReset(),
        }),
      addClip: (clip) =>
        set({
          library: [clip, ...get().library].slice(0, 100),
          activeClipId: clip.id,
        }),
      removeClip: (id) =>
        set({
          library: get().library.filter((c) => c.id !== id),
          activeClipId: get().activeClipId === id ? null : get().activeClipId,
        }),
      setActiveClip: (activeClipId) => set({ activeClipId }),
      updateSettings: (partial) =>
        set({ settings: { ...get().settings, ...partial } }),
      resetPeriodIfNeeded: () => {
        const resetAt = new Date(get().periodResetAt).getTime();
        if (Date.now() > resetAt) {
          const grant = get().plan === "pro" ? PRO_MONTHLY_USAGE : FREE_MONTHLY_USAGE;
          set({ usageRemaining: grant, periodResetAt: nextPeriodReset() });
        }
      },
    }),
    { name: "rbxlanimate-store-v1" },
  ),
);
