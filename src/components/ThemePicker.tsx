"use client";

import { THEMES, type ThemeId } from "@/lib/themes";
import { useAppStore } from "@/lib/store";

export function ThemePicker({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const themeId = useAppStore((s) => s.settings.themeId);
  const updateSettings = useAppStore((s) => s.updateSettings);

  function select(id: ThemeId) {
    updateSettings({ themeId: id });
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} title="Site style">
        {THEMES.map((theme) => {
          const active = theme.id === themeId;
          return (
            <button
              key={theme.id}
              type="button"
              aria-label={theme.name}
              title={theme.name}
              onClick={() => select(theme.id)}
              className={`relative h-6 w-6 rounded-full border transition ${
                active
                  ? "scale-110 border-white shadow-[0_0_12px_var(--glow)]"
                  : "border-white/20 opacity-80 hover:opacity-100"
              }`}
              style={{
                background: `radial-gradient(circle at 50% 45%, ${theme.swatch} 0 42%, ${theme.field} 43% 100%)`,
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <p className="text-sm text-muted">Site style</p>
        <p className="mt-1 text-xs text-muted">Live theme — updates the whole maker instantly.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((theme) => {
          const active = theme.id === themeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => select(theme.id)}
              className={`group overflow-hidden rounded-2xl border text-left transition ${
                active
                  ? "border-[color:var(--red)] shadow-[0_0_28px_var(--glow-soft)]"
                  : "border-border hover:border-[color:var(--border-hot)]"
              }`}
            >
              <div
                className="relative flex aspect-[5/3] items-center justify-center"
                style={{ background: theme.field }}
              >
                <div
                  className="h-[58%] w-[58%] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                  style={{ background: theme.swatch }}
                />
                {active && (
                  <span className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Active
                  </span>
                )}
              </div>
              <div className="flex">
                <div
                  className="flex-1 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-white"
                  style={{ background: theme.legend[0] }}
                >
                  {theme.legend[0]}
                </div>
                <div
                  className="flex-1 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-white"
                  style={{ background: theme.legend[1] }}
                >
                  {theme.legend[1]}
                </div>
              </div>
              <div className="border-t border-white/5 bg-black/30 px-3 py-2.5">
                <p className="text-sm font-semibold text-white">{theme.name}</p>
                <p className="text-xs text-muted">{theme.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
