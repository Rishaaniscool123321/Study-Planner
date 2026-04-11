export type ColorThemeId =
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
  | "bubblegum";

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  description: string;
  preview: { bg: string; primary: string; text: string };
  tag?: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  // ── Classic ───────────────────────────────────────────────────────
  {
    id: "default",
    name: "Indigo",
    description: "Classic indigo on white",
    preview: { bg: "#f8fafc", primary: "#6366f1", text: "#1e293b" },
  },
  {
    id: "void",
    name: "Void",
    description: "Indigo on deep black",
    preview: { bg: "#05050f", primary: "#818cf8", text: "#e2e8f0" },
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "Near-monochrome minimal",
    preview: { bg: "#f7f7f7", primary: "#374151", text: "#111827" },
  },
  {
    id: "sepia",
    name: "Sepia",
    description: "Warm parchment tones",
    preview: { bg: "#f5ede0", primary: "#92521e", text: "#3a200e" },
  },
  // ── Terminal ──────────────────────────────────────────────────────
  {
    id: "matrix",
    name: "Matrix",
    description: "Green on black",
    preview: { bg: "#020c04", primary: "#00e645", text: "#00ff47" },
    tag: "terminal",
  },
  {
    id: "hacker",
    name: "Hacker",
    description: "Black on green",
    preview: { bg: "#1a7a2e", primary: "#000000", text: "#000000" },
    tag: "terminal",
  },
  {
    id: "blood-moon",
    name: "Blood Moon",
    description: "Deep red on near-black",
    preview: { bg: "#0d0204", primary: "#e0251a", text: "#f0d5d3" },
    tag: "terminal",
  },
  {
    id: "monokai",
    name: "Monokai",
    description: "The legendary editor theme",
    preview: { bg: "#272822", primary: "#a6e22e", text: "#f8f8f2" },
    tag: "terminal",
  },
  // ── Editor Famous ─────────────────────────────────────────────────
  {
    id: "dracula",
    name: "Dracula",
    description: "Purple darkness, the OG dark theme",
    preview: { bg: "#282a36", primary: "#bd93f9", text: "#f8f8f2" },
    tag: "editor",
  },
  {
    id: "nord",
    name: "Nord",
    description: "Arctic blues & slate grays",
    preview: { bg: "#2e3440", primary: "#5e81ac", text: "#eceff4" },
    tag: "editor",
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    description: "Earthy retro warmth",
    preview: { bg: "#282828", primary: "#fabd2f", text: "#ebdbb2" },
    tag: "editor",
  },
  // ── Wild & Crazy ──────────────────────────────────────────────────
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon cyan + magenta on dark",
    preview: { bg: "#08020f", primary: "#00ffe7", text: "#f0d0ff" },
    tag: "wild",
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    description: "Retro pink & purple dream",
    preview: { bg: "#130820", primary: "#ff71ce", text: "#ddb4ff" },
    tag: "wild",
  },
  {
    id: "neon-80s",
    name: "80s Neon",
    description: "Hot pink & teal arcade",
    preview: { bg: "#080b1a", primary: "#00f5d4", text: "#ffffff" },
    tag: "wild",
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    description: "Soft pastel pop",
    preview: { bg: "#fdf4ff", primary: "#d946ef", text: "#4a1564" },
    tag: "wild",
  },
  // ── Nature ────────────────────────────────────────────────────────
  {
    id: "matcha",
    name: "Matcha",
    description: "Soft sage on cream",
    preview: { bg: "#f4f7f0", primary: "#4d7c4e", text: "#1f2e1f" },
    tag: "nature",
  },
  {
    id: "lime-zest",
    name: "Lime",
    description: "Lime green on white",
    preview: { bg: "#f9fff3", primary: "#65a30d", text: "#1a2e05" },
    tag: "nature",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Teal on dark slate",
    preview: { bg: "#070f12", primary: "#14b8a6", text: "#e2f8f7" },
    tag: "nature",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange on cream",
    preview: { bg: "#fff8f2", primary: "#ea580c", text: "#3a1a06" },
    tag: "nature",
  },
  // ── Vibrant ───────────────────────────────────────────────────────
  {
    id: "red-alert",
    name: "Red Alert",
    description: "Crimson on white",
    preview: { bg: "#ffffff", primary: "#dc2626", text: "#1c0a0a" },
    tag: "vibrant",
  },
  {
    id: "candy",
    name: "Candy",
    description: "Pink on soft white",
    preview: { bg: "#fff5f9", primary: "#ec4899", text: "#3b0a23" },
    tag: "vibrant",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Blue on deep navy",
    preview: { bg: "#020816", primary: "#3b82f6", text: "#e2e8f0" },
    tag: "vibrant",
  },
];
