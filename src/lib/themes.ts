export type ThemeId =
  | "classic"
  | "tealPunch"
  | "aquaSlate"
  | "voltMint"
  | "roseNoir"
  | "coralSmoke"
  | "neonGrove";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Swatch circle (accent) */
  swatch: string;
  /** Swatch field / secondary */
  field: string;
  /** Legend hexes shown in UI */
  legend: [string, string];
  vars: {
    "--bg": string;
    "--bg-elevated": string;
    "--bg-panel": string;
    "--border": string;
    "--border-hot": string;
    "--text": string;
    "--muted": string;
    "--red": string;
    "--red-hot": string;
    "--red-dim": string;
    "--glow": string;
    "--glow-soft": string;
    "--brand-rgb": string;
    "--support": string;
  };
}

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function rgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "classic",
    name: "Classic Red/Black",
    blurb: "Original rbxlAnimate brand",
    swatch: "#E10600",
    field: "#050505",
    legend: ["#E10600", "#050505"],
    vars: {
      "--bg": "#050505",
      "--bg-elevated": "#0c0c0c",
      "--bg-panel": "#111111",
      "--border": "#262626",
      "--border-hot": rgba("#E10600", 0.45),
      "--text": "#f5f5f5",
      "--muted": "#8f8f8f",
      "--red": "#e10600",
      "--red-hot": "#ff2a2a",
      "--red-dim": "#7a0300",
      "--glow": rgba("#E10600", 0.4),
      "--glow-soft": rgba("#E10600", 0.14),
      "--brand-rgb": rgb("#E10600"),
      "--support": "#ff2a2a",
    },
  },
  {
    id: "tealPunch",
    name: "Teal Punch",
    blurb: "Teal highlight with brand red punch",
    swatch: "#8AE2DC",
    field: "#DF2F2D",
    legend: ["#8AE2DC", "#DF2F2D"],
    vars: {
      "--bg": "#070808",
      "--bg-elevated": "#0e1010",
      "--bg-panel": "#121616",
      "--border": "#2a3333",
      "--border-hot": rgba("#DF2F2D", 0.5),
      "--text": "#f4fafa",
      "--muted": "#8aa0a0",
      "--red": "#DF2F2D",
      "--red-hot": "#ff4a48",
      "--red-dim": "#7a1817",
      "--glow": rgba("#DF2F2D", 0.38),
      "--glow-soft": rgba("#8AE2DC", 0.16),
      "--brand-rgb": rgb("#DF2F2D"),
      "--support": "#8AE2DC",
    },
  },
  {
    id: "aquaSlate",
    name: "Aqua Slate",
    blurb: "Cool aqua over slate ink",
    swatch: "#28C0A8",
    field: "#404554",
    legend: ["#28C0A8", "#404554"],
    vars: {
      "--bg": "#16181f",
      "--bg-elevated": "#1e222c",
      "--bg-panel": "#252a36",
      "--border": "#404554",
      "--border-hot": rgba("#28C0A8", 0.5),
      "--text": "#eef3f8",
      "--muted": "#9aa3b5",
      "--red": "#28C0A8",
      "--red-hot": "#4ad4c0",
      "--red-dim": "#17685c",
      "--glow": rgba("#28C0A8", 0.4),
      "--glow-soft": rgba("#28C0A8", 0.14),
      "--brand-rgb": rgb("#28C0A8"),
      "--support": "#404554",
    },
  },
  {
    id: "voltMint",
    name: "Volt Mint",
    blurb: "Volt yellow punch, mint support",
    swatch: "#FFD82D",
    field: "#32DEAF",
    legend: ["#FFD82D", "#32DEAF"],
    vars: {
      "--bg": "#070907",
      "--bg-elevated": "#0d120e",
      "--bg-panel": "#121a14",
      "--border": "#243028",
      "--border-hot": rgba("#FFD82D", 0.45),
      "--text": "#f7fff5",
      "--muted": "#8fa898",
      "--red": "#FFD82D",
      "--red-hot": "#ffe566",
      "--red-dim": "#8a7208",
      "--glow": rgba("#FFD82D", 0.35),
      "--glow-soft": rgba("#32DEAF", 0.18),
      "--brand-rgb": rgb("#FFD82D"),
      "--support": "#32DEAF",
    },
  },
  {
    id: "roseNoir",
    name: "Rose Noir",
    blurb: "Dusty rose on deep plum",
    swatch: "#C06A6B",
    field: "#4F2A40",
    legend: ["#4F2A40", "#C06A6B"],
    vars: {
      "--bg": "#2a1522",
      "--bg-elevated": "#3a1e30",
      "--bg-panel": "#4F2A40",
      "--border": "#6a3d55",
      "--border-hot": rgba("#C06A6B", 0.5),
      "--text": "#f8ecee",
      "--muted": "#b89aa5",
      "--red": "#C06A6B",
      "--red-hot": "#d88889",
      "--red-dim": "#6e3536",
      "--glow": rgba("#C06A6B", 0.4),
      "--glow-soft": rgba("#C06A6B", 0.16),
      "--brand-rgb": rgb("#C06A6B"),
      "--support": "#4F2A40",
    },
  },
  {
    id: "coralSmoke",
    name: "Coral Smoke",
    blurb: "Coral accent, smoky muted base",
    swatch: "#F05F66",
    field: "#635653",
    legend: ["#F05F66", "#635653"],
    vars: {
      "--bg": "#141110",
      "--bg-elevated": "#1c1817",
      "--bg-panel": "#241f1e",
      "--border": "#635653",
      "--border-hot": rgba("#F05F66", 0.48),
      "--text": "#f6efed",
      "--muted": "#a89894",
      "--red": "#F05F66",
      "--red-hot": "#ff7d83",
      "--red-dim": "#8a2e33",
      "--glow": rgba("#F05F66", 0.4),
      "--glow-soft": rgba("#F05F66", 0.14),
      "--brand-rgb": rgb("#F05F66"),
      "--support": "#635653",
    },
  },
  {
    id: "neonGrove",
    name: "Neon Grove",
    blurb: "Neon mint on deep forest",
    swatch: "#0BF49C",
    field: "#0C281A",
    legend: ["#0BF49C", "#0C281A"],
    vars: {
      "--bg": "#06140e",
      "--bg-elevated": "#0C281A",
      "--bg-panel": "#0f2f1f",
      "--border": "#1a4a34",
      "--border-hot": rgba("#0BF49C", 0.45),
      "--text": "#e8fff5",
      "--muted": "#7aab96",
      "--red": "#0BF49C",
      "--red-hot": "#4dffc0",
      "--red-dim": "#067a4e",
      "--glow": rgba("#0BF49C", 0.4),
      "--glow-soft": rgba("#0BF49C", 0.14),
      "--brand-rgb": rgb("#0BF49C"),
      "--support": "#0C281A",
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = "classic";

export function getTheme(id: ThemeId | string | undefined): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function applyThemeToDocument(id: ThemeId | string | undefined) {
  if (typeof document === "undefined") return;
  const theme = getTheme(id);
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}
