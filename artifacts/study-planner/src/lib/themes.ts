export type BuiltInThemeId =
  | "default"
  | "matrix"
  | "hacker"
  | "void"
  | "red-alert"
  | "lime-zest"
  | "matcha"
  | "midnight"
  | "sunset"
  | "ocean"
  | "candy"
  | "graphite"
  | "cyberpunk"
  | "vaporwave"
  | "dracula"
  | "nord"
  | "gruvbox"
  | "monokai"
  | "blood-moon"
  | "neon-80s"
  | "sepia"
  | "bubblegum"
  // Tech & Sci-fi
  | "tron"
  | "alien-tech"
  | "mainframe"
  | "holographic"
  | "spaceship"
  // Game
  | "gameboy"
  | "arcade"
  | "portal"
  | "minecraft"
  | "pacman"
  // Medieval & Fantasy
  | "parchment"
  | "royal"
  | "dragon"
  | "forest-druid"
  | "castle"
  // Retro
  | "terminal-amber"
  | "newspaper"
  | "y2k"
  | "coffee"
  // Aesthetic
  | "noir"
  | "cherry-blossom"
  | "desert"
  | "arctic"
  | "forest-deep";

export type ColorThemeId = BuiltInThemeId | `custom-${string}`;

export type ThemeCategory =
  | "classic"
  | "terminal"
  | "editor"
  | "wild"
  | "nature"
  | "vibrant"
  | "tech"
  | "game"
  | "medieval"
  | "retro"
  | "aesthetic"
  | "custom";

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  description: string;
  preview: { bg: string; primary: string; text: string };
  category: ThemeCategory;
}

export const COLOR_THEMES: ColorTheme[] = [
  // ── Classic ───────────────────────────────────────────────────────
  { id: "default",    name: "Indigo",    description: "Classic indigo on white",       preview: { bg: "#f8fafc", primary: "#6366f1", text: "#1e293b" }, category: "classic" },
  { id: "void",       name: "Void",      description: "Indigo on deep black",          preview: { bg: "#05050f", primary: "#818cf8", text: "#e2e8f0" }, category: "classic" },
  { id: "graphite",   name: "Graphite",  description: "Near-monochrome minimal",       preview: { bg: "#f7f7f7", primary: "#374151", text: "#111827" }, category: "classic" },
  { id: "sepia",      name: "Sepia",     description: "Warm parchment tones",          preview: { bg: "#f5ede0", primary: "#92521e", text: "#3a200e" }, category: "classic" },

  // ── Terminal ──────────────────────────────────────────────────────
  { id: "matrix",     name: "Matrix",    description: "Green on black",                preview: { bg: "#020c04", primary: "#00e645", text: "#00ff47" }, category: "terminal" },
  { id: "hacker",     name: "Hacker",    description: "Black on green",                preview: { bg: "#1a7a2e", primary: "#000000", text: "#000000" }, category: "terminal" },
  { id: "blood-moon", name: "Blood Moon",description: "Deep red on near-black",        preview: { bg: "#0d0204", primary: "#e0251a", text: "#f0d5d3" }, category: "terminal" },
  { id: "monokai",    name: "Monokai",   description: "The legendary editor theme",    preview: { bg: "#272822", primary: "#a6e22e", text: "#f8f8f2" }, category: "terminal" },

  // ── Editor Famous ─────────────────────────────────────────────────
  { id: "dracula",    name: "Dracula",   description: "Purple darkness, the OG",       preview: { bg: "#282a36", primary: "#bd93f9", text: "#f8f8f2" }, category: "editor" },
  { id: "nord",       name: "Nord",      description: "Arctic blues & slate grays",    preview: { bg: "#2e3440", primary: "#5e81ac", text: "#eceff4" }, category: "editor" },
  { id: "gruvbox",    name: "Gruvbox",   description: "Earthy retro warmth",           preview: { bg: "#282828", primary: "#fabd2f", text: "#ebdbb2" }, category: "editor" },

  // ── Wild & Crazy ──────────────────────────────────────────────────
  { id: "cyberpunk",  name: "Cyberpunk", description: "Neon cyan + magenta on dark",   preview: { bg: "#08020f", primary: "#00ffe7", text: "#f0d0ff" }, category: "wild" },
  { id: "vaporwave",  name: "Vaporwave", description: "Retro pink & purple dream",     preview: { bg: "#130820", primary: "#ff71ce", text: "#ddb4ff" }, category: "wild" },
  { id: "neon-80s",   name: "80s Neon",  description: "Hot pink & teal arcade",        preview: { bg: "#080b1a", primary: "#00f5d4", text: "#ffffff" }, category: "wild" },
  { id: "bubblegum",  name: "Bubblegum", description: "Soft pastel pop",               preview: { bg: "#fdf4ff", primary: "#d946ef", text: "#4a1564" }, category: "wild" },

  // ── Nature ────────────────────────────────────────────────────────
  { id: "matcha",     name: "Matcha",    description: "Soft sage on cream",            preview: { bg: "#f4f7f0", primary: "#4d7c4e", text: "#1f2e1f" }, category: "nature" },
  { id: "lime-zest",  name: "Lime",      description: "Lime green on white",           preview: { bg: "#f9fff3", primary: "#65a30d", text: "#1a2e05" }, category: "nature" },
  { id: "ocean",      name: "Ocean",     description: "Teal on dark slate",            preview: { bg: "#070f12", primary: "#14b8a6", text: "#e2f8f7" }, category: "nature" },
  { id: "sunset",     name: "Sunset",    description: "Warm orange on cream",          preview: { bg: "#fff8f2", primary: "#ea580c", text: "#3a1a06" }, category: "nature" },
  { id: "forest-deep",name: "Forest",    description: "Rich evergreen night",          preview: { bg: "#0e1e14", primary: "#2db877", text: "#e7eee0" }, category: "nature" },

  // ── Vibrant ───────────────────────────────────────────────────────
  { id: "red-alert",  name: "Red Alert", description: "Crimson on white",              preview: { bg: "#ffffff", primary: "#dc2626", text: "#1c0a0a" }, category: "vibrant" },
  { id: "candy",      name: "Candy",     description: "Pink on soft white",            preview: { bg: "#fff5f9", primary: "#ec4899", text: "#3b0a23" }, category: "vibrant" },
  { id: "midnight",   name: "Midnight",  description: "Blue on deep navy",             preview: { bg: "#020816", primary: "#3b82f6", text: "#e2e8f0" }, category: "vibrant" },

  // ── Tech & Sci-Fi ─────────────────────────────────────────────────
  { id: "tron",        name: "Tron",        description: "Cyan grid on black",          preview: { bg: "#000a14", primary: "#1ad7ff", text: "#caf0ff" }, category: "tech" },
  { id: "alien-tech",  name: "Alien Tech",  description: "Acid green on dark",          preview: { bg: "#08120a", primary: "#a8ff00", text: "#c8f5b8" }, category: "tech" },
  { id: "mainframe",   name: "Mainframe",   description: "Amber CRT terminal",          preview: { bg: "#100a04", primary: "#ffae00", text: "#f0c060" }, category: "tech" },
  { id: "holographic", name: "Holographic", description: "Pearl with rainbow accents",  preview: { bg: "#f4f5fa", primary: "#9933cc", text: "#1c1d33" }, category: "tech" },
  { id: "spaceship",   name: "Spaceship",   description: "Dim red bridge lighting",     preview: { bg: "#180a0a", primary: "#dc1414", text: "#d8a0a0" }, category: "tech" },

  // ── Game ──────────────────────────────────────────────────────────
  { id: "gameboy",    name: "Gameboy",    description: "4-shade green LCD",            preview: { bg: "#9bbc8c", primary: "#0f380f", text: "#0f380f" }, category: "game" },
  { id: "arcade",     name: "Arcade",     description: "Hot pink + cyan on black",     preview: { bg: "#0a0a0a", primary: "#ff3399", text: "#ffc8e8" }, category: "game" },
  { id: "portal",     name: "Portal",     description: "Aperture orange + blue",       preview: { bg: "#101a25", primary: "#1a8cff", text: "#e0e8f0" }, category: "game" },
  { id: "minecraft",  name: "Minecraft",  description: "Earthy crafted blocks",        preview: { bg: "#e6dccc", primary: "#3d8c2c", text: "#2a1c0e" }, category: "game" },
  { id: "pacman",     name: "Pac-Man",    description: "Yellow on midnight blue",      preview: { bg: "#000033", primary: "#ffee00", text: "#ffeeaa" }, category: "game" },

  // ── Medieval & Fantasy ────────────────────────────────────────────
  { id: "parchment",  name: "Parchment",   description: "Beige with deep wine",         preview: { bg: "#ece1c8", primary: "#a32525", text: "#412817" }, category: "medieval" },
  { id: "royal",      name: "Royal",       description: "Purple velvet & gold",         preview: { bg: "#1c0e2e", primary: "#e8c641", text: "#f4e8b8" }, category: "medieval" },
  { id: "dragon",     name: "Dragon",      description: "Deep red & forged gold",       preview: { bg: "#1a0808", primary: "#e8401a", text: "#f0d8a0" }, category: "medieval" },
  { id: "forest-druid", name: "Druid",     description: "Deep green & wood brown",      preview: { bg: "#0f1f14", primary: "#2db957", text: "#e8eed8" }, category: "medieval" },
  { id: "castle",     name: "Castle",      description: "Stone gray & burgundy",        preview: { bg: "#262a2e", primary: "#bd2854", text: "#dde1e8" }, category: "medieval" },

  // ── Retro ─────────────────────────────────────────────────────────
  { id: "terminal-amber", name: "Amber CRT", description: "Classic amber terminal",     preview: { bg: "#140a02", primary: "#ffb820", text: "#ffd060" }, category: "retro" },
  { id: "newspaper",   name: "Newspaper",   description: "Black on cream serif",        preview: { bg: "#ece4cc", primary: "#141414", text: "#141414" }, category: "retro" },
  { id: "y2k",         name: "Y2K",         description: "Chrome silver + electric blue", preview: { bg: "#dde6ee", primary: "#0a78ff", text: "#0e1428" }, category: "retro" },
  { id: "coffee",      name: "Coffee Shop", description: "Warm cozy browns",            preview: { bg: "#e6dcd0", primary: "#8c4a23", text: "#321c0c" }, category: "retro" },

  // ── Aesthetic ─────────────────────────────────────────────────────
  { id: "noir",        name: "Noir",         description: "High contrast B&W",          preview: { bg: "#0a0a0a", primary: "#f4f4f4", text: "#f4f4f4" }, category: "aesthetic" },
  { id: "cherry-blossom", name: "Cherry Blossom", description: "Soft pink spring",      preview: { bg: "#fcecf2", primary: "#dc4276", text: "#481427" }, category: "aesthetic" },
  { id: "desert",      name: "Desert Dune",  description: "Warm sand & terracotta",     preview: { bg: "#ecdcc4", primary: "#c8631e", text: "#48280e" }, category: "aesthetic" },
  { id: "arctic",      name: "Arctic",       description: "Icy crystal blue",           preview: { bg: "#ecf0f4", primary: "#1e90c8", text: "#0e2840" }, category: "aesthetic" },
];

export const CATEGORY_LABELS: Record<ThemeCategory, string> = {
  classic: "Classic",
  terminal: "Terminal",
  editor: "Editor Famous",
  wild: "Wild & Crazy",
  nature: "Nature",
  vibrant: "Vibrant",
  tech: "Tech & Sci-Fi",
  game: "Game",
  medieval: "Medieval & Fantasy",
  retro: "Retro",
  aesthetic: "Aesthetic",
  custom: "My Custom Themes",
};

// ── Custom Theme support ──────────────────────────────────────────
export interface CustomTheme {
  id: `custom-${string}`;
  name: string;
  // HSL strings (e.g. "240 60% 55%") for CSS variable injection
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  card: string;
  border: string;
  muted: string;
  mutedForeground: string;
  // Preview (hex colors)
  preview: { bg: string; primary: string; text: string };
}

// Helper: convert hex → HSL string (no commas)
export function hexToHSL(hex: string): string {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = ((num >> 16) & 0xff) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hh = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hh = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hh = (b - r) / d + 2;
        break;
      case b:
        hh = (r - g) / d + 4;
        break;
    }
    hh /= 6;
  }
  return `${Math.round(hh * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hslToHex(hsl: string): string {
  const m = hsl.trim().match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);
  if (!m) return "#000000";
  const h = +m[1] / 360;
  const s = +m[2] / 100;
  const l = +m[3] / 100;
  function hue2rgb(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
